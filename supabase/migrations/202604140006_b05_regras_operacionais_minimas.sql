create or replace function public.validate_reservation_operational_rules()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  requester_cnh_status text;
  resource_category text;
  resource_status text;
  derived_duration_hours numeric;
  start_hour integer;
  end_hour integer;
  end_minute integer;
  end_second integer;
  has_overlapping_unavailability boolean;
  effective_check_in_at timestamptz;
  effective_check_out_at timestamptz;
  effective_existing_check_in_at timestamptz;
begin
  if tg_op = 'INSERT'
    or new.start_date is distinct from old.start_date
    or new.end_date is distinct from old.end_date
    or new.user_id is distinct from old.user_id
    or new.resource_id is distinct from old.resource_id
  then
    if new.start_date < now() then
      raise exception 'Nao e permitido reservar data ou horario no passado.';
    end if;

    if date(timezone('America/Sao_Paulo', new.start_date))
      <> date(timezone('America/Sao_Paulo', new.end_date)) then
      raise exception 'A reserva precisa comecar e terminar no mesmo dia.';
    end if;

    derived_duration_hours := extract(epoch from (new.end_date - new.start_date)) / 3600.0;

    if derived_duration_hours < 1 or derived_duration_hours > 4 then
      raise exception 'A reserva precisa ter duracao minima de 1 hora e maxima de 4 horas.';
    end if;

    if new.planned_duration_hours is not null
      and abs(new.planned_duration_hours - derived_duration_hours) > 0.01 then
      raise exception 'A duracao planejada da reserva nao corresponde ao periodo informado.';
    end if;

    start_hour := extract(hour from timezone('America/Sao_Paulo', new.start_date));
    end_hour := extract(hour from timezone('America/Sao_Paulo', new.end_date));
    end_minute := extract(minute from timezone('America/Sao_Paulo', new.end_date));
    end_second := extract(second from timezone('America/Sao_Paulo', new.end_date));

    if start_hour < 8 or start_hour > 18 then
      raise exception 'A retirada deve iniciar entre 08h e 18h.';
    end if;

    if end_hour > 19 or (end_hour = 19 and (end_minute > 0 or end_second > 0)) then
      raise exception 'A devolucao precisa acontecer ate 19h no mesmo dia.';
    end if;

    select u.cnh_status
    into requester_cnh_status
    from public.users u
    where u.id = new.user_id
    limit 1;

    if requester_cnh_status is null then
      raise exception 'Solicitante da reserva nao encontrado.';
    end if;

    if requester_cnh_status <> 'Válida' then
      raise exception 'O solicitante precisa estar com a CNH valida para reservar um veiculo.';
    end if;

    select r.category, r.status
    into resource_category, resource_status
    from public.resources r
    where r.id = new.resource_id
    limit 1;

    if resource_category is null then
      raise exception 'Veiculo da reserva nao encontrado.';
    end if;

    if resource_category <> 'Veiculo' then
      raise exception 'Apenas veiculos podem ser reservados neste fluxo.';
    end if;

    if resource_status = 'Manutencao' then
      raise exception 'O veiculo esta indisponivel por manutencao ou bloqueio operacional.';
    end if;

    select exists (
      select 1
      from public.resource_unavailability ru
      where ru.resource_id = new.resource_id
        and ru.status = 'active'
        and tstzrange(
          ru.start_at,
          coalesce(ru.end_at, ru.expected_end_at, 'infinity'::timestamptz),
          '[]'
        ) && tstzrange(new.start_date, new.end_date, '[]')
    )
    into has_overlapping_unavailability;

    if has_overlapping_unavailability then
      raise exception 'O veiculo esta indisponivel no periodo informado.';
    end if;
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if old.status = 'Reservado' and new.status = 'Cancelada' then
      return new;
    end if;

    if old.status = 'Reservado' and new.status = 'Em uso' then
      effective_check_in_at := coalesce(new.check_in_at, now());

      if new.check_in_at is null
        or new.start_mileage is null
        or new.check_in_fuel_level is null
        or new.check_in_data is null then
        raise exception 'O check-in exige vistoria completa, quilometragem e combustivel.';
      end if;

      if effective_check_in_at < old.start_date then
        raise exception 'O check-in so pode iniciar a partir do horario de retirada da reserva.';
      end if;

      if effective_check_in_at > old.end_date then
        raise exception 'A janela da reserva ja foi encerrada e nao permite check-in.';
      end if;

      select u.cnh_status
      into requester_cnh_status
      from public.users u
      where u.id = old.user_id
      limit 1;

      if requester_cnh_status <> 'Válida' then
        raise exception 'O solicitante desta reserva esta com a CNH vencida e nao pode retirar o veiculo.';
      end if;

      select exists (
        select 1
        from public.resource_unavailability ru
        where ru.resource_id = old.resource_id
          and ru.status = 'active'
          and tstzrange(
            ru.start_at,
            coalesce(ru.end_at, ru.expected_end_at, 'infinity'::timestamptz),
            '[]'
          ) @> effective_check_in_at
      )
      into has_overlapping_unavailability;

      if has_overlapping_unavailability then
        raise exception 'O veiculo esta indisponivel por manutencao ou bloqueio operacional.';
      end if;

      return new;
    end if;

    if old.status = 'Em uso' and new.status = 'Em atraso' then
      return new;
    end if;

    if old.status in ('Em uso', 'Em atraso') and new.status = 'Concluida' then
      effective_existing_check_in_at := coalesce(new.check_in_at, old.check_in_at);
      effective_check_out_at := coalesce(new.check_out_at, now());

      if effective_existing_check_in_at is null then
        raise exception 'Nao e possivel concluir check-out sem check-in valido.';
      end if;

      if new.check_out_at is null
        or new.end_mileage is null
        or new.check_out_fuel_level is null
        or new.check_out_data is null then
        raise exception 'O check-out exige vistoria completa, quilometragem e combustivel.';
      end if;

      if effective_check_out_at < effective_existing_check_in_at then
        raise exception 'O horario de devolucao nao pode ser anterior ao check-in.';
      end if;

      return new;
    end if;

    raise exception 'Transicao de status da reserva nao permitida.';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_reservation_operational_rules on public.reservations;
create trigger validate_reservation_operational_rules
before insert or update on public.reservations
for each row
execute function public.validate_reservation_operational_rules();
