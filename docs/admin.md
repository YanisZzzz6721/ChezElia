# Administration — mise en route

Panneau d'administration du site (`/admin`) : produits, catégories, services, textes, réseaux sociaux, horaires, photo d'accueil, sauvegarde.
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

## Services (onglet **Services**)

Les propriétaires gèrent eux-mêmes la section « Nos services » du site : ce sont des cartes (titre, texte, mention facultative, icône).

- **Ajouter** : remplir « Nouveau service » (titre 60 caractères maximum, texte 300, mention 30) puis « Ajouter le service ». Le nouveau service passe en dernier.
- **Mention facultative** : une courte indication affichée sur la carte, par exemple un prix. Laissez vide s'il n'y en a pas ; rien n'est affiché dans ce cas.
- **Icône** : à choisir dans la liste (Sandwich, Colis, Vinted).
- **Visible sur le site** : décochée, la carte reste enregistrée dans l'administration (repérée « Masqué sur le site ») mais n'apparaît pas sur le site. Pratique pour préparer un service avant de l'annoncer.
- **Modifier** : changer les champs puis « Enregistrer » (chaque service a son propre bouton).
- **Ordre** : « ↑ Monter » et « ↓ Descendre » règlent l'ordre d'affichage sur le site.
- **Supprimer** : demande une confirmation ; la suppression est définitive. Pour simplement retirer un service du site, décochez plutôt « Visible sur le site ».
- La section n'apparaît pas sur le site tant qu'aucun service n'est visible. N'indiquez que des services réellement proposés.
- Les modifications apparaissent sur le site en moins d'une minute. Les services sont inclus dans la sauvegarde.

## Pages des rayons (onglet **Catégories**) et « Import USA »

### Texte de présentation d'un rayon

Chaque catégorie a sa propre page sur le site (`/rayons/<adresse>`), pensée pour que les clients et Google trouvent le rayon. Dans l'onglet **Catégories**, sous le nom de chaque catégorie :

- **Adresse de la page** : par exemple `/rayons/epicerie`. Elle est fabriquée à la création de la catégorie (minuscules, sans accents) et **ne change jamais**, même si vous renommez la catégorie : les liens déjà partagés continuent de fonctionner. Si deux catégories donnent la même adresse, la seconde reçoit `-2`.
- **Texte de présentation du rayon (page Google)** : 2 à 4 phrases **vraies** sur ce rayon (ce qu'on y trouve, pour qui, à quel moment), 1 200 caractères maximum. Cliquez sur « Enregistrer le texte ».
- **Laissez vide tant que ce n'est pas rédigé** : la page du rayon reste alors invisible pour Google. Le repère « Texte à rédiger » / « Texte rédigé » à côté de l'adresse indique où vous en êtes.
- N'écrivez que ce qui est exact (aucune promesse, aucun chiffre ou avis inventé). Effacer le texte et enregistrer le retire de Google à la prochaine mise à jour.
- Les modifications apparaissent sur le site en moins d'une minute. Le texte est inclus dans la sauvegarde ; une ancienne sauvegarde se restaure avec un texte vide.

### Case « Import USA »

Dans le formulaire d'un produit (**Produits** > **Modifier**, ou **Nouveau produit**), la case **Import USA** marque un produit réellement importé des États-Unis. Les produits cochés (et visibles) apparaissent sur la page « Produits américains ».

- La liste des produits a un filtre **État > Import USA** pour retrouver les produits cochés, et un repère « Import USA » sur chaque ligne.
- Ne cochez que ce qui est vraiment importé : une marque américaine n'est pas toujours un produit importé.
- Le site ne coche rien tout seul. Pour vous aider à démarrer, `scripts/suggest-us-imports.mjs` **propose** une liste d'après les titres (lecture seule, il n'écrit rien) ; à vous de valider produit par produit :

```bash
# Supabase local ; clé saisie au terminal, jamais dans un fichier ni dans une conversation
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node --experimental-strip-types scripts/suggest-us-imports.mjs
```

Les marques reconnues sont listées en tête de `src/lib/usImportSuggestions.ts` (les alcools ne sont jamais proposés).

- Migration : `20261119000000_seo_rayons.sql` — à appliquer au cloud avec `npx supabase db push --remote` (d'abord `--dry-run`). Elle ajoute l'adresse de chaque catégorie existante (calculée depuis son nom), le champ du texte de présentation (vide) et la case « Import USA » (décochée) ; aucun texte n'est créé.

## Réseaux sociaux (onglet **Site**, bloc « Réseaux sociaux »)

Trois champs : Instagram, TikTok et Snapchat.

- Collez l'adresse complète du compte, telle qu'elle apparaît dans la barre d'adresse du navigateur (elle commence par `https://`), par exemple `https://www.instagram.com/votre-compte/`.
- **Champ vide = le réseau n'est pas affiché** sur le site. Rien n'est pré-rempli : renseignez uniquement les comptes officiels de la boutique.
- Une adresse refusée (autre site, `http://` sans le « s », espaces…) affiche un message précisant le réseau concerné ; rien n'est enregistré tant que les trois champs ne sont pas valides.
- Chaque réseau n'accepte que sa propre adresse (instagram.com, tiktok.com, snapchat.com).
- Les modifications apparaissent sur le site en moins d'une minute. Les adresses sont incluses dans la sauvegarde.
- Migrations : `20261118000000_services.sql`, `20261118010000_social_settings.sql` et `20261118020000_services_contenu_initial.sql` — à appliquer au cloud avec `npx supabase db push --remote` (d'abord `--dry-run`).

## Section « Où nous trouver »

Adresse, bouton d'itinéraire et bouton d'appel, centrés ; elle utilise `SITE.address` et `SITE.directionsUrl` (`src/content/site.ts`) et le numéro public saisi dans l'onglet **Site**. Aucun plan externe n'est intégré (pas de cookie tiers, pas de bannière de consentement) : l'itinéraire s'ouvre dans Google Maps au clic.
