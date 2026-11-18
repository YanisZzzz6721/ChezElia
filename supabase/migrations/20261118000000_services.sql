-- Chez Elia : services de la boutique (section « Nos services »), modifiables depuis l'administration.
-- Aucun service n'est créé ici : voir 20261118020000_services_contenu_initial.sql.
-- Lecture publique : uniquement les services visibles. Les administrateurs lisent et écrivent tout.

create table public.services (
  id         uuid primary key default gen_random_uuid(),
  title      text not null check (char_length(btrim(title)) between 1 and 60),
  body       text not null check (char_length(btrim(body)) between 1 and 300),
  highlight  text check (highlight is null or char_length(btrim(highlight)) between 1 and 30),
  icon       text not null check (icon in ('sandwich', 'parcel', 'vinted')),
  position   integer not null,
  visible    boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger services_touch before update on public.services
  for each row execute function public.touch_updated_at();
create trigger services_audit after insert or update or delete on public.services
  for each row execute function public.log_change();

alter table public.services enable row level security;
-- anon ET authenticated : une policy limitée à anon cacherait les services visibles aux utilisateurs connectés non admin.
create policy services_public_read on public.services for select to anon, authenticated using (visible);
create policy services_admin_write on public.services for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.services from anon, authenticated;
grant select on public.services to anon;
grant select, insert, update, delete on public.services to authenticated;
