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

### Pages de rayon et sitemap

- Les pages `/rayons/<slug>`, `/rayons` et `/produits-americains` suivent la règle anti-contenu mince : indexables seulement avec un texte de présentation rédigé dans l'administration ET au moins 6 produits visibles (`/produits-americains` : 6 produits, `/rayons` : au moins un rayon indexable). Sinon `noindex, follow` : la page reste accessible aux visiteurs mais n'est pas proposée à Google.
- `sitemap.xml` (régénéré toutes les minutes) ne liste que les pages **indexables** (accueil, légales, `/rayons`, rayons indexables, `/produits-americains`) ; il reste vide tant que l'indexation globale est fermée, sans lecture en base.
- Chaque page porte un titre « <Nom> à Strasbourg | Chez Elia », une description (nombre de produits, heure de fermeture lue dans les horaires), une URL canonique et un `BreadcrumbList`. Aucune donnée Product/Offer : les prix sont parfois « à confirmer ».
- Le rayon des alcools affiche toujours la mention de santé ; les alcools ne figurent jamais sur `/produits-americains`.

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
