
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
      and (
        lower(u.email) = public.current_auth_email()
        or lower(u.email_corporativo) = public.current_auth_email()
      )
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
      and (
        lower(u.email) = public.current_auth_email()
        or lower(u.email_corporativo) = public.current_auth_email()
      )
    )
  order by case when u.auth_user_id = auth.uid() then 0 else 1 end
  limit 1;
$$;

create or replace function public.current_user_has_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(public.current_app_user_role() = any(allowed_roles), false);
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

  if normalized_email = '' or (
    lower(target_user.email) <> normalized_email
    and lower(target_user.email_corporativo) <> normalized_email
  ) then
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

create or replace function public.cancel_own_reservation(p_reservation_id text)
returns public.reservations
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_reservation public.reservations;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
  into target_reservation
  from public.reservations
  where id = p_reservation_id
    and user_id = public.current_app_user_id()
    and status = 'Reservado'
    and end_date >= timezone('utc', now())
  limit 1;

  if target_reservation.id is null then
    raise exception 'RESERVATION_NOT_CANCELLABLE';
  end if;

  update public.reservations
  set
    status = 'Cancelada',
    updated_at = timezone('utc', now())
  where id = target_reservation.id
  returning *
  into target_reservation;

  return target_reservation;
end;
$$;

revoke all on function public.current_auth_email() from public;
revoke all on function public.current_app_user_id() from public;
revoke all on function public.current_app_user_role() from public;
revoke all on function public.current_user_has_role(text[]) from public;
revoke all on function public.link_current_user_auth(text) from public;
revoke all on function public.cancel_own_reservation(text) from public;

grant execute on function public.current_auth_email() to authenticated;
grant execute on function public.current_app_user_id() to authenticated;
grant execute on function public.current_app_user_role() to authenticated;
grant execute on function public.current_user_has_role(text[]) to authenticated;
grant execute on function public.link_current_user_auth(text) to authenticated;
grant execute on function public.cancel_own_reservation(text) to authenticated;

drop policy if exists users_open_access on public.users;
drop policy if exists users_authenticated_access on public.users;
drop policy if exists users_select_owned_or_privileged on public.users;
drop policy if exists users_insert_admin_only on public.users;
drop policy if exists users_update_admin_only on public.users;
drop policy if exists users_delete_admin_only on public.users;

create policy users_select_owned_or_privileged
on public.users
for select
to authenticated
using (
  auth_user_id = auth.uid()
  or lower(email) = public.current_auth_email()
  or lower(email_corporativo) = public.current_auth_email()
  or public.current_user_has_role(array['Operação', 'Administrador'])
);

create policy users_insert_admin_only
on public.users
for insert
to authenticated
with check (public.current_user_has_role(array['Administrador']));

create policy users_update_admin_only
on public.users
for update
to authenticated
using (public.current_user_has_role(array['Administrador']))
with check (public.current_user_has_role(array['Administrador']));

create policy users_delete_admin_only
on public.users
for delete
to authenticated
using (public.current_user_has_role(array['Administrador']));

drop policy if exists resources_open_access on public.resources;
drop policy if exists resources_authenticated_access on public.resources;
drop policy if exists resources_select_authenticated on public.resources;
drop policy if exists resources_insert_admin_only on public.resources;
drop policy if exists resources_update_admin_only on public.resources;
drop policy if exists resources_delete_admin_only on public.resources;

create policy resources_select_authenticated
on public.resources
for select
to authenticated
using (true);

create policy resources_insert_admin_only
on public.resources
for insert
to authenticated
with check (public.current_user_has_role(array['Administrador']));

create policy resources_update_admin_only
on public.resources
for update
to authenticated
using (public.current_user_has_role(array['Administrador']))
with check (public.current_user_has_role(array['Administrador']));

create policy resources_delete_admin_only
on public.resources
for delete
to authenticated
using (public.current_user_has_role(array['Administrador']));

drop policy if exists reservations_open_access on public.reservations;
drop policy if exists reservations_authenticated_access on public.reservations;
drop policy if exists reservations_select_by_role_or_owner on public.reservations;
drop policy if exists reservations_insert_own_only on public.reservations;
drop policy if exists reservations_update_admin_or_operations on public.reservations;
drop policy if exists reservations_update_owner_cancel_only on public.reservations;

create policy reservations_select_by_role_or_owner
on public.reservations
for select
to authenticated
using (
  user_id = public.current_app_user_id()
  or public.current_user_has_role(array['Operação', 'Administrador'])
);

create policy reservations_insert_own_only
on public.reservations
for insert
to authenticated
with check (user_id = public.current_app_user_id());

create policy reservations_update_admin_or_operations
on public.reservations
for update
to authenticated
using (public.current_user_has_role(array['Operação', 'Administrador']))
with check (public.current_user_has_role(array['Operação', 'Administrador']));


drop policy if exists reservation_history_open_access on public.reservation_history;
drop policy if exists reservation_history_authenticated_access on public.reservation_history;
drop policy if exists reservation_history_select_visible_reservations on public.reservation_history;
drop policy if exists reservation_history_insert_visible_reservations on public.reservation_history;

create policy reservation_history_select_visible_reservations
on public.reservation_history
for select
to authenticated
using (
  exists (
    select 1
    from public.reservations r
    where r.id = reservation_id
      and (
        r.user_id = public.current_app_user_id()
        or public.current_user_has_role(array['Operação', 'Administrador'])
      )
  )
);

create policy reservation_history_insert_visible_reservations
on public.reservation_history
for insert
to authenticated
with check (
  exists (
    select 1
    from public.reservations r
    where r.id = reservation_id
      and (
        r.user_id = public.current_app_user_id()
        or public.current_user_has_role(array['Operação', 'Administrador'])
      )
  )
);

drop policy if exists resource_unavailability_open_access on public.resource_unavailability;
drop policy if exists resource_unavailability_authenticated_access on public.resource_unavailability;
drop policy if exists resource_unavailability_select_authenticated on public.resource_unavailability;
drop policy if exists resource_unavailability_insert_ops_admin on public.resource_unavailability;
drop policy if exists resource_unavailability_update_ops_admin on public.resource_unavailability;
drop policy if exists resource_unavailability_delete_admin_only on public.resource_unavailability;

create policy resource_unavailability_select_authenticated
on public.resource_unavailability
for select
to authenticated
using (true);

create policy resource_unavailability_insert_ops_admin
on public.resource_unavailability
for insert
to authenticated
with check (public.current_user_has_role(array['Operação', 'Administrador']));

create policy resource_unavailability_update_ops_admin
on public.resource_unavailability
for update
to authenticated
using (public.current_user_has_role(array['Operação', 'Administrador']))
with check (public.current_user_has_role(array['Operação', 'Administrador']));

create policy resource_unavailability_delete_admin_only
on public.resource_unavailability
for delete
to authenticated
using (public.current_user_has_role(array['Administrador']));

drop policy if exists audit_log_open_access on public.audit_log;
drop policy if exists audit_log_authenticated_access on public.audit_log;
drop policy if exists audit_log_select_admin_only on public.audit_log;
drop policy if exists audit_log_insert_actor_only on public.audit_log;

create policy audit_log_select_admin_only
on public.audit_log
for select
to authenticated
using (public.current_user_has_role(array['Administrador']));

create policy audit_log_insert_actor_only
on public.audit_log
for insert
to authenticated
with check (actor_user_id = public.current_app_user_id());
