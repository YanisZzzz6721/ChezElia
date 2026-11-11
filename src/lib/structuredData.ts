import type { DayHours } from "@/content/hours";
import { SITE } from "@/content/site";

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
 * Quoi : construit les données structurées schema.org du commerce (ConvenienceStore).
 * Input : openingHours — les horaires de la semaine (les jours fermés sont omis).
 * Output : l'objet JSON-LD. Téléphone, image et coordonnées sont omis tant qu'ils ne sont pas fournis.
 * Effets de bord : aucun (fonction pure). Lève une Error si un nom de jour ou une heure est invalide.
 */
export function buildStoreJsonLd(openingHours: readonly DayHours[]) {
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
    name: SITE.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: "4 rue Sédillot",
      addressLocality: "Strasbourg",
      postalCode: "67000",
      addressCountry: "FR",
    },
    openingHoursSpecification,
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
