-- Chez Elia : contenu de départ des services, des questions fréquentes liées et de la catégorie « Sandwichs ».
-- Uniquement des faits fournis par le propriétaire. Aucun prix autre que celui des sandwichs, aucun produit créé :
-- les produits se saisissent dans l'administration (un onglet de catégorie n'apparaît que s'il contient un produit visible).
-- Idempotent : ne recrée jamais ce que les propriétaires auraient supprimé ou modifié.

-- Services : seulement si la table est vide.
insert into public.services (title, body, highlight, icon, position, visible)
select title, body, highlight, icon, position, true
from (values
  ('Sandwichs frais', 'Des sandwichs frais, à emporter, pour une faim de passage.', '2,50 €', 'sandwich', 0),
  ('Point relais Vinted Go', 'Chez Elia est point relais Vinted Go. Renseignez-vous en magasin pour vos colis.', null, 'vinted', 1)
) as initial_services(title, body, highlight, icon, position)
where not exists (select 1 from public.services);

-- FAQ : chaque question n'est ajoutée que si aucune ligne n'a déjà exactement cette question ; positions à la suite des existantes.
insert into public.faq_items (question, answer, position)
select question, answer, (select coalesce(max(position), -1) from public.faq_items) + rank
from (values
  ('Proposez-vous des sandwichs ?', 'Oui, nous proposons des sandwichs frais à emporter. Demandez le choix du jour en magasin.', 1),
  ('Êtes-vous point relais Vinted Go ?', 'Oui, Chez Elia est point relais Vinted Go. Renseignez-vous en magasin pour vos colis.', 2)
) as new_questions(question, answer, rank)
where not exists (select 1 from public.faq_items existing where existing.question = new_questions.question);

-- Catégorie « Sandwichs » : seulement si aucune catégorie de ce nom n'existe (comparaison insensible à la casse), en dernière position.
insert into public.categories (name, position)
select 'Sandwichs', (select coalesce(max(position), -1) + 1 from public.categories)
where not exists (select 1 from public.categories where lower(btrim(name)) = 'sandwichs');
