import type { DayHours } from "@/content/hours";
import { SITE } from "@/content/site";
import { toTelHref } from "./phone";

const SCHEMA_DAY_NAMES: Record<string, string> = {
  Lundi: "Monday",
  Mardi: "Tuesday",
  Mercredi: "Wednesday",
  Jeudi: "Thursday",
  Vendredi: "Friday",
  Samedi: "Saturday",
  Dimanche: "Sunday",
};

const FRENCH_TIME_PATTERN = /^(\d{2})h(\d{2})$/;

/**
 * Quoi : convertit une heure « 15h30 » au format schema.org « 15:30 ».
 * Input : frenchTime — heure au format « HHhMM » (00h00 à 23h59).
 * Output : l'heure au format « HH:MM ».
 * Effets de bord : aucun (fonction pure). Lève une Error si le format ou les bornes sont invalides.
 */
export function toSchemaTime(frenchTime: string): string {
  const match = FRENCH_TIME_PATTERN.exec(frenchTime);
  if (!match) throw new Error(`Heure invalide : « ${frenchTime} » (format attendu « 15h30 »).`);
  const [, hours, minutes] = match as unknown as [string, string, string];
  if (Number(hours) > 23 || Number(minutes) > 59) {
    throw new Error(`Heure invalide : « ${frenchTime} » (heures 00-23, minutes 00-59).`);
  }
  return `${hours}:${minutes}`;
}

/**
 * Quoi : construit l'identifiant (@id) du commerce dans le graphe JSON-LD.
 * Input : siteUrl — origine du site (https).
 * Output : « https://… /#commerce ».
 * Effets de bord : aucun (fonction pure).
 */
function buildStoreId(siteUrl: string): string {
  return `${siteUrl}/#commerce`;
}

/**
 * Quoi : construit les données structurées schema.org du commerce (ConvenienceStore).
 * Input : openingHours — les horaires de la semaine (les jours fermés sont omis) ; phoneNumber — numéro public ou null ;
 *   extras — adresse du site (https), URL de la photo d'accueil, adresses des réseaux sociaux (`sameAs`) et description, si connues.
 * Output : l'objet JSON-LD. Téléphone, image, réseaux (`sameAs`), @id, url et description sont omis tant qu'ils ne sont pas fournis ;
 *   l'itinéraire (`hasMap`) et la zone desservie (Strasbourg) sont toujours présents ; aucune coordonnée GPS ni fourchette de prix.
 * Effets de bord : aucun (fonction pure). Lève une Error si un nom de jour ou une heure est invalide.
 */
export function buildStoreJsonLd(openingHours: readonly DayHours[], phoneNumber: string | null = null, extras: { siteUrl?: string | null; imageUrl?: string | null; socialUrls?: readonly string[]; description?: string | null } = {}) {
  const openingHoursSpecification = openingHours
    .filter((hours) => !hours.isClosed)
    .map((hours) => {
      const dayOfWeek = SCHEMA_DAY_NAMES[hours.day];
      if (dayOfWeek === undefined) throw new Error(`Jour inconnu pour le JSON-LD : « ${hours.day} ».`);
      return {
        "@type": "OpeningHoursSpecification" as const,
        dayOfWeek,
        opens: toSchemaTime(hours.opensAt),
        closes: toSchemaTime(hours.closesAt),
      };
    });

  return {
    "@context": "https://schema.org",
    "@type": "ConvenienceStore",
    ...(extras.siteUrl ? { "@id": buildStoreId(extras.siteUrl) } : {}),
    name: SITE.name,
    ...(extras.description ? { description: extras.description } : {}),
    ...(phoneNumber ? { telephone: toTelHref(phoneNumber).slice("tel:".length) } : {}),
    ...(extras.siteUrl ? { url: extras.siteUrl } : {}),
    ...(extras.imageUrl ? { image: extras.imageUrl } : {}),
    ...(extras.socialUrls && extras.socialUrls.length > 0 ? { sameAs: [...extras.socialUrls] } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: "4 rue Sédillot",
      addressLocality: "Strasbourg",
      postalCode: "67000",
      addressCountry: "FR",
    },
    hasMap: SITE.directionsUrl,
    areaServed: { "@type": "City" as const, name: "Strasbourg" },
    openingHoursSpecification,
  };
}

/**
 * Quoi : construit les données structurées schema.org du site (WebSite), dont l'éditeur est le commerce.
 * Input : siteUrl — origine du site (https), ou null si le domaine n'est pas encore défini.
 * Output : l'objet JSON-LD, ou null si l'adresse est inconnue (rien n'est inventé).
 * Effets de bord : aucun (fonction pure).
 */
export function buildWebSiteJsonLd(siteUrl: string | null) {
  if (!siteUrl) return null;
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#site`,
    url: siteUrl,
    name: SITE.name,
    inLanguage: "fr-FR",
    publisher: { "@id": buildStoreId(siteUrl) },
  };
}

/**
 * Quoi : sérialise un objet JSON-LD pour l'insérer dans une balise <script>.
 * Input : data — l'objet à sérialiser.
 * Output : du JSON où « < » est échappé (<), pour qu'aucune donnée ne puisse fermer la balise.
 * Effets de bord : aucun (fonction pure).
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
