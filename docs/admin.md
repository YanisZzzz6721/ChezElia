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

- Chaque photo devient une fiche **masquée** (« À nommer · _DSF0621 »), catégorie selon le dossier, **« Prix à confirmer »**, sans description.
- Les photos passent par le même traitement que l'admin : vrai format vérifié, 8 Mo max, WebP 1600 px, métadonnées retirées.
- Le script agit avec le compte administrateur (aucune clé secrète) et se relance sans doublon.
- Ensuite, dans l'admin : donner un titre et un prix à chaque fiche, puis la passer en « Afficher ».
- ⚠️ Les photos importées sont stockées dans le bucket public (adresse devinable) : ne les importer qu'une fois les droits confirmés (Q12).
