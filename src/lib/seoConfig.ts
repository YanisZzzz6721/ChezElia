import { LEGAL } from "@/content/legal";
import { listMissingLegalFields } from "./legal";
import { isIndexingEnabled, parseSiteUrl } from "./seo";

export interface SeoConfig {
  /** Adresse publique du site (https), ou null tant que le domaine n'est pas défini. */
  siteUrl: string | null;
  /** Vrai seulement si l'indexation est explicitement activée ET que le site est prêt (domaine + mentions légales). */
  indexing: boolean;
}

/**
 * Quoi : lit la configuration SEO depuis l'environnement et les mentions légales.
 * Input : aucun (lit NEXT_PUBLIC_SITE_URL, SITE_INDEXING et src/content/legal.ts).
 * Output : { siteUrl, indexing }.
 * Effets de bord : aucun. Lève une Error explicite si NEXT_PUBLIC_SITE_URL est invalide.
 */
export function getSeoConfig(): SeoConfig {
  const siteUrl = parseSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
  return { siteUrl, indexing: isIndexingEnabled(process.env.SITE_INDEXING, siteUrl, listMissingLegalFields(LEGAL)) };
}
