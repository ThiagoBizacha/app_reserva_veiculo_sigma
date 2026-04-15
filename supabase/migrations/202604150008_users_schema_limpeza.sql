alter table public.users
  drop column if exists name,
  drop column if exists area,
  drop column if exists email_corporativo,
  drop column if exists cnh_uf_emissao,
  drop column if exists gestor_id;
