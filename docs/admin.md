# Administration — mise en route

Panneau d'administration du site (`/admin`) : produits, catégories, textes, horaires, photo d'accueil, sauvegarde.
Les données et les photos sont dans Supabase ; le site public les lit à chaque modification (et au plus toutes les minutes).

## Développement local

```bash
npm install
npm run db:start           # Supabase local (Docker) : base, authentification, stockage
cp .env.example .env.local # puis remplir avec les valeurs affichées par `npx supabase status`
npm run dev                # http://localhost:3000  (admin : /admin)
```

Créer le compte administrateur (depuis le terminal, jamais dans le navigateur) :

```bash
SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=<clé service_role locale> \
ADMIN_EMAIL=admin@exemple.test ADMIN_PASSWORD='<12 caractères minimum>' node scripts/create-admin.mjs
```

`npm run db:reset` réapplique les migrations et les données de démonstration (`supabase/seed.sql`, local uniquement).

## Tests

- `npm test` : tests unitaires (sans base de données).
- `npm run test:rls` : tests de sécurité contre le Supabase local (exige `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` dans l'environnement du terminal).

## Sécurité — ce qu'il faut savoir

- Le compte est commun (un seul identifiant). Mot de passe long, stocké dans un gestionnaire de mots de passe, jamais envoyé par SMS ou e-mail en clair.
- Administrateur = utilisateur dont `app_metadata.role` vaut `admin` ; l'inscription publique est désactivée. Le rôle n'est pas modifiable par l'utilisateur.
- Chaque page et chaque action vérifie la session côté serveur ; la base refuse en plus toute écriture non admin (RLS). Chaque modification est journalisée (table `audit_log`).
- La clé `service_role` n'est **jamais** dans l'application ni dans `.env.local` : uniquement dans le terminal, pour créer le compte.
- Les photos sont revérifiées côté serveur (vrai format, 8 Mo, 200 px minimum), converties en WebP (1600 px maximum) et débarrassées de leurs métadonnées (GPS compris).

## Tester avec le projet cloud depuis son PC

Mettre l'URL et la clé publique du projet dans `.env.cloud.local` (ignoré par git), puis :

```bash
npm run dev:cloud   # http://localhost:3001, branché sur le cloud (le local reste sur :3000)
```

Avec cette version de la CLI Supabase, les commandes agissent sur le **local par défaut** : ajouter `--remote` pour viser le cloud
(`npx supabase db push --remote --dry-run`, puis `npx supabase db push --remote`).

## Mise en production (Supabase cloud)

1. Créer le projet Supabase (au nom du client), appliquer `supabase/migrations/` (`npx supabase link` puis `npx supabase db push`).
2. Dans Authentication : désactiver les inscriptions, imposer 12 caractères minimum, régler la limite de tentatives de connexion.
3. Renseigner `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans Vercel.
4. Créer le compte admin avec `scripts/create-admin.mjs` (clé service_role fournie dans le terminal seulement).
5. Planifier une sauvegarde régulière : voir la page « Sauvegarde » de l'admin (export JSON) et activer les sauvegardes de la base côté Supabase si l'offre le permet. Les photos ne sont pas dans l'export JSON : leur sauvegarde se fait côté stockage.

## Importer en masse des photos (une fiche masquée par photo)

Pour démarrer le catalogue à partir d'un dossier de photos (par exemple celles du Drive) sans rien inventer :

```bash
# dossier-parent/Boisson/*.JPG  et  dossier-parent/Confiserie/*.JPG
NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... ADMIN_EMAIL=... ADMIN_PASSWORD=... \
node --experimental-strip-types scripts/import-photos.mjs <dossier-parent> --dry-run   # simulation
node --experimental-strip-types scripts/import-photos.mjs <dossier-parent>             # import réel
```

- Chaque photo devient une fiche **masquée** (« À nommer · Boissons · _DSF0621 »), catégorie selon le dossier, **« Prix à confirmer »**, sans description.
- Les photos passent par le même traitement que l'admin : vrai format vérifié, 8 Mo max, WebP 1600 px, métadonnées retirées.
- Le script agit avec le compte administrateur (aucune clé secrète) et se relance sans doublon.
- Ensuite, dans l'admin : donner un titre et un prix à chaque fiche, puis la passer en « Afficher ».
- ⚠️ Les photos importées sont stockées dans le bucket public (adresse devinable) : ne les importer qu'une fois les droits confirmés (Q12).

## Nommer en masse les fiches importées

`scripts/apply-titles.mjs` applique un fichier TSV (dossier, nom de fichier, titre, `ok`/`verifier`, `cat=…` facultatif) aux fiches encore intitulées « À nommer · … ».
Il ne touche jamais au prix, à la description ni à la visibilité, ignore les fiches déjà renommées, et ajoute « (à vérifier) » aux titres incertains.

```bash
node scripts/apply-titles.mjs <fichier.tsv> --dry-run   # simulation
node scripts/apply-titles.mjs <fichier.tsv>             # application
```

## Afficher en masse les fiches « sûres »

`scripts/show-products.mjs` passe en « visible » les fiches d'un fichier TSV marquées `ok`, **hors alcool**, **une seule fiche par titre** (les photos en double du même produit ne sont pas répétées). Il ne touche ni au titre, ni au prix, ni à la description.

```bash
node scripts/show-products.mjs <fichier.tsv> --dry-run   # simulation
node scripts/show-products.mjs <fichier.tsv>             # affichage
```

⚠️ Afficher une fiche publie sa photo : ne le faire qu'une fois les droits confirmés (Q12).

## Alcool

`scripts/show-alcohol.mjs` range dans une catégorie « Alcools » et affiche les fiches d'alcool d'un fichier TSV (colonne `alcool`), une fiche par titre. À n'utiliser qu'une fois la licence de vente confirmée.
Quand l'onglet d'une catégorie dont le nom contient « alcool » est sélectionné, le catalogue affiche la mention : « L'abus d'alcool est dangereux pour la santé. À consommer avec modération. La vente d'alcool est interdite aux mineurs. »
Vérifier aussi les règles locales (publicité en ligne, horaires de vente à emporter) : ce dépôt n'apporte aucune garantie juridique.

## Questions fréquentes (FAQ)

- Les propriétaires gèrent la FAQ dans l'administration, onglet **FAQ** : ajouter, modifier, monter, descendre, supprimer.
- La section « Questions fréquentes » s'affiche sous le catalogue **seulement s'il y a au moins une question** ; aucune question n'est créée par défaut (aucune donnée inventée).
- Limites : question 200 caractères, réponse 1 000 caractères. Les réponses sont du texte brut (les retours à la ligne sont conservés, le HTML est affiché tel quel, jamais interprété).
- Les modifications apparaissent sur le site en moins d'une minute.
- La FAQ est incluse dans la sauvegarde ; une ancienne sauvegarde sans FAQ se restaure comme une FAQ vide.
- Migration : `20261114000000_faq.sql` — à appliquer au cloud avec `npx supabase db push --remote` (d'abord `--dry-run`).
- Le balisage « FAQPage » n'est pas ajouté : Google n'affiche plus les résultats enrichis FAQ pour un commerce, le texte visible suffit.

## Section « Où nous trouver »

Adresse, bouton d'itinéraire et bouton d'appel, centrés ; elle utilise `SITE.address` et `SITE.directionsUrl` (`src/content/site.ts`) et le numéro public saisi dans l'onglet **Site**. Aucun plan externe n'est intégré (pas de cookie tiers, pas de bannière de consentement) : l'itinéraire s'ouvre dans Google Maps au clic.
