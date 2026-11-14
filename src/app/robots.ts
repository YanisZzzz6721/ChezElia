import type { MetadataRoute } from "next";
import { getSeoConfig } from "@/lib/seoConfig";

/**
 * Quoi : fabrique le fichier robots.txt.
 * Input : aucun (lit la configuration SEO).
 * Output : « tout interdit » tant que l'indexation n'est pas activée ET autorisée (domaine + mentions légales) ;
 *   sinon tout autorisé sauf /admin, avec l'adresse du sitemap.
 * Effets de bord : aucun.
 */
export default function robots(): MetadataRoute.Robots {
  const { siteUrl, indexing } = getSeoConfig();
  if (!indexing || siteUrl === null) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/admin/"] }], sitemap: `${siteUrl}/sitemap.xml`, host: siteUrl };
}
