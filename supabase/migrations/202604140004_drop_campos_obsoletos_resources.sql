alter table public.resources
  drop column if exists location,
  drop column if exists responsible,
  drop column if exists requires_approval;
