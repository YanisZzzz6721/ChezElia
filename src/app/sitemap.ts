import type { MetadataRoute } from "next";
import { buildAbsoluteUrl } from "@/lib/seo";
import { getSeoConfig } from "@/lib/seoConfig";
import { isUsImportPageIndexable, listIndexableCategories, listPublicUsImportProducts } from "@/lib/shelfPages";
import { buildSitemapPaths } from "@/lib/sitemapPaths";
import { fetchSiteData } from "@/lib/siteQueries";

/** Le sitemap suit le catalogue : régénéré toutes les minutes (comme les pages), sans quoi une page devenue indexable resterait absente jusqu'au prochain déploiement. */
export const revalidate = 60;

/**
 * Quoi : fabrique le sitemap.xml des pages publiques : accueil, pages légales, et les pages de rayon et de produits américains qui ont assez de contenu.
 * Input : aucun (lit la configuration SEO, puis les rayons et produits visibles si l'indexation est ouverte).
 * Output : la liste des pages ; vide tant que l'indexation n'est pas autorisée (aucune adresse n'est annoncée aux moteurs, aucune lecture en base).
 * Effets de bord : lecture Supabase (anonyme) seulement quand l'indexation est ouverte. Lève une Error explicite si la lecture échoue
 *   (mieux vaut un échec visible qu'un sitemap partiel). Les pages d'administration n'y figurent jamais.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { siteUrl, indexing } = getSeoConfig();
  if (!indexing || siteUrl === null) return [];
  const { categories, products } = await fetchSiteData();
  const paths = buildSitemapPaths({
    indexableRayonSlugs: listIndexableCategories(categories, products).map((category) => category.slug),
    isUsImportPageIndexable: isUsImportPageIndexable(listPublicUsImportProducts(products, categories)),
  });
  const lastModified = new Date();
  return paths.map(({ path, priority, changeFrequency }) => ({ url: buildAbsoluteUrl(siteUrl, path), lastModified, changeFrequency, priority }));
}
