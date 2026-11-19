-- Chez Elia : pages SEO par rayon (/rayons/<slug>) et produits américains.
--   - categories.slug      : adresse publique stable du rayon (jamais modifiée par un renommage).
--   - categories.seo_intro : texte de présentation du rayon, rédigé par les propriétaires (NULL = pas rédigé).
--   - products.is_us_import : produit importé des États-Unis (« Import USA »), coché à la main dans l'admin.
-- Aucun texte n'est créé ici : seo_intro reste NULL et is_us_import reste faux tant que les propriétaires ne les renseignent pas.
-- RLS : les policies existantes (lecture publique des catégories, lecture des produits visibles, écriture admin seule)
-- portent sur les LIGNES et les droits sur la TABLE : elles couvrent les nouvelles colonnes sans changement.

-- unaccent est fourni par Supabase (schéma « extensions ») ; il retire les accents (é → e, œ → oe, ç → c…).
create extension if not exists unaccent with schema extensions;

-- Transforme un nom de rayon en adresse : minuscules, sans accents, tout ce qui n'est pas lettre/chiffre devient un tiret.
-- Renvoie '' si le nom ne contient aucune lettre ni chiffre (l'appelant décide quoi faire). 60 caractères maximum.
create function public.slugify_category_name(category_name text) returns text
language sql stable set search_path = '' as $$
  select btrim(left(btrim(regexp_replace(lower(extensions.unaccent(coalesce(category_name, ''))), '[^a-z0-9]+', '-', 'g'), '-'), 60), '-')
$$;

-- Premier slug libre pour une base donnée : « base », puis « base-2 », « base-3 »… (60 caractères maximum, suffixe compris).
create function public.pick_free_category_slug(base_slug text, ignored_id uuid default null) returns text
language plpgsql stable set search_path = '' as $$
declare
  candidate text := base_slug;
  counter integer := 1;
  suffix text;
begin
  while exists (select 1 from public.categories where slug = candidate and (ignored_id is null or id <> ignored_id)) loop
    counter := counter + 1;
    suffix := '-' || counter::text;
    candidate := btrim(left(base_slug, 60 - char_length(suffix)), '-') || suffix;
  end loop;
  return candidate;
end $$;

alter table public.categories add column slug text;
alter table public.categories add column seo_intro text;
alter table public.products add column is_us_import boolean not null default false;

-- Reprise des catégories existantes : ordre stable (position, ancienneté, id) pour que le premier garde l'adresse la plus simple.
-- Un nom sans lettre ni chiffre retombe sur « rayon » (ne devrait pas arriver : nom 1 à 60 caractères, saisi par les propriétaires).
do $$
declare
  category record;
  base_slug text;
begin
  for category in select id, name from public.categories where slug is null order by position, created_at, id loop
    base_slug := coalesce(nullif(public.slugify_category_name(category.name), ''), 'rayon');
    update public.categories set slug = public.pick_free_category_slug(base_slug, category.id) where id = category.id;
  end loop;
end $$;

alter table public.categories alter column slug set not null;
alter table public.categories add constraint categories_slug_format
  check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 1 and 60);
alter table public.categories add constraint categories_slug_unique unique (slug);
-- « ~ '\S' » (au moins un caractère non blanc) : btrim() seul ne retire que les espaces, pas les retours à la ligne.
alter table public.categories add constraint categories_seo_intro_length
  check (seo_intro is null or (seo_intro ~ '\S' and char_length(seo_intro) <= 1200));

-- Filet de sécurité : une catégorie créée sans slug (scripts d'import, données de démonstration) reçoit le sien.
-- L'administration envoie toujours son propre slug ; ce déclencheur ne s'applique qu'en son absence.
create function public.fill_missing_category_slug() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.slug is null then
    new.slug := public.pick_free_category_slug(coalesce(nullif(public.slugify_category_name(new.name), ''), 'rayon'), new.id);
  end if;
  return new;
end $$;

create trigger categories_fill_slug before insert on public.categories
  for each row execute function public.fill_missing_category_slug();
