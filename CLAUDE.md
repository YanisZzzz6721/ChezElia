# Chez Elia — instructions du projet

Site vitrine d'une épicerie de nuit à Strasbourg. Dépôt **public** : ce fichier ne contient aucune donnée commerciale.

## Contexte et décisions

Le contexte détaillé (brief, décisions, protocole par phases) est dans le Brain de Yanis, hors de ce dépôt :
`/home/yanis/Brain/8-Projets-Clients/Chez-Elia/` — lire `00-REPRISE-CLAUDE.md` puis `10-protocole-realisation.md`.

## Règles du dépôt

- Dépôt public : jamais de secret, de montant, de coordonnée non publiée, de note du Brain ni de photo du Drive.
- Une branche par phase depuis `main`, jamais de commit direct sur `main`.
- Commit et push uniquement sur demande explicite de Yanis. `/finalise` avant chaque commit.
- Aucune donnée inventée : numéro de téléphone, prix, avis, chiffres, promotions, produits.
- Aucun générateur d'images.
- Pas d'e-commerce, de déploiement ni de publication sans accord explicite.

## Produit

- Message principal : « Votre épicerie de nuit à Strasbourg ». Vouvoiement, direct et convivial.
- Produit sans prix : afficher « Prix à confirmer » (prix absent ≠ prix égal à zéro).
- Horaires : passages après minuit, fuseau Europe/Paris.

## Standard de code

Celui de `~/.claude/CLAUDE.md` : fonctions courtes, nommage explicite, doc française Quoi/Input/Output/Effets de bord, aucune erreur avalée, réflexes sécurité.

## Maquettes et site
- Direction retenue : P5 (« Le Mur néon + photo entière »). Les maquettes HTML d'origine et leurs assets sont hors dépôt, dans le dossier de passation local.
- Ne jamais commiter `maquettes/assets-private/` ni une photo : droits non confirmés (Q12), dépôt public.
- Le personnage de la fresque n'est ni détouré, ni redessiné, ni utilisé comme logo ou mascotte.
