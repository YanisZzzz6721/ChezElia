import type { SupabaseClient } from "@supabase/supabase-js";
import type { FaqItem } from "@/content/faq";
import type { DayHours } from "@/content/hours";
import type { Category, Product } from "@/content/products";
import type { ServiceItem } from "@/content/services";
import { SOCIAL_NETWORKS, type SocialLink, type SocialNetworkName } from "@/content/social";
import { isValidCategorySlug } from "@/lib/categorySlug";
import { createPublicClient } from "@/lib/supabase/publicClient";
import {
  CATEGORY_COLUMNS,
  PRODUCT_COLUMNS,
  mapCategoryRow,
  mapCategoryRows,
  mapFaqRows,
  mapHoursRows,
  mapProductRow,
  mapServiceRows,
  mapSettingRows,
  mapSocialLinks,
  SERVICE_COLUMNS,
  type CategoryRow,
  type FaqRow,
  type HoursRow,
  type ProductRow,
  type ServiceRow,
  type SettingRow,
  type SiteSettings,
} from "./siteData";

export interface SiteData {
  settings: SiteSettings;
  hours: DayHours[];
  categories: Category[];
  products: Product[];
  faqItems: FaqItem[];
  /** Services visibles, dans l'ordre d'affichage (liste vide = section masquée). */
  services: ServiceItem[];
  /** Réseaux sociaux renseignés et valides, dans l'ordre Instagram, TikTok, Snapchat (liste vide = aucun lien). */
  socialLinks: SocialLink[];
  /** URL publique de la photo d'accueil, ou null. */
  heroPhotoUrl: string | null;
}

/** Lève une Error contextualisée si une lecture Supabase a échoué ; sinon renvoie les lignes. */
function unwrapRows<Row>(table: string, result: { data: Row[] | null; error: { message: string } | null }): Row[] {
  if (result.error) throw new Error(`Lecture de « ${table} » impossible : ${result.error.message}`);
  return result.data ?? [];
}

/**
 * Quoi : charge toutes les données publiques du site (réglages, horaires, catégories, produits visibles, questions fréquentes, services visibles, réseaux sociaux).
 * Input : aucun.
 * Output : SiteData prête à afficher ; les produits masqués ou en corbeille sont exclus par la base (RLS).
 * Effets de bord : 6 lectures Supabase (anonymes). Lève une Error explicite si une lecture échoue ou si une donnée est incohérente.
 */
export async function fetchSiteData(): Promise<SiteData> {
  const supabase = createPublicClient();
  const buildPhotoUrl = (path: string) => supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;

  const [settingRows, hourRows, categoryRows, productRows, faqRows, serviceRows] = await Promise.all([
    supabase.from("site_settings").select("key, value"),
    supabase.from("opening_hours").select("day_index, is_closed, opens_at, closes_at"),
    supabase.from("categories").select(CATEGORY_COLUMNS),
    supabase.from("products").select(PRODUCT_COLUMNS).order("created_at", { ascending: true }),
    supabase.from("faq_items").select("id, question, answer, position"),
    supabase.from("services").select(SERVICE_COLUMNS).eq("visible", true),
  ]);

  const settingsRows = unwrapRows<SettingRow>("site_settings", settingRows);
  const settings = mapSettingRows(settingsRows);
  return {
    settings,
    socialLinks: mapSocialLinks(settingsRows),
    services: mapServiceRows(unwrapRows<ServiceRow>("services", serviceRows)),
    hours: mapHoursRows(unwrapRows<HoursRow>("opening_hours", hourRows)),
    categories: mapCategoryRows(unwrapRows<CategoryRow>("categories", categoryRows)),
    faqItems: mapFaqRows(unwrapRows<FaqRow>("faq_items", faqRows)),
    products: unwrapRows<ProductRow>("products", productRows).map((row) => mapProductRow(row, buildPhotoUrl)),
    heroPhotoUrl: settings.heroPhoto ? buildPhotoUrl(settings.heroPhoto.path) : null,
  };
}

/** Page d'un rayon : la catégorie et ses produits visibles. */
export interface CategoryPageData {
  category: Category;
  /** Produits visibles (ni masqués ni à la corbeille) de ce rayon, du plus ancien au plus récent ; liste vide possible. */
  products: Product[];
}

