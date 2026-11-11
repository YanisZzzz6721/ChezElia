-- DONNÉES DE DÉMONSTRATION — uniquement pour le Supabase LOCAL (jamais appliqué en production).
-- Les vrais produits, prix et descriptions sont saisis avec le client dans l'admin.

insert into public.categories (name, position) values ('Boissons', 0), ('Confiserie', 1);


insert into public.products (title, category_id)
select p.title, (select id from public.categories where name = p.category)
from (values
  ('Coca-Cola Cherry', 'Boissons'),
  ('Fanta', 'Boissons'),
  ('Red Bull', 'Boissons'),
  ('Pepsi', 'Boissons'),
  ('Frosty Bites', 'Confiserie'),
  ('Têtes Brûlées Paint Billes', 'Confiserie'),
  ('Conik Sweet Waffle Cones fourrés au chocolat au lait et à la crème pistache, édition Dubaï', 'Confiserie')
) as p(title, category);
insert into public.products (title) values ('Couscous Samia moyen');
