create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.users (
  id text primary key,
  user_id text not null unique,
  name text not null,
  full_name text not null,
  cpf text not null unique,
  gestor_veiculo boolean not null default false,
  matricula text not null unique,
  matriz text not null,
  role text not null check (role in ('Solicitante', 'Gestor', 'Operação', 'Administrador')),
  area text not null,
  area_departamento text not null,
  centro_custo text not null,
  email text not null unique,
  email_corporativo text not null unique,
  telefone text not null,
  gestor_id text null references public.users(id),
  cnh_numero text not null,
  cnh_categoria text not null,
  cnh_uf_emissao text not null,
  cnh_status text not null check (cnh_status in ('Válida', 'Vencida')),
  cnh_data_ultima_validacao timestamptz not null default timezone('utc', now()),
  cnh_anexo text not null default '',
  termos_paytrack boolean not null default true,
  observacao text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.resources (
  id text primary key,
  vehicle_id text null unique,
  name text not null,
  code text not null unique,
  category text not null check (category in ('Veiculo', 'Equipamento', 'Material')),
  status text not null check (status in ('Disponivel', 'Reservado', 'Em uso', 'Manutencao')),
  plate text null unique,
  model text null,
  brand text null,
  year text null,
  rental_company text null,
  vehicle_category text null check (vehicle_category in ('Sedan', 'SUV', 'Pickup')),
  current_mileage text null,
  last_inspection_date timestamptz null,
  vehicle_document_attachment text null,
  vehicle_photo_attachments jsonb not null default '[]'::jsonb,
  last_maintenance_date timestamptz null,
  next_maintenance_date timestamptz null,
  last_maintenance_mileage text null,
  next_maintenance_mileage text null,
  observation text null,
  location text not null,
  capacity text null,
  description text not null,
  responsible text null,
  requires_approval boolean not null default true,
  image_hint text not null,
  next_available_at timestamptz null,
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reservations (
  id text primary key,
  code text not null unique,
  resource_id text not null references public.resources(id) on delete restrict,
  user_id text not null references public.users(id) on delete restrict,
  title text not null,
  purpose text not null,
  base text not null,
  start_date timestamptz not null,
  end_date timestamptz not null,
  planned_duration_hours numeric(5,2) null,
  status text not null check (status in ('Reservado', 'Em uso', 'Concluida', 'Cancelada', 'Em atraso')),
  notes text null,
  approver text null,
  check_in_at timestamptz null,
  check_out_at timestamptz null,
  check_in_notes text null,
  check_out_notes text null,
  start_mileage text null,
  end_mileage text null,
  check_in_checklist jsonb null,
  check_out_checklist jsonb null,
  check_in_fuel_level text null,
  check_out_fuel_level text null,
  check_in_data jsonb null,
  check_out_data jsonb null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint reservations_valid_period check (end_date >= start_date)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reservations_no_overlap_active_periods'
  ) then
    alter table public.reservations
      add constraint reservations_no_overlap_active_periods
      exclude using gist (
        resource_id with =,
        tstzrange(start_date, end_date, '[]') with &&
      )
      where (status in ('Reservado', 'Em uso', 'Em atraso'));
  end if;
end;
$$;

create table if not exists public.reservation_history (
  id text primary key,
  reservation_id text not null references public.reservations(id) on delete cascade,
  label text not null,
  timestamp timestamptz not null,
  actor text not null,
  note text null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.resource_unavailability (
  id text primary key,
  resource_id text not null references public.resources(id) on delete cascade,
  type text not null check (type in ('maintenance', 'blocked')),
  status text not null check (status in ('active', 'ended')),
  reason text not null,
  note text null,
  start_at timestamptz not null,
  expected_end_at timestamptz null,
  end_at timestamptz null,
  created_by_user_id text null references public.users(id),
  ended_by_user_id text null references public.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.audit_log (
  id text primary key,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  actor_user_id text null references public.users(id),
  actor_name text null,
  origin text not null default 'mobile-app',
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_users_role on public.users(role);
create index if not exists idx_resources_category on public.resources(category);
create index if not exists idx_resources_status on public.resources(status);
create index if not exists idx_reservations_resource_start on public.reservations(resource_id, start_date);
create index if not exists idx_reservations_user_start on public.reservations(user_id, start_date);
create index if not exists idx_reservation_history_reservation_timestamp
  on public.reservation_history(reservation_id, timestamp desc);
create index if not exists idx_resource_unavailability_resource_status
  on public.resource_unavailability(resource_id, status);
create index if not exists idx_audit_log_entity on public.audit_log(entity_type, entity_id, occurred_at desc);

do $$
begin
  begin
    alter publication supabase_realtime add table
      public.users,
      public.resources,
      public.reservations,
      public.reservation_history,
      public.resource_unavailability;
  exception
    when duplicate_object then
      null;
  end;
end;
$$;

drop trigger if exists set_updated_at_users on public.users;
create trigger set_updated_at_users
before update on public.users
for each row
execute function public.set_updated_at();

drop trigger if exists set_updated_at_resources on public.resources;
create trigger set_updated_at_resources
before update on public.resources
for each row
execute function public.set_updated_at();

drop trigger if exists set_updated_at_reservations on public.reservations;
create trigger set_updated_at_reservations
before update on public.reservations
for each row
execute function public.set_updated_at();

drop trigger if exists set_updated_at_resource_unavailability on public.resource_unavailability;
create trigger set_updated_at_resource_unavailability
before update on public.resource_unavailability
for each row
execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.resources enable row level security;
alter table public.reservations enable row level security;
alter table public.reservation_history enable row level security;
alter table public.resource_unavailability enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists users_open_access on public.users;
create policy users_open_access
on public.users
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists resources_open_access on public.resources;
create policy resources_open_access
on public.resources
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists reservations_open_access on public.reservations;
create policy reservations_open_access
on public.reservations
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists reservation_history_open_access on public.reservation_history;
create policy reservation_history_open_access
on public.reservation_history
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists resource_unavailability_open_access on public.resource_unavailability;
create policy resource_unavailability_open_access
on public.resource_unavailability
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists audit_log_open_access on public.audit_log;
create policy audit_log_open_access
on public.audit_log
for all
to anon, authenticated
using (true)
with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  public.users,
  public.resources,
  public.reservations,
  public.reservation_history,
  public.resource_unavailability,
  public.audit_log
to anon, authenticated;
