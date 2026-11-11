import { requireAdmin } from "@/lib/admin/auth";
import { buildBackup, type BackupData } from "@/lib/backup";

/**
 * Quoi : fournit la sauvegarde complète en téléchargement (JSON).
 * Input : requête GET d'un administrateur connecté (sinon redirection vers la connexion).
 * Output : fichier JSON « chez-elia-sauvegarde-AAAA-MM-JJ.json » (jamais mis en cache).
 * Effets de bord : 4 lectures en base. Lève une Error si une lecture échoue.
 */
export async function GET(): Promise<Response> {
  const { supabase } = await requireAdmin();
  const [categories, products, settings, hours] = await Promise.all([
    supabase.from("categories").select("id, name, position").order("position"),
    supabase.from("products").select("id, category_id, title, description, price_cents, photo_path, photo_width, photo_height, visible, deleted_at").order("created_at"),
    supabase.from("site_settings").select("key, value"),
    supabase.from("opening_hours").select("day_index, is_closed, opens_at, closes_at").order("day_index"),
  ]);
  for (const [table, result] of Object.entries({ categories, products, settings, hours })) {
    if (result.error) throw new Error(`Export impossible : lecture de « ${table} » en échec (${result.error.message}).`);
  }

  const now = new Date();
  const backup = buildBackup(
    { categories: categories.data, products: products.data, settings: settings.data, hours: hours.data } as BackupData,
    now,
  );
  const fileName = `chez-elia-sauvegarde-${now.toISOString().slice(0, 10)}.json`;
  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
