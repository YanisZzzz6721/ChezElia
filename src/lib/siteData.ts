import { z } from "zod";
import type { DayHours } from "@/content/hours";
import type { FaqItem } from "@/content/faq";
import type { Category, Product } from "@/content/products";
import {
  SERVICE_BODY_MAX_LENGTH,
  SERVICE_HIGHLIGHT_MAX_LENGTH,
  SERVICE_ICONS,
  SERVICE_TITLE_MAX_LENGTH,
  type ServiceItem,
} from "@/content/services";
import { SITE } from "@/content/site";
import { SOCIAL_NETWORKS, parseSocialUrl, type SocialLink } from "@/content/social";

export const DAY_NAMES = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"] as const;

/** Colonnes lues dans la table `categories` (une seule liste pour le site, l'admin et l'export). */
export const CATEGORY_COLUMNS = "id, name, position, slug, seo_intro";

export interface CategoryRow {
  id: string;
  name: string;
  position: number;
  slug: string;
  seo_intro: string | null;
}

/** Colonnes lues dans la table `products` pour le site public et l'export. */
export const PRODUCT_COLUMNS = "id, category_id, title, description, price_cents, photo_path, photo_width, photo_height, visible, deleted_at, is_us_import";

export interface FaqRow {
  id: string;
  question: string;
  answer: string;
  position: number;
}

/** Colonnes lues dans la table `services` (une seule liste pour le site, l'admin et l'export). */
export const SERVICE_COLUMNS = "id, title, body, highlight, icon, position, visible";

export interface ServiceRow {
  id: string;
  title: string;
  body: string;
  highlight: string | null;
  /** Texte brut de la base : validé par mapServiceRows. */
  icon: string;
  position: number;
  visible: boolean;
}

export interface ProductRow {
  id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  price_cents: number | null;
  photo_path: string | null;
  photo_width: number | null;
  photo_height: number | null;
  visible: boolean;
  deleted_at: string | null;
  is_us_import: boolean;
}

export interface HoursRow {
  day_index: number;
  is_closed: boolean;
  opens_at: string | null;
  closes_at: string | null;
}

export interface SettingRow {
  key: string;
  value: unknown;
}

export interface HeroPhoto {
  path: string;
  width: number;
  height: number;
}

export interface SiteSettings {
  tag: string;
  lead: string;
  phoneNumber: string | null;
  heroPhoto: HeroPhoto | null;
}

const heroPhotoSchema = z.object({ path: z.string().min(1), width: z.number().int().positive(), height: z.number().int().positive() });
const settingSchemas = {
  tag: z.string().min(1).max(60),
  lead: z.string().min(1).max(300),
  phone_number: z.string().min(1).max(30).nullable(),
  hero_photo: heroPhotoSchema.nullable(),
} as const;

export const DEFAULT_SETTINGS: SiteSettings = {
  tag: "Ouvert tard · Centre-ville",
  lead: SITE.lead,
  phoneNumber: null,
  heroPhoto: null,
};

/**
 * Quoi : transforme les lignes « catégories » de la base en catégories du site, triées par position.
 * Input : rows — lignes de la table categories.
 * Output : les catégories {id, label, slug, seoIntro} dans l'ordre d'affichage ; un texte de présentation vide ou blanc devient null.
 * Effets de bord : aucun (fonction pure).
 */
export function mapCategoryRows(rows: readonly CategoryRow[]): Category[] {
  return [...rows].sort((a, b) => a.position - b.position).map(mapCategoryRow);
}

/**
 * Quoi : transforme UNE ligne « catégorie » de la base en catégorie du site.
 * Input : row — ligne de la table categories.
 * Output : la catégorie {id, label, slug, seoIntro} ; seoIntro est null si le texte est absent ou ne contient que des espaces.
 * Effets de bord : aucun (fonction pure).
 */
