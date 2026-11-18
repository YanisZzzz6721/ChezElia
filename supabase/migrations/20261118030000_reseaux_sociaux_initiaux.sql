-- Chez Elia : adresses de départ des réseaux sociaux, modifiables ensuite dans l'administration (onglet Site).
-- Sources : le flyer du magasin (Snapchat « chezelia23 », TikTok « chez.elia ») et le compte Instagram « chez.elia »
-- du magasin, visible dans les résultats Google. Le propriétaire peut les changer ou les vider à tout moment.
-- Idempotent : ne touche jamais une ligne déjà présente (une adresse modifiée ou vidée par le propriétaire est conservée).

insert into public.site_settings (key, value) values
  ('social_instagram', to_jsonb('https://www.instagram.com/chez.elia/'::text)),
  ('social_tiktok',    to_jsonb('https://www.tiktok.com/@chez.elia'::text)),
  ('social_snapchat',  to_jsonb('https://www.snapchat.com/add/chezelia23'::text))
on conflict (key) do nothing;
