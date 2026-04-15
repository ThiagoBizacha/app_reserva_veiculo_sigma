create extension if not exists unaccent;

alter table public.users
  add column if not exists username text;

alter table public.users
  alter column email drop not null;

create or replace function public.username_seed_from_full_name(p_full_name text)
returns text
language plpgsql
immutable
as $$
declare
  normalized_name text;
  tokens text[];
  first_token text;
  last_token text;
  current_token text;
  token_index integer;
begin
  normalized_name := upper(regexp_replace(unaccent(coalesce(p_full_name, '')), '[^A-Za-z0-9\s]+', ' ', 'g'));
  tokens := regexp_split_to_array(trim(normalized_name), '\s+');

  if array_length(tokens, 1) is null then
    return 'USER';
  end if;

  first_token := tokens[1];
  last_token := tokens[array_length(tokens, 1)];

  for token_index in reverse array_lower(tokens, 1)..array_upper(tokens, 1) loop
    current_token := tokens[token_index];
    if current_token not in ('DA', 'DAS', 'DE', 'DO', 'DOS', 'E') then
      last_token := current_token;
      exit;
    end if;
  end loop;

  return coalesce(nullif(left(first_token, 1) || last_token, ''), 'USER');
end;
$$;

create or replace function public.generate_unique_username(p_full_name text, p_current_user_id text default null)
returns text
language plpgsql
stable
as $$
declare
  base_username text;
  candidate_username text;
  suffix integer := 1;
begin
  base_username := public.username_seed_from_full_name(p_full_name);
  candidate_username := base_username;

  while exists (
    select 1
    from public.users
    where upper(username) = upper(candidate_username)
      and (p_current_user_id is null or id <> p_current_user_id)
  ) loop
    suffix := suffix + 1;
    candidate_username := base_username || suffix::text;
  end loop;

  return candidate_username;
end;
$$;

do $$
declare
  user_record record;
begin
  for user_record in
    select id, full_name
    from public.users
    where username is null or btrim(username) = ''
    order by created_at, id
  loop
    update public.users
    set
      username = public.generate_unique_username(user_record.full_name, user_record.id),
      updated_at = timezone('utc', now())
    where id = user_record.id;
  end loop;
end;
$$;

alter table public.users
  alter column username set not null;

create unique index if not exists idx_users_username_normalized
  on public.users ((upper(username)));

create or replace function public.resolve_user_auth_login_email(p_email text, p_username text)
returns text
language sql
immutable
as $$
  select case
    when nullif(lower(trim(coalesce(p_email, ''))), '') is not null then lower(trim(p_email))
    when nullif(lower(trim(coalesce(p_username, ''))), '') is not null
      then lower(trim(p_username)) || '@auth.sigmalithium.local'
    else ''
  end;
$$;

revoke all on function public.resolve_user_auth_login_email(text, text) from public;
grant execute on function public.resolve_user_auth_login_email(text, text) to anon, authenticated;

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
      and public.resolve_user_auth_login_email(u.email, u.username) = public.current_auth_email()
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
      and public.resolve_user_auth_login_email(u.email, u.username) = public.current_auth_email()
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

  if normalized_email = ''
    or public.resolve_user_auth_login_email(target_user.email, target_user.username) <> normalized_email then
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

create or replace function public.resolve_auth_login_identifier(p_identifier text)
returns table (
  auth_login_email text,
  matched_user_id text,
  username text
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    public.resolve_user_auth_login_email(u.email, u.username) as auth_login_email,
    u.id as matched_user_id,
    u.username
  from public.users u
  where upper(trim(coalesce(p_identifier, ''))) = upper(u.username)
    or lower(trim(coalesce(p_identifier, ''))) = lower(coalesce(u.email, ''))
    or lower(trim(coalesce(p_identifier, ''))) = public.resolve_user_auth_login_email(u.email, u.username)
  order by case
    when upper(trim(coalesce(p_identifier, ''))) = upper(u.username) then 0
    when lower(trim(coalesce(p_identifier, ''))) = lower(coalesce(u.email, '')) then 1
    else 2
  end
  limit 1;
$$;

revoke all on function public.resolve_auth_login_identifier(text) from public;
grant execute on function public.resolve_auth_login_identifier(text) to anon, authenticated;

drop policy if exists users_select_owned_or_privileged on public.users;

create policy users_select_owned_or_privileged
on public.users
for select
to authenticated
using (
  auth_user_id = auth.uid()
  or public.resolve_user_auth_login_email(email, username) = public.current_auth_email()
  or public.current_user_has_role(array[U&'Opera\00E7\00E3o', 'Administrador'])
);
