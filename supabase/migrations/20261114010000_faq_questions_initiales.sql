-- Chez Elia : questions fréquentes de départ, modifiables ensuite depuis l'administration.
-- Uniquement des faits déjà publiés sur le site (adresse, catalogue, absence de commande en ligne, mention alcool).
-- Aucun horaire, prix ni numéro de téléphone n'est écrit ici : ces informations vivent ailleurs et peuvent changer.
-- Idempotent : n'insère que si la FAQ est vide, pour ne jamais recréer des questions que les propriétaires auraient supprimées.

insert into public.faq_items (question, answer, position)
select question, answer, position
from (values
  (
    'Où se trouve Chez Elia ?',
    E'Nous sommes au 4 rue Sédillot, 67000 Strasbourg, en plein centre-ville.\nLe bouton « Itinéraire » ouvre le trajet dans Google Maps.',
    0
  ),
  (
    'Quels sont vos horaires ?',
    E'Nous sommes ouverts tard le soir, avec des fermetures après minuit.\nLes horaires de chaque jour sont indiqués dans la section « Horaires », en haut de la page.',
    1
  ),
  (
    'Que trouve-t-on chez vous ?',
    E'Des boissons, des snacks, des confiseries et des produits américains.\nLe catalogue de ce site les présente par catégorie, avec une barre de recherche.',
    2
  ),
  (
    'Peut-on commander en ligne ?',
    E'Non, ce site est une vitrine : il présente nos produits, mais on ne peut pas y commander ni y payer.\nPassez nous voir au magasin !',
    3
  ),
  (
    'Pourquoi certains produits affichent « Prix à confirmer » ?',
    E'Les prix sont ajoutés au fur et à mesure. « Prix à confirmer » signifie que le prix n''est pas encore indiqué sur le site : demandez-le simplement en magasin.',
    4
  ),
  (
    'Vendez-vous de l''alcool ?',
    E'Oui, vous le trouvez dans l''onglet « Alcools » du catalogue. La vente d''alcool est interdite aux mineurs.\nL''abus d''alcool est dangereux pour la santé. À consommer avec modération.',
    5
  )
) as initial_questions(question, answer, position)
where not exists (select 1 from public.faq_items);
