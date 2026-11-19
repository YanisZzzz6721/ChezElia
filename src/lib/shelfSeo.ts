import type { Metadata } from "next";
import { SITE } from "@/content/site";
import { formatClosingTime } from "./homeSeo";
import { buildAbsoluteUrl } from "./seo";

/** Longueur maximale d'une meta description (au-delà, les moteurs la coupent). */
export const META_DESCRIPTION_MAX_LENGTH = 155;

const STORE_PITCH = "chez Chez Elia, épicerie de nuit au 4 rue Sédillot à Strasbourg";
const RAYONS_PITCH = "Les rayons de Chez Elia, épicerie de nuit au 4 rue Sédillot à Strasbourg";

/**
 * Quoi : coupe un texte à une longueur maximale en finissant par « … ».
 * Input : text — le texte ; maxLength — longueur maximale (entier ≥ 2).
 * Output : le texte tel quel s'il tient, sinon sa version coupée terminée par « … ».
 * Effets de bord : aucun (fonction pure).
 */
function truncateWithEllipsis(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

/**
 * Quoi : construit la balise title d'une page de rayon ou de la page des produits américains.
 * Input : subject — nom du rayon (« Confiserie ») ou sujet de la page (« Produits américains »).
 * Output : « <Sujet> à Strasbourg | Chez Elia ».
 * Effets de bord : aucun (fonction pure).
 */
export function buildShelfTitle(subject: string): string {
  return `${subject} à Strasbourg | ${SITE.name}`;
}

/**
 * Quoi : construit la meta description d'un rayon (sous 155 caractères).
 * Input : subject — nom du rayon ; productCount — nombre de produits visibles (entier ≥ 0) ;
 *   latestClosingMinutes — fermeture la plus tardive de la semaine (voir findLatestClosing), ou null si inconnue.
 * Output : « <Sujet> chez Chez Elia, épicerie de nuit au 4 rue Sédillot à Strasbourg : N produits. Ouvert jusqu'à <heure>. » ;
 *   le compte est omis pour 0 produit, l'heure est omise si inconnue, le nom du rayon est tronqué (« … ») s'il fait dépasser la limite.
 * Effets de bord : aucun (fonction pure). Lève une Error si le nombre de produits est négatif ou non entier.
 */
export function buildShelfDescription(subject: string, productCount: number, latestClosingMinutes: number | null): string {
  if (!Number.isInteger(productCount) || productCount < 0) throw new Error(`Nombre de produits invalide : ${productCount} (entier ≥ 0 attendu).`);
  const countPart = productCount === 0 ? "" : ` : ${productCount} produit${productCount > 1 ? "s" : ""}`;
  const closingPart = latestClosingMinutes === null ? "" : ` Ouvert jusqu'à ${formatClosingTime(latestClosingMinutes)}.`;
  const tail = `${STORE_PITCH}${countPart}.${closingPart}`;
  return `${truncateWithEllipsis(subject, META_DESCRIPTION_MAX_LENGTH - 1 - tail.length)} ${tail}`;
}

/**
 * Quoi : construit la meta description de la page « Nos rayons ».
 * Input : labels — noms des rayons non vides, dans l'ordre d'affichage.
 * Output : la phrase d'accroche suivie des noms de rayons ; les derniers noms sont retirés (jamais coupés) si la limite de 155 caractères serait dépassée.
 * Effets de bord : aucun (fonction pure).
 */
export function buildRayonsDescription(labels: readonly string[]): string {
  for (let keptCount = labels.length; keptCount > 0; keptCount -= 1) {
    const description = `${RAYONS_PITCH} : ${labels.slice(0, keptCount).join(", ")}.`;
    if (description.length <= META_DESCRIPTION_MAX_LENGTH) return description;
  }
  return `${RAYONS_PITCH}.`;
}

/**
 * Quoi : phrase neutre et vraie qui présente un rayon quand les propriétaires n'ont pas rédigé de texte.
 * Input : label — nom du rayon.
 * Output : « Tous les produits du rayon X disponibles chez Chez Elia, 4 rue Sédillot à Strasbourg. ».
 * Effets de bord : aucun (fonction pure).
 */
export function buildNeutralShelfSentence(label: string): string {
  return `Tous les produits du rayon ${label} disponibles chez ${SITE.name}, 4 rue Sédillot à Strasbourg.`;
}

/**
 * Quoi : découpe un texte saisi en paragraphes (lignes vides = nouveau paragraphe ; retours à la ligne simples conservés).
 * Input : text — le texte rédigé par les propriétaires (éventuellement vide).
 * Output : la liste des paragraphes non vides, sans espaces autour ; liste vide si le texte est vide ou blanc.
 * Effets de bord : aucun (fonction pure).
 */
export function splitIntoParagraphs(text: string): string[] {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n[ \t]*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== "");
}

/**
 * Quoi : choisit les paragraphes de présentation d'un rayon : le texte des propriétaires, sinon une phrase neutre et vraie.
 * Input : seoIntro — texte rédigé (ou null) ; label — nom du rayon.
 * Output : au moins un paragraphe : ceux du texte s'il contient du texte visible, sinon la phrase neutre.
 * Effets de bord : aucun (fonction pure).
 */
