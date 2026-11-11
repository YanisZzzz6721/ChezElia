import { z } from "zod";
import type { DayHours } from "@/content/hours";
import type { Category, Product } from "@/content/products";
import { SITE } from "@/content/site";

export const DAY_NAMES = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"] as const;

export interface CategoryRow {
  id: string;
  name: string;
  position: number;
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
 * Output : les catégories {id, label} dans l'ordre d'affichage.
 * Effets de bord : aucun (fonction pure).
 */
export function mapCategoryRows(rows: readonly CategoryRow[]): Category[] {
  return [...rows].sort((a, b) => a.position - b.position).map((row) => ({ id: row.id, label: row.name }));
}

/**
 * Quoi : transforme une ligne « produit » de la base en produit du site.
 * Input : row — ligne de la table products ; buildPhotoUrl — fabrique l'URL publique d'un chemin de photo.
 * Output : le produit ; le prix NULL reste null (« Prix à confirmer »), 0 reste 0.
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
 * Effets de bord : aucun (fonction pure). Lève une Error explicite si une valeur stockée est invalide.
 */
export function mapSettingRows(rows: readonly SettingRow[]): SiteSettings {
  const settings: SiteSettings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
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
