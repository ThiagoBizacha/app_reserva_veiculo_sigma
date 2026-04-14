update public.users
set
  role = 'Operação',
  gestor_veiculo = true,
  updated_at = timezone('utc', now())
where role = 'Gestor';

alter table public.users
  drop constraint if exists users_role_check;

alter table public.users
  add constraint users_role_check
  check (role in ('Solicitante', 'Operação', 'Administrador'));
