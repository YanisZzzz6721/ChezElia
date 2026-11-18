-- Chez Elia : adresses des réseaux sociaux, modifiables depuis l'administration.
-- Trois nouvelles clés dans la liste blanche de site_settings ; valeur NULL = réseau non affiché.
-- Aucune adresse n'est pré-remplie : le propriétaire doit confirmer ses comptes officiels.

alter table public.site_settings drop constraint site_settings_key_check;
alter table public.site_settings add constraint site_settings_key_check
  check (key in ('tag', 'lead', 'phone_number', 'hero_photo', 'social_instagram', 'social_tiktok', 'social_snapchat'));

-- Défense en profondeur (le site et l'administration valident déjà) : une adresse sociale est une URL https
-- sans espace, dont l'hôte est exactement l'un des domaines du réseau (ni javascript:, ni http:, ni autre site).
alter table public.site_settings add constraint site_settings_social_value_check check (
  value is null
  or jsonb_typeof(value) = 'null'
  or case key
    when 'social_instagram' then jsonb_typeof(value) = 'string' and (value #>> '{}') ~ '^https://(www\.)?instagram\.com(/[^[:space:]]*)?$'
    when 'social_tiktok'    then jsonb_typeof(value) = 'string' and (value #>> '{}') ~ '^https://(www\.)?tiktok\.com(/[^[:space:]]*)?$'
    when 'social_snapchat'  then jsonb_typeof(value) = 'string' and (value #>> '{}') ~ '^https://(www\.)?snapchat\.com(/[^[:space:]]*)?$'
    else true
  end
);