export function buildShelfIntroParagraphs(seoIntro: string | null, label: string): string[] {
  const paragraphs = seoIntro === null ? [] : splitIntoParagraphs(seoIntro);
  return paragraphs.length > 0 ? paragraphs : [buildNeutralShelfSentence(label)];
}

/**
 * Quoi : calcule la consigne d'indexation d'une page.
 * Input : globalIndexing — l'indexation du site est ouverte (interrupteur + domaine + mentions légales) ; pageIndexable — la page a assez de contenu.
 * Output : site fermé = ni index ni follow ; site ouvert = index seulement si la page est assez fournie, liens toujours suivis.
 * Effets de bord : aucun (fonction pure).
 */
export function buildPageRobots(globalIndexing: boolean, pageIndexable: boolean): { index: boolean; follow: boolean } {
  if (!globalIndexing) return { index: false, follow: false };
  return { index: pageIndexable, follow: true };
}

interface PageMetadataInput {
  title: string;
  description: string;
  /** Chemin interne de la page (« /rayons/confiserie »), utilisé comme adresse canonique. */
  path: string;
  globalIndexing: boolean;
  pageIndexable: boolean;
}

/**
 * Quoi : construit les métadonnées d'une page secondaire (titre, description, adresse canonique, Open Graph, Twitter, robots).
 * Input : title, description, path (chemin interne), globalIndexing et pageIndexable (voir buildPageRobots).
 * Output : l'objet Metadata de Next. L'adresse canonique est relative : Next la complète avec metadataBase (défini par le layout si le domaine est connu).
 * Effets de bord : aucun (fonction pure). Lève une Error si le chemin n'est pas un chemin interne.
 */
export function buildPageMetadata({ title, description, path, globalIndexing, pageIndexable }: PageMetadataInput): Metadata {
  if (!path.startsWith("/") || path.startsWith("//")) throw new Error(`Chemin invalide : « ${path} » (un chemin interne commençant par « / » est attendu).`);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", locale: "fr_FR", siteName: SITE.name, title, description },
    twitter: { card: "summary_large_image", title, description },
    robots: buildPageRobots(globalIndexing, pageIndexable),
  };
}

export interface BreadcrumbItem {
  label: string;
  /** Chemin interne de l'étape (« / », « /rayons », « /rayons/confiserie »). */
  path: string;
}

/**
 * Quoi : construit les données structurées schema.org du fil d'Ariane (BreadcrumbList).
 * Input : items — les étapes, de l'accueil à la page courante ; siteUrl — origine du site (https), ou null si le domaine n'est pas défini.
 * Output : l'objet JSON-LD avec des adresses absolues, ou null si l'adresse du site est inconnue (rien n'est inventé).
 * Effets de bord : aucun (fonction pure). Lève une Error si la liste est vide ou si un chemin n'est pas interne.
 */
export function buildBreadcrumbJsonLd(items: readonly BreadcrumbItem[], siteUrl: string | null) {
  if (items.length === 0) throw new Error("Fil d'Ariane vide : au moins une étape est attendue.");
  if (siteUrl === null) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: buildAbsoluteUrl(siteUrl, item.path),
    })),
  };
}

/** Nom de la page des produits importés des États-Unis (titre, fil d'Ariane, H1 : « Produits américains à Strasbourg »). */
export const US_IMPORT_LABEL = "Produits américains";
/** Phrase de présentation de la page des produits américains : neutre et vraie, rien n'est promis. */
export const US_IMPORT_INTRO = "Les produits importés des États-Unis disponibles chez Chez Elia, 4 rue Sédillot à Strasbourg.";

const HOME_STEP: BreadcrumbItem = { label: "Accueil", path: "/" };
const RAYONS_STEP: BreadcrumbItem = { label: "Rayons", path: "/rayons" };

/**
 * Quoi : fil d'Ariane de la liste des rayons.
 * Input : aucun.
 * Output : « Accueil › Rayons ».
 * Effets de bord : aucun (fonction pure).
 */
export function buildRayonsBreadcrumb(): BreadcrumbItem[] {
  return [HOME_STEP, RAYONS_STEP];
}

/**
 * Quoi : fil d'Ariane de la page d'un rayon.
 * Input : label — nom du rayon ; slug — son adresse (déjà validée).
 * Output : « Accueil › Rayons › <Nom> ».
 * Effets de bord : aucun (fonction pure).
 */
export function buildRayonBreadcrumb(label: string, slug: string): BreadcrumbItem[] {
  return [HOME_STEP, RAYONS_STEP, { label, path: `/rayons/${slug}` }];
}

/**
 * Quoi : fil d'Ariane de la page des produits américains.
 * Input : aucun.
 * Output : « Accueil › Produits américains ».
 * Effets de bord : aucun (fonction pure).
 */
export function buildUsImportBreadcrumb(): BreadcrumbItem[] {
  return [HOME_STEP, { label: US_IMPORT_LABEL, path: "/produits-americains" }];
}
