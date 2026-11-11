import type { MetadataRoute } from "next";

/** Préproduction : aucun robot n'est autorisé. À remplacer par l'autorisation + sitemap à la mise en ligne. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
