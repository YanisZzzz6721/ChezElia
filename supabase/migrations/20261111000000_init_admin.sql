-- Chez Elia : schéma initial (catalogue, textes du site, horaires, journal, photos).
-- Règle d'or : un prix absent (NULL → « Prix à confirmer ») n'est PAS un prix nul (0).

create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(btrim(name)) between 1 and 60),
  position   integer not null default 0,
  created_at timestamptz not null default now()
);
create unique index categories_name_unique on public.categories (lower(btrim(name)));

create table public.products (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid references public.categories (id) on delete set null,
  title        text not null check (char_length(btrim(title)) between 1 and 200),
  description  text check (description is null or char_length(description) <= 500),
  price_cents  integer check (price_cents is null or price_cents >= 0),
  photo_path   text,
  photo_width  integer check (photo_width is null or photo_width > 0),
  photo_height integer check (photo_height is null or photo_height > 0),
  visible      boolean not null default true,
  deleted_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check ((photo_path is null) = (photo_width is null) and (photo_path is null) = (photo_height is null))
);
create index products_category_idx on public.products (category_id);

-- Textes éditables : liste blanche de clés (aucune clé arbitraire possible).
create table public.site_settings (
  key        text primary key check (key in ('tag', 'lead', 'phone_number', 'hero_photo')),
  value      jsonb,  -- NULL = valeur absente (ex. pas de téléphone, pas de photo d'accueil)
  updated_at timestamptz not null default now()
);

-- day_index : 0 = lundi … 6 = dimanche. Une fermeture après minuit compte pour la nuit du jour indiqué.
create table public.opening_hours (
  day_index  smallint primary key check (day_index between 0 and 6),
  is_closed  boolean not null default false,
  opens_at   text,
  closes_at  text,
  updated_at timestamptz not null default now(),
  check (
    is_closed
    or (opens_at ~ '^([01][0-9]|2[0-3])h[0-5][0-9]$' and closes_at ~ '^([01][0-9]|2[0-3])h[0-5][0-9]$')
  )
);

create table public.audit_log (
  id         bigint generated always as identity primary key,
  at         timestamptz not null default now(),
  user_id    uuid,
  action     text not null,
  table_name text not null,
  row_id     text,
  old_value  jsonb,
  new_value  jsonb
);

-- ───────── Triggers ─────────
create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
create trigger site_settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();
create trigger opening_hours_touch before update on public.opening_hours
  for each row execute function public.touch_updated_at();

-- Journal : qui a changé quoi (ancienne et nouvelle valeur).
create function public.log_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  row_key text;
begin
  row_key := coalesce(
    (case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end) ->> 'id',
    (case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end) ->> 'key',
    (case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end) ->> 'day_index'
  );
  insert into public.audit_log (user_id, action, table_name, row_id, old_value, new_value)
  values (
    auth.uid(), tg_op, tg_table_name, row_key,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return null;
end $$;

create trigger products_audit after insert or update or delete on public.products
  for each row execute function public.log_change();
create trigger categories_audit after insert or update or delete on public.categories
  for each row execute function public.log_change();
create trigger site_settings_audit after insert or update or delete on public.site_settings
  for each row execute function public.log_change();
create trigger opening_hours_audit after insert or update or delete on public.opening_hours
  for each row execute function public.log_change();

-- ───────── Sécurité par ligne (RLS) ─────────
-- Administrateur = utilisateur dont app_metadata.role vaut « admin » (non modifiable par l'utilisateur lui-même).
create function public.is_admin() returns boolean
language sql stable set search_path = '' as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
$$;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.categories     enable row level security;
alter table public.products       enable row level security;
alter table public.site_settings  enable row level security;
alter table public.opening_hours  enable row level security;
alter table public.audit_log      enable row level security;

-- Lecture publique : uniquement ce qui est visible et non supprimé.
create policy categories_public_read on public.categories for select to anon, authenticated using (true);
create policy products_public_read on public.products for select to anon, authenticated
  using (visible and deleted_at is null);
create policy products_admin_read on public.products for select to authenticated using (public.is_admin());
create policy site_settings_public_read on public.site_settings for select to anon, authenticated using (true);
create policy opening_hours_public_read on public.opening_hours for select to anon, authenticated using (true);
create policy audit_admin_read on public.audit_log for select to authenticated using (public.is_admin());

-- Écriture : seulement l'administrateur connecté. Rien pour anon.
create policy categories_admin_write on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy products_admin_write on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy site_settings_admin_write on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy opening_hours_admin_write on public.opening_hours for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Droits de base : anon ne peut qu'LIRE ; aucun droit d'écriture, même hors RLS.
revoke all on public.categories, public.products, public.site_settings, public.opening_hours, public.audit_log from anon, authenticated;
grant select on public.categories, public.products, public.site_settings, public.opening_hours to anon;
grant select, insert, update, delete on public.categories, public.products, public.site_settings, public.opening_hours to authenticated;
grant select on public.audit_log to authenticated;

-- ───────── Photos (Storage) ─────────
-- Bucket public en lecture ; seules des images WebP (converties côté serveur) de 10 Mo max sont acceptées.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 10485760, array['image/webp'])
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy photos_admin_select on storage.objects for select to authenticated using (bucket_id = 'photos' and public.is_admin());
create policy photos_admin_insert on storage.objects for insert to authenticated with check (bucket_id = 'photos' and public.is_admin());
create policy photos_admin_update on storage.objects for update to authenticated using (bucket_id = 'photos' and public.is_admin()) with check (bucket_id = 'photos' and public.is_admin());
create policy photos_admin_delete on storage.objects for delete to authenticated using (bucket_id = 'photos' and public.is_admin());

-- ───────── Valeurs par défaut (horaires transmis par le client, à reconfirmer ; textes d'accueil) ─────────
insert into public.opening_hours (day_index, is_closed, opens_at, closes_at) values
  (0, false, '15h30', '00h30'),
  (1, false, '16h00', '00h30'),
  (2, false, '16h00', '00h30'),
  (3, false, '15h30', '01h00'),
  (4, false, '15h30', '01h30'),
  (5, false, '15h30', '01h30'),
  (6, true, null, null)
on conflict (day_index) do nothing;

insert into public.site_settings (key, value) values
  ('tag', to_jsonb('Ouvert tard · Centre-ville'::text)),
  ('lead', to_jsonb('Boissons, snacks, confiseries et produits américains, en plein centre-ville. Passez nous voir, nous sommes ouverts tard.'::text)),
  ('phone_number', null),
  ('hero_photo', null)
on conflict (key) do nothing;

