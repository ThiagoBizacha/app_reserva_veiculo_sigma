alter table public.users
  add column if not exists auth_user_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_auth_user_id_fkey'
  ) then
    alter table public.users
      add constraint users_auth_user_id_fkey
      foreign key (auth_user_id)
      references auth.users (id)
      on delete set null;
  end if;
end;
$$;

create unique index if not exists idx_users_auth_user_id
  on public.users(auth_user_id)
  where auth_user_id is not null;

drop policy if exists users_open_access on public.users;
drop policy if exists users_authenticated_access on public.users;
create policy users_authenticated_access
on public.users
for all
to authenticated
using (true)
with check (true);

drop policy if exists resources_open_access on public.resources;
drop policy if exists resources_authenticated_access on public.resources;
create policy resources_authenticated_access
on public.resources
for all
to authenticated
using (true)
with check (true);

drop policy if exists reservations_open_access on public.reservations;
drop policy if exists reservations_authenticated_access on public.reservations;
create policy reservations_authenticated_access
on public.reservations
for all
to authenticated
using (true)
with check (true);

drop policy if exists reservation_history_open_access on public.reservation_history;
drop policy if exists reservation_history_authenticated_access on public.reservation_history;
create policy reservation_history_authenticated_access
on public.reservation_history
for all
to authenticated
using (true)
with check (true);

drop policy if exists resource_unavailability_open_access on public.resource_unavailability;
drop policy if exists resource_unavailability_authenticated_access on public.resource_unavailability;
create policy resource_unavailability_authenticated_access
on public.resource_unavailability
for all
to authenticated
using (true)
with check (true);

drop policy if exists audit_log_open_access on public.audit_log;
drop policy if exists audit_log_authenticated_access on public.audit_log;
create policy audit_log_authenticated_access
on public.audit_log
for all
to authenticated
using (true)
with check (true);

revoke usage on schema public from anon;
grant usage on schema public to authenticated;

revoke select, insert, update, delete on
  public.users,
  public.resources,
  public.reservations,
  public.reservation_history,
  public.resource_unavailability,
  public.audit_log
from anon;

grant select, insert, update, delete on
  public.users,
  public.resources,
  public.reservations,
  public.reservation_history,
  public.resource_unavailability,
  public.audit_log
to authenticated;
