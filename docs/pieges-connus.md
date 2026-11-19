# Pièges connus

Erreurs déjà rencontrées sur ce projet, avec la règle qui en découle. Document technique et public : aucun secret, aucune donnée commerciale. À compléter à chaque nouveau piège.

## Processus Git et déploiement

| Piège | Règle |
|---|---|
| Des commits poussés sur une branche **déjà fusionnée** n'arrivent jamais sur `main` : le site en ligne ne change pas. Arrivé 3 fois. | Après chaque fusion, repartir de `main` avec une **nouvelle branche**. Avant d'annoncer « ce sera en ligne », vérifier `gh pr view N --json state` (doit être `OPEN`) et la présence du commit dans `origin/main`. |
| Vercel ne déploie que `main`. Un premier build a échoué car `main` ne contenait que le commit initial vide. | Rien n'est « en ligne » tant que la PR n'est pas fusionnée. |
| Le hook de pré-commit refuse le commit si le marqueur de tests est créé dans la même commande. | Lancer les tests, puis créer le marqueur dans une commande **séparée**, puis committer. |
| Un script de test a modifié `tsconfig.json` en lançant un build annexe. | Après un build annexe : `git checkout -- tsconfig.json`. |

## Outils

| Piège | Règle |
|---|---|
| `supabase db push` agit sur la base **locale** par défaut. | Toujours `--remote` pour le cloud, d'abord avec `--dry-run`. |
| `pkill -f` a tué le shell de l'assistant. | Arrêter un serveur par port : `fuser -k PORT/tcp`. |
| Deux `next dev` dans le même dossier se bloquent. | `NEXT_DIST_DIR` distinct (script `dev:cloud`). |
| Vitest réserve `BASE_URL`. | Les tests d'intégration utilisent `TARGET_URL`. |
| Lancer Docker, plusieurs serveurs et des navigateurs en parallèle a figé le poste. | Un serveur à la fois ; `npx supabase stop` après usage. |

## Secrets

| Piège | Règle |
|---|---|
| Une clé secrète et des mots de passe ont été collés dans la conversation avec l'assistant, ou sélectionnés dans l'éditeur (la sélection est transmise). | Les secrets se saisissent **uniquement au terminal** (`read -rsp`). Ne jamais les coller dans une conversation, ne jamais les sélectionner dans l'éditeur. Un secret exposé se **régénère**. |
| Mot de passe administrateur oublié (deux fois) car non rangé. | Le ranger dans un gestionnaire de mots de passe **avant** de l'utiliser. |
| Dans Vercel, la valeur d'une variable a été saisie dans le champ du nom (« Key »). | Key = nom de la variable ; Value = sa valeur. |

## Base de données (Supabase)

| Piège | Règle |
|---|---|
| Une policy de lecture limitée à `anon` cachait les fiches visibles à un utilisateur connecté non admin. | La lecture publique vise `anon` **et** `authenticated`. Test RLS dédié. |
| `storage.remove()` ne supprimait rien en silence faute de droit de lecture. | Policy `select` ajoutée ; le code vérifie le nombre de fichiers réellement supprimés. |
| `site_settings.value NOT NULL` refusait de vider un réglage. | Colonne nullable (vide = valeur absente). |
| Page demandée hors des bornes : PostgREST répond 416. | La page demandée est ramenée dans les bornes avant la requête. |
| Restauration d'une sauvegarde : valeurs de réglages non validées. | Schéma zod discriminé par clé de réglage. |
| Un `check (char_length(btrim(texte)) >= 1)` laissait passer un texte réduit à des retours à la ligne : `btrim()` ne retire que les espaces. Vu par le test RLS de `seo_intro`. | Pour exiger au moins un caractère visible, utiliser `texte ~ '\S'`. |
| Une colonne `NOT NULL` sans valeur par défaut (`categories.slug`) aurait cassé les scripts d'import et `seed.sql`, qui insèrent des catégories sans elle. | Déclencheur `categories_fill_slug` : une catégorie créée sans slug en reçoit un. |
| Les photos de produits portant le même nom de fichier dans deux dossiers créaient des doublons de titres. | La catégorie fait partie du titre à l'import. |

## Interface et React

| Piège | Règle |
|---|---|
| React 19 vide les formulaires après l'action, même en cas d'erreur. | `ActionForm` conserve les valeurs saisies. |
| `formatPrice(-0)` et les entiers non sûrs produisaient un affichage faux. | Prix validé (entier sûr, ≥ 0) ; `-0` normalisé. |
| Les photos de produits débordaient au-dessus des cartes (style « détouré ») et masquaient la recherche et le compteur. | Cadre 4:5 `object-fit: cover` ; espacement vérifié sur de vraies cartes avec photo. |
| Un test « toutes les images sont dans leur carte » passait à vide sur des cartes sans image. | Vérifier qu'on teste bien des éléments existants (sinon le test ne prouve rien). |
| Le menu de l'en-tête débordait de l'écran sous 480 px (« Horaires » coupé) ; l'audit responsive l'avait manqué car il excluait la zone du hero de ses contrôles. | Un audit ne doit **exclure aucune zone** de la page. Mesurer l'en-tête de 280 à 480 px : aucun lien ne dépasse la largeur de l'écran. |
| Une page de connexion a été mise en cache un an par un cache partagé. | `Cache-Control: private, no-store` sur `/admin/*`. |
| `loginAction` répondait 500 sur une requête forgée. | Réponse d'échec identique, sans exception. |

## Règles de test

- Un test qui n'a jamais échoué ne prouve rien : vérifier qu'il **échoue** quand on retire la protection (fait pour le contrôle `requireAdmin()` de chaque action).
- Les attaques actives ne visent qu'une **copie locale** de l'application, jamais le service en ligne.