export function mapCategoryRow(row: CategoryRow): Category {
  const seoIntro = row.seo_intro?.trim() ?? "";
  return { id: row.id, label: row.name, slug: row.slug, seoIntro: seoIntro === "" ? null : seoIntro };
}

/**
 * Quoi : transforme les lignes « questions fréquentes » de la base en questions du site, triées par position.
 * Input : rows — lignes de la table faq_items.
 * Output : les questions {id, question, answer} dans l'ordre d'affichage (liste vide si aucune).
 * Effets de bord : aucun (fonction pure).
 */
export function mapFaqRows(rows: readonly FaqRow[]): FaqItem[] {
  return [...rows]
    .sort((a, b) => a.position - b.position)
    .map((row) => ({ id: row.id, question: row.question, answer: row.answer }));
}

const serviceRowSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(SERVICE_TITLE_MAX_LENGTH),
  body: z.string().trim().min(1).max(SERVICE_BODY_MAX_LENGTH),
  highlight: z.string().trim().min(1).max(SERVICE_HIGHLIGHT_MAX_LENGTH).nullable(),
  icon: z.enum(SERVICE_ICONS.map((icon) => icon.name) as [string, ...string[]]),
  position: z.number().int(),
  visible: z.boolean(),
});

/** Signale une ligne de service ignorée : à la console, avec son identifiant et la raison. */
function logInvalidServiceRow(row: ServiceRow, reason: string): void {
  console.error(`[site] Service ignoré (id ${row.id}) : ${reason}`);
}

/**
 * Quoi : transforme les lignes « services » de la base en services du site, triés par position.
 * Input : rows — lignes de la table services ; reportInvalidRow — appelée pour chaque ligne invalide
 *   avec la ligne et la raison (par défaut : console.error).
 * Output : les services valides dans l'ordre d'affichage (liste vide si aucun) ; les lignes invalides sont ignorées, jamais en silence.
 * Effets de bord : appelle reportInvalidRow (journalisation) pour chaque ligne invalide ; sinon aucun.
 */
export function mapServiceRows(rows: readonly ServiceRow[], reportInvalidRow: (row: ServiceRow, reason: string) => void = logInvalidServiceRow): ServiceItem[] {
  const services: (ServiceItem & { position: number })[] = [];
  for (const row of rows) {
    const parsed = serviceRowSchema.safeParse(row);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      reportInvalidRow(row, `${issue?.path.join(".") || "ligne"} — ${issue?.message ?? "valeur invalide"}`);
      continue;
    }
    const { position, ...item } = parsed.data;
    services.push({ ...item, icon: item.icon as ServiceItem["icon"], position });
  }
  return services.sort((a, b) => a.position - b.position).map(({ position: _position, ...item }) => item);
}

/** Signale une adresse sociale invalide en base : à la console, avec la clé du réglage et la raison. */
function logInvalidSocialSetting(settingKey: string, reason: string): void {
  console.error(`[site] Réseau social ignoré (réglage « ${settingKey} ») : ${reason}`);
}

/**
 * Quoi : extrait les liens de réseaux sociaux valides des réglages du site.
 * Input : rows — lignes de la table site_settings (les autres clés sont ignorées) ; reportInvalid — appelée avec
 *   la clé et la raison pour chaque valeur invalide (par défaut : console.error).
 * Output : les liens à afficher, dans l'ordre Instagram, TikTok, Snapchat ; une valeur absente (null) ou vide masque le réseau,
 *   une valeur invalide est ignorée (et signalée) sans faire échouer la page.
 * Effets de bord : appelle reportInvalid (journalisation) pour chaque valeur invalide ; sinon aucun.
 */
