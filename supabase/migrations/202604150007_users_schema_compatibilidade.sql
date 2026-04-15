alter table public.users
  add column if not exists gestor_nome text;

update public.users as target
set
  gestor_nome = manager.full_name,
  updated_at = timezone('utc', now())
from public.users as manager
where target.gestor_id = manager.id
  and (target.gestor_nome is null or btrim(target.gestor_nome) = '');

update public.users
set
  gestor_nome = full_name,
  updated_at = timezone('utc', now())
where role = 'Administrador'
  and (gestor_nome is null or btrim(gestor_nome) = '');

update public.users
set
  email = lower(trim(coalesce(nullif(email, ''), email_corporativo))),
  updated_at = timezone('utc', now())
where email is distinct from lower(trim(coalesce(nullif(email, ''), email_corporativo)));

alter table public.users alter column name drop not null;
alter table public.users alter column area drop not null;
alter table public.users alter column email_corporativo drop not null;
alter table public.users alter column cnh_uf_emissao drop not null;
alter table public.users alter column cpf drop not null;
alter table public.users alter column cnh_numero drop not null;

create or replace function public.current_auth_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.current_app_user_id()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select u.id
  from public.users u
  where u.auth_user_id = auth.uid()
    or (
      public.current_auth_email() <> ''
      and lower(u.email) = public.current_auth_email()
    )
  order by case when u.auth_user_id = auth.uid() then 0 else 1 end
  limit 1;
$$;

create or replace function public.current_app_user_role()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select u.role
  from public.users u
  where u.auth_user_id = auth.uid()
    or (
      public.current_auth_email() <> ''
      and lower(u.email) = public.current_auth_email()
    )
  order by case when u.auth_user_id = auth.uid() then 0 else 1 end
  limit 1;
$$;

create or replace function public.link_current_user_auth(p_user_id text)
returns public.users
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_user public.users;
  normalized_email text;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  normalized_email := public.current_auth_email();

  select *
  into target_user
  from public.users
  where id = p_user_id
  limit 1;

  if target_user.id is null then
    raise exception 'USER_NOT_FOUND';
  end if;

  if target_user.auth_user_id is not null and target_user.auth_user_id <> auth.uid() then
    raise exception 'USER_ALREADY_LINKED';
  end if;

  if normalized_email = '' or lower(target_user.email) <> normalized_email then
    raise exception 'AUTH_EMAIL_MISMATCH';
  end if;

  update public.users
  set
    auth_user_id = auth.uid(),
    updated_at = timezone('utc', now())
  where id = target_user.id
  returning *
  into target_user;

  return target_user;
end;
$$;

revoke all on function public.current_auth_email() from public;
revoke all on function public.current_app_user_id() from public;
revoke all on function public.current_app_user_role() from public;
revoke all on function public.link_current_user_auth(text) from public;

grant execute on function public.current_auth_email() to authenticated;
grant execute on function public.current_app_user_id() to authenticated;
grant execute on function public.current_app_user_role() to authenticated;
grant execute on function public.link_current_user_auth(text) to authenticated;

drop policy if exists users_select_owned_or_privileged on public.users;

create policy users_select_owned_or_privileged
on public.users
for select
to authenticated
using (
  auth_user_id = auth.uid()
  or lower(email) = public.current_auth_email()
  or public.current_user_has_role(array[U&'Opera\00E7\00E3o', 'Administrador'])
);
