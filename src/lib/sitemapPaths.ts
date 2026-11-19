export type SitemapChangeFrequency = "weekly" | "yearly";

export interface SitemapPath {
  path: string;
  priority: number;
  changeFrequency: SitemapChangeFrequency;
}

const HOME_PATH: SitemapPath = { path: "/", priority: 1, changeFrequency: "weekly" };
const LEGAL_PATHS: SitemapPath[] = [
  { path: "/mentions-legales", priority: 0.2, changeFrequency: "yearly" },
  { path: "/confidentialite", priority: 0.2, changeFrequency: "yearly" },
];

interface SitemapPathsInput {
  /** Adresses des rayons dont la page est indexable (texte rédigé et au moins 6 produits). */
  indexableRayonSlugs: readonly string[];
  /** La page « produits américains » est indexable (au moins 6 produits hors alcool). */
  isUsImportPageIndexable: boolean;
}

/**
 * Quoi : liste les chemins du sitemap : accueil, liste des rayons et rayons indexables, produits américains si indexables, pages légales.
 * Input : indexableRayonSlugs — rayons indexables ; isUsImportPageIndexable — la page « produits américains » est indexable.
 * Output : les chemins avec priorité et fréquence. /rayons n'y figure que s'il y a au moins un rayon indexable (sinon la page est en noindex :
 *   un sitemap ne doit lister que des pages indexables). Une page mince n'y figure jamais.
 * Effets de bord : aucun (fonction pure).
 */
export function buildSitemapPaths({ indexableRayonSlugs, isUsImportPageIndexable }: SitemapPathsInput): SitemapPath[] {
  const rayonPaths: SitemapPath[] =
    indexableRayonSlugs.length === 0
      ? []
      : [
          { path: "/rayons", priority: 0.7, changeFrequency: "weekly" },
          ...indexableRayonSlugs.map((slug): SitemapPath => ({ path: `/rayons/${slug}`, priority: 0.8, changeFrequency: "weekly" })),
        ];
  const usImportPaths: SitemapPath[] = isUsImportPageIndexable ? [{ path: "/produits-americains", priority: 0.8, changeFrequency: "weekly" }] : [];
  return [HOME_PATH, ...rayonPaths, ...usImportPaths, ...LEGAL_PATHS];
}
