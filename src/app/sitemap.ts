import type { MetadataRoute } from "next";
import { buildAbsoluteUrl } from "@/lib/seo";
import { getSeoConfig } from "@/lib/seoConfig";

const PUBLIC_PATHS = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/mentions-legales", priority: 0.2, changeFrequency: "yearly" as const },
  { path: "/confidentialite", priority: 0.2, changeFrequency: "yearly" as const },
];

/**
 * Quoi : fabrique le sitemap.xml des pages publiques.
 * Input : aucun (lit la configuration SEO).
 * Output : la liste des pages ; vide tant que l'indexation n'est pas autorisée (aucune adresse n'est annoncée aux moteurs).
 * Effets de bord : aucun. Les pages d'administration n'y figurent jamais.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const { siteUrl, indexing } = getSeoConfig();
  if (!indexing || siteUrl === null) return [];
  const lastModified = new Date();
  return PUBLIC_PATHS.map(({ path, priority, changeFrequency }) => ({ url: buildAbsoluteUrl(siteUrl, path), lastModified, changeFrequency, priority }));
}
