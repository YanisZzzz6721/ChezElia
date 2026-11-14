-- Chez Elia : questions fréquentes (FAQ), modifiables depuis l'administration.
-- Aucune question n'est créée ici : la section du site reste masquée tant que les propriétaires n'en ont pas saisi.

create table public.faq_items (
  id         uuid primary key default gen_random_uuid(),
  question   text not null check (char_length(btrim(question)) between 1 and 200),
  answer     text not null check (char_length(btrim(answer)) between 1 and 1000),
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger faq_items_touch before update on public.faq_items
  for each row execute function public.touch_updated_at();
create trigger faq_items_audit after insert or update or delete on public.faq_items
  for each row execute function public.log_change();

alter table public.faq_items enable row level security;
create policy faq_items_public_read on public.faq_items for select to anon, authenticated using (true);
create policy faq_items_admin_write on public.faq_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.faq_items from anon, authenticated;
grant select on public.faq_items to anon;
grant select, insert, update, delete on public.faq_items to authenticated;