export function mapSocialLinks(rows: readonly SettingRow[], reportInvalid: (settingKey: string, reason: string) => void = logInvalidSocialSetting): SocialLink[] {
  const links: SocialLink[] = [];
  for (const { name, label, settingKey } of SOCIAL_NETWORKS) {
    const row = rows.find((candidate) => candidate.key === settingKey);
    if (!row || row.value === null) continue;
    if (typeof row.value !== "string") {
      reportInvalid(settingKey, "la valeur n'est pas un texte");
      continue;
    }
    const parsed = parseSocialUrl(name, row.value);
    if (!parsed.ok) reportInvalid(settingKey, parsed.error);
    else if (parsed.data !== null) links.push({ network: name, label, url: parsed.data });
  }
  return links;
}

/**
 * Quoi : transforme une ligne « produit » de la base en produit du site.
 * Input : row — ligne de la table products ; buildPhotoUrl — fabrique l'URL publique d'un chemin de photo.
 * Output : le produit ; le prix NULL reste null (« Prix à confirmer »), 0 reste 0 ; isUsImport reprend la case « Import USA ».
 * Effets de bord : aucun (fonction pure).
 */
export function mapProductRow(row: ProductRow, buildPhotoUrl: (path: string) => string): Product {
  const hasPhoto = row.photo_path !== null && row.photo_width !== null && row.photo_height !== null;
  return {
    id: row.id,
    title: row.title,
    categoryId: row.category_id,
    ...(row.description ? { description: row.description } : {}),
    priceInCents: row.price_cents,
    isUsImport: row.is_us_import,
    ...(hasPhoto
      ? { photo: { url: buildPhotoUrl(row.photo_path as string), width: row.photo_width as number, height: row.photo_height as number } }
      : {}),
  };
}

/**
 * Quoi : transforme les lignes « horaires » de la base en horaires de la semaine.
 * Input : rows — lignes de la table opening_hours (7 attendues, un jour chacune).
 * Output : les 7 jours dans l'ordre lundi → dimanche.
 * Effets de bord : aucun (fonction pure). Lève une Error si un jour manque, est en double ou incohérent.
 */
export function mapHoursRows(rows: readonly HoursRow[]): DayHours[] {
  return DAY_NAMES.map((day, index) => {
    const matching = rows.filter((row) => row.day_index === index);
    if (matching.length !== 1) {
      throw new Error(`Horaires invalides : ${matching.length} ligne(s) pour ${day} (une seule attendue).`);
    }
    const row = matching[0] as HoursRow;
    if (row.is_closed) return { day, isClosed: true };
    if (row.opens_at === null || row.closes_at === null) {
      throw new Error(`Horaires invalides pour ${day} : heure d'ouverture ou de fermeture manquante.`);
    }
    return { day, isClosed: false, opensAt: row.opens_at, closesAt: row.closes_at };
  });
}

/**
 * Quoi : assemble les réglages du site à partir des lignes de la base, avec valeurs par défaut.
 * Input : rows — lignes de la table site_settings (clés de la liste blanche).
 * Output : les réglages complets ; une clé absente prend sa valeur par défaut.
 *   Les clés de réseaux sociaux sont ignorées ici : mapSocialLinks s'en charge.
 * Effets de bord : aucun (fonction pure). Lève une Error explicite si une valeur stockée est invalide.
 */
export function mapSettingRows(rows: readonly SettingRow[]): SiteSettings {
  const settings: SiteSettings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    if (SOCIAL_NETWORKS.some((network) => network.settingKey === row.key)) continue;
    if (!(row.key in settingSchemas)) throw new Error(`Réglage inconnu en base : « ${row.key} ».`);
    const key = row.key as keyof typeof settingSchemas;
    const parsed = settingSchemas[key].safeParse(row.value);
    if (!parsed.success) throw new Error(`Valeur invalide pour le réglage « ${row.key} » : ${parsed.error.issues[0]?.message ?? "inconnue"}.`);
    if (key === "tag") settings.tag = parsed.data as string;
    if (key === "lead") settings.lead = parsed.data as string;
    if (key === "phone_number") settings.phoneNumber = parsed.data as string | null;
    if (key === "hero_photo") settings.heroPhoto = parsed.data as HeroPhoto | null;
  }
  return settings;
}
