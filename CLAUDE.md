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

## Règles de travail apprises (erreurs déjà commises)

Détail dans `docs/pieges-connus.md` ; architecture dans `docs/architecture.md`.

- **Après la fusion d'une PR, ne plus rien pousser sur sa branche** : repartir de `main` avec une nouvelle branche. Avant de dire « ce sera en ligne », vérifier `gh pr view N --json state` (`OPEN`) et la présence du commit dans `origin/main`. Vercel ne déploie que `main`.
- **Fusionner une PR est le geste de Yanis**, pas celui de l'assistant.
- **Secrets : saisie au terminal uniquement** (`read -rsp`). Ne jamais demander de les coller dans la conversation, ne jamais utiliser un secret que Yanis a sélectionné dans l'éditeur ; le signaler et demander de le régénérer.
- `supabase db push` : toujours `--remote` pour le cloud, précédé de `--dry-run`.
- Arrêter un serveur par `fuser -k PORT/tcp`, jamais `pkill -f`. Un seul serveur à la fois : le poste de Yanis a déjà gelé.
- Hook de pré-commit : créer le marqueur de tests dans une commande séparée, avant le commit.
- Un test doit avoir été vu **échouer** sans la protection qu'il vérifie ; vérifier qu'il ne passe pas à vide.
- Attaques actives (pentest) : uniquement sur une copie **locale** de l'application.
- Tout changement visuel se vérifie dans un vrai navigateur sur de vraies cartes (avec photo), pas seulement par test.
- Un audit responsive n'exclut aucune zone de la page (le hero et l'en-tête ont débordé sans être vus) : tester de 280 à 480 px.
