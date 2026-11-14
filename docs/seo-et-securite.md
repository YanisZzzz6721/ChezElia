# SEO et sécurité — mise en ligne

## Indexation : un interrupteur sûr par défaut

Le site reste **non indexable** (`robots.txt` « tout interdit », balise `noindex`, sitemap vide) tant que les **trois** conditions suivantes ne sont pas réunies :

| # | Condition | Où |
|---|---|---|
| 1 | Adresse https de production | variable `NEXT_PUBLIC_SITE_URL` (Vercel → Settings → Environment Variables) |
| 2 | Interrupteur explicite | variable `SITE_INDEXING` = `on` (exactement) |
| 3 | Toutes les mentions légales renseignées | `src/content/legal.ts` (forme juridique, SIRET, directeur de publication, e-mail, hébergeur) |

Ensuite : redéployer. Vérifier `https://<domaine>/robots.txt` (doit autoriser `/` et interdire `/admin`) et `https://<domaine>/sitemap.xml`.

Ce qui est en place : titre et description avec la ville, URL canoniques, aperçu de partage (`/opengraph-image`), données structurées `ConvenienceStore` (adresse, horaires, téléphone si fourni, image d'accueil si publiée), `lang="fr"`, un seul H1, textes alternatifs des photos produit.

Après mise en ligne : créer la fiche Google Business Profile avec **exactement** le même nom, la même adresse et le même téléphone que le site, déclarer le sitemap dans Google Search Console.

## Sécurité : tests rejouables

```bash
npm test                                   # unitaires + contrôle statique des actions d'administration
npm run test:rls                           # base de données (Supabase local démarré, clés dans l'environnement)
TARGET_URL=http://localhost:3000 npm run test:security   # attaques « boîte noire » contre un serveur de production local
```

Ne viser que son propre site (local ou son propre déploiement).

## Points d'attention hors code

- Régénérer toute clé secrète Supabase qui aurait été partagée, et ne jamais la mettre dans le dépôt ni dans Vercel.
- Supabase → Authentication → Rate Limits : vérifier la limite de connexions par mot de passe (le code n'ajoute qu'un délai de 0,7 s par échec).
- Mot de passe admin long (16 caractères ou plus), rangé dans un gestionnaire de mots de passe.
