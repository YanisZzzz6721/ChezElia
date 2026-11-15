# Architecture du site

Document technique, sans donnée commerciale ni secret. Pour les procédures d'exploitation, voir [admin.md](admin.md) ; pour la sécurité et le SEO, [seo-et-securite.md](seo-et-securite.md) ; pour les erreurs déjà commises, [pieges-connus.md](pieges-connus.md).

## Vue d'ensemble

- **Next.js 16** (App Router), **React 19**, **TypeScript strict**, **zod 4** pour valider toute entrée, **sharp** pour convertir les photos en WebP, **Lenis** pour le défilement lissé, **Vitest 5** pour les tests.
- **Supabase** : Postgres (avec RLS), Auth, Storage (bucket `photos`).
- **Vercel** : déploie automatiquement la branche `main`.
- Site vitrine + catalogue, **sans e-commerce**. Le catalogue est lu à la volée (pages en ISR, `revalidate = 60`).

## Carte du code

| Dossier | Rôle |
|---|---|
| `src/app/` | pages publiques (`page.tsx`, mentions légales, confidentialité), `robots.ts`, `sitemap.ts`, `opengraph-image.tsx` |
| `src/app/admin/` | panneau d'administration : `login/`, `(panel)/` (pages protégées), `_actions/` (Server Actions) |
| `src/proxy.ts` | remplace le « middleware » (Next 16) : redirige vers la connexion sans session |
| `src/components/` | composants du site ; `admin/` pour ceux du panneau (`ActionForm`, `QuickEditForm`, `AdminNav`, `ProductForm`…) |
| `src/lib/` | logique pure et testée : prix, téléphone, horaires, catalogue (recherche, filtres), photos, SEO, sauvegarde, requêtes Supabase |
| `src/content/` | contenu statique et types (`products.ts`, mentions légales dans `legal.ts`) |
| `src/styles/` | `site.css`, `overrides.css`, `admin.css` |
| `supabase/migrations/` | schéma, politiques RLS, déclencheurs du journal d'audit |
| `supabase/seed.sql` | produits de démonstration, **local uniquement** |
| `scripts/` | scripts Node d'administration en masse (voir `docs/admin.md`) |
| `tests/` | tests d'intégration : RLS et attaques boîte noire |

## Modèle de données (résumé)

- `categories`, `products` (`price_cents` **NULL = « Prix à confirmer »**, jamais 0), `site_settings` (clés autorisées uniquement : `tag`, `lead`, `phone_number`, `hero_photo`), `opening_hours`, `faq_items` (questions fréquentes, éditables dans l'admin), `audit_log`.
- Un produit peut être **visible**, **masqué** ou à la **corbeille** (suppression douce).
- Droits : lecture publique des fiches visibles ; écriture réservée à `public.is_admin()` (rôle `admin` dans `app_metadata` du jeton). Une policy de lecture existe pour `anon` **et** `authenticated`.

## Sécurité de l'administration : trois couches

1. `proxy.ts` : sans cookie de session → redirection vers la connexion.
2. `requireAdmin()` appelé **en premier** dans chaque page, route et Server Action d'admin (un test statique le garantit).
3. **RLS** en base : même un appel direct à l'API ne peut rien écrire sans le rôle admin.

L'application n'utilise que la clé **publique** Supabase. La clé secrète ne sert qu'aux scripts lancés à la main depuis un terminal.

## Catalogue public

- `Catalogue.tsx` : onglets de catégories, recherche (insensible à la casse et aux accents), « Voir plus » par paquets de 24.
- La mention de santé sur l'alcool (`ALCOHOL_NOTICE`) ne s'affiche que dans l'onglet de la catégorie alcool (`isAlcoholCategorySelected`).
- Une fiche sans photo affiche « Photo à venir » ; une fiche sans prix affiche « Prix à confirmer ».
- Les photos des fiches sont affichées dans un cadre 4:5 (`b-card__pic--photo`), jamais en débordement.

## Mouvement et performance

- Un seul ressort (`linear()`) pour toutes les animations ; propriétés individuelles `translate` / `scale`.
- Apparition au scroll via `IntersectionObserver` ; script précoce posant `data-anim` pour éviter le saut au chargement.
- Transitions de vue pour les changements d'onglet.
- Le grain est une tuile fixe en data-URI ; `will-change: opacity` limité au néon.
- Les effets de survol sont réservés aux appareils qui survolent : `@media (hover: hover)`.

## SEO et indexation

Le site est **fermé aux moteurs par défaut**. Il ne s'ouvre que si : `NEXT_PUBLIC_SITE_URL` est en https, `SITE_INDEXING=on` et toutes les mentions légales sont renseignées (`src/lib/seo.ts`, `src/lib/seoConfig.ts`). Détails dans [seo-et-securite.md](seo-et-securite.md).

## Variables d'environnement

Voir `.env.example`. Seules `NEXT_PUBLIC_SUPABASE_URL` et la clé **publique** sont exposées au navigateur. `.env.local` et `.env.cloud.local` sont ignorés par git.

## Tests

| Suite | Commande |
|---|---|
| Unitaires + contrôles statiques | `npm test` |
| RLS (base locale) | `npm run test:rls` |
| Attaques boîte noire (serveur local de production) | `TARGET_URL=http://localhost:3002 npm run test:security` |
| Types | `npm run typecheck` |
