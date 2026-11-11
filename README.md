# Chez Elia

Site vitrine de Chez Elia, épicerie de nuit au 4 Rue Sédillot, 67000 Strasbourg.

## État

Site vitrine en Next.js (App Router, TypeScript). Direction visuelle « P5 » : affiche violette, néon, catalogue. Les photos ne sont pas publiées (droits non confirmés) : cadres « Photo à venir ».

## Structure

- `src/app/` — layout et page d'accueil.
- `src/components/` — sections (Hero, VisitSection, Catalogue) et petits composants.
- `src/content/` — textes, horaires, catalogue (données de démonstration).
- `src/lib/` — fonctions pures testées (`formatPrice`).
- `src/styles/` — CSS issu des maquettes et de l'admin.
- `src/app/admin/` — panneau d'administration (voir `docs/admin.md`).
- `supabase/` — migrations SQL, règles de sécurité (RLS) et données de démonstration locales.

## Lancer

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # tests unitaires
npm run build    # build de production
```

## Contribuer

Une branche par tâche, une pull request vers `main`. Ne jamais committer de secret (`.env*` est ignoré par git).