/**
 * Quoi : charge la page publique d'un rayon (/rayons/<slug>) : la catégorie et ses produits visibles.
 * Input : slug — adresse du rayon telle qu'elle vient de l'URL (donnée externe : le format est vérifié avant toute lecture).
 * Output : CategoryPageData, ou null si le slug est invalide ou ne correspond à aucune catégorie (l'appelant répond alors 404).
 *   category.seoIntro est null tant que les propriétaires n'ont pas rédigé le texte.
 * Effets de bord : 0 lecture si le format est invalide, sinon 2 lectures Supabase (anonymes). Lève une Error explicite si une lecture échoue.
 */
export async function fetchCategoryPageData(slug: string): Promise<CategoryPageData | null> {
  if (!isValidCategorySlug(slug)) return null;
  const supabase = createPublicClient();
  const categoryResult = await supabase.from("categories").select(CATEGORY_COLUMNS).eq("slug", slug).maybeSingle<CategoryRow>();
  if (categoryResult.error) throw new Error(`Lecture de la catégorie « ${slug} » impossible : ${categoryResult.error.message}`);
  if (categoryResult.data === null) return null;

  const category = mapCategoryRow(categoryResult.data);
  const productsResult = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("category_id", category.id)
    .eq("visible", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  const buildPhotoUrl = (path: string) => supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;
  const rows = unwrapRows<ProductRow>("products", productsResult as { data: ProductRow[] | null; error: { message: string } | null });
  return { category, products: rows.map((row) => mapProductRow(row, buildPhotoUrl)) };
}

/**
 * Quoi : charge les produits visibles marqués « Import USA » (page /produits-americains).
 * Input : aucun.
 * Output : les produits visibles (ni masqués ni à la corbeille) dont isUsImport est vrai, du plus ancien au plus récent ; liste vide si aucun.
 * Effets de bord : 1 lecture Supabase (anonyme). Lève une Error explicite si la lecture échoue.
 */
export async function fetchUsImportProducts(): Promise<Product[]> {
  const supabase = createPublicClient();
  const result = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_us_import", true)
    .eq("visible", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  const buildPhotoUrl = (path: string) => supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;
  const rows = unwrapRows<ProductRow>("products", result as { data: ProductRow[] | null; error: { message: string } | null });
  return rows.map((row) => mapProductRow(row, buildPhotoUrl));
}

/**
 * Quoi : lit TOUS les services (visibles ou masqués) pour l'administration, dans l'ordre d'affichage.
 * Input : supabase — client de l'administrateur connecté (celui renvoyé par requireAdmin) ; la RLS lui donne accès aux services masqués.
 * Output : la liste des services (vide si aucun), masqués compris (champ visible).
 * Effets de bord : 1 lecture Supabase. Lève une Error explicite si la lecture échoue ; une ligne invalide est ignorée et signalée par console.error.
 */
export async function fetchAllServicesForAdmin(supabase: SupabaseClient): Promise<ServiceItem[]> {
  const result = await supabase.from("services").select(SERVICE_COLUMNS).order("position", { ascending: true });
  return mapServiceRows(unwrapRows<ServiceRow>("services", result as { data: ServiceRow[] | null; error: { message: string } | null }));
}

/**
 * Quoi : lit les adresses de réseaux sociaux enregistrées, pour pré-remplir le formulaire d'administration.
 * Input : supabase — client de l'administrateur connecté.
 * Output : pour chaque réseau, l'adresse enregistrée ou null (non renseigné, ou invalide et signalée).
 * Effets de bord : 1 lecture Supabase. Lève une Error explicite si la lecture échoue.
 */
export async function fetchSocialUrlsForAdmin(supabase: SupabaseClient): Promise<Record<SocialNetworkName, string | null>> {
  const keys = SOCIAL_NETWORKS.map((network) => network.settingKey);
  const result = await supabase.from("site_settings").select("key, value").in("key", keys);
  const links = mapSocialLinks(unwrapRows<SettingRow>("site_settings", result as { data: SettingRow[] | null; error: { message: string } | null }));
  const urls: Record<SocialNetworkName, string | null> = { instagram: null, tiktok: null, snapchat: null };
  for (const link of links) urls[link.network] = link.url;
  return urls;
}
