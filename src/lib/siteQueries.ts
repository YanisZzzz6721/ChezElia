import type { DayHours } from "@/content/hours";
import type { Category, Product } from "@/content/products";
import { createPublicClient } from "@/lib/supabase/publicClient";
import {
  mapCategoryRows,
  mapHoursRows,
  mapProductRow,
  mapSettingRows,
  type CategoryRow,
  type HoursRow,
  type ProductRow,
  type SettingRow,
  type SiteSettings,
} from "./siteData";

export interface SiteData {
  settings: SiteSettings;
  hours: DayHours[];
  categories: Category[];
  products: Product[];
  /** URL publique de la photo d'accueil, ou null. */
  heroPhotoUrl: string | null;
}

/** Lève une Error contextualisée si une lecture Supabase a échoué ; sinon renvoie les lignes. */
function unwrapRows<Row>(table: string, result: { data: Row[] | null; error: { message: string } | null }): Row[] {
  if (result.error) throw new Error(`Lecture de « ${table} » impossible : ${result.error.message}`);
  return result.data ?? [];
}

/**
 * Quoi : charge toutes les données publiques du site (réglages, horaires, catégories, produits visibles).
 * Input : aucun.
 * Output : SiteData prête à afficher ; les produits masqués ou en corbeille sont exclus par la base (RLS).
 * Effets de bord : 4 lectures Supabase (anonymes). Lève une Error explicite si une lecture échoue ou si une donnée est incohérente.
 */
export async function fetchSiteData(): Promise<SiteData> {
  const supabase = createPublicClient();
  const buildPhotoUrl = (path: string) => supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;

  const [settingRows, hourRows, categoryRows, productRows] = await Promise.all([
    supabase.from("site_settings").select("key, value"),
    supabase.from("opening_hours").select("day_index, is_closed, opens_at, closes_at"),
    supabase.from("categories").select("id, name, position"),
    supabase.from("products").select("id, category_id, title, description, price_cents, photo_path, photo_width, photo_height, visible, deleted_at").order("created_at", { ascending: true }),
  ]);

  const settings = mapSettingRows(unwrapRows<SettingRow>("site_settings", settingRows));
  return {
    settings,
    hours: mapHoursRows(unwrapRows<HoursRow>("opening_hours", hourRows)),
    categories: mapCategoryRows(unwrapRows<CategoryRow>("categories", categoryRows)),
    products: unwrapRows<ProductRow>("products", productRows).map((row) => mapProductRow(row, buildPhotoUrl)),
    heroPhotoUrl: settings.heroPhoto ? buildPhotoUrl(settings.heroPhoto.path) : null,
  };
}
