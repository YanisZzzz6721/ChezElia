"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { toActionError, type ActionResult } from "@/lib/admin/result";
import { parseBackup, type BackupFile } from "@/lib/backup";

const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
const CONFIRMATION_WORD = "RESTAURER";

/**
 * Quoi : liste les photos de la sauvegarde qui n'existent plus dans le stockage.
 * Input : supabase — client de l'administrateur ; backup — la sauvegarde validée.
 * Output : les chemins manquants (liste vide = tout est présent).
 * Effets de bord : lit la liste des fichiers des dossiers « products » et « site » du bucket.
 */
async function findMissingPhotos(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], backup: BackupFile): Promise<string[]> {
  const referenced = new Set<string>();
  for (const product of backup.products) if (product.photo_path) referenced.add(product.photo_path);
  const hero = backup.settings.find((s) => s.key === "hero_photo")?.value as { path?: string } | null | undefined;
  if (hero?.path) referenced.add(hero.path);

  const existing = new Set<string>();
  for (const folder of ["products", "site"]) {
    const { data, error } = await supabase.storage.from("photos").list(folder, { limit: 10_000 });
    if (error) throw new Error(`Lecture du stockage impossible : ${error.message}`);
    for (const file of data ?? []) existing.add(`${folder}/${file.name}`);
  }
  return [...referenced].filter((path) => !existing.has(path));
}

/**
 * Quoi : restaure les fiches d'un fichier de sauvegarde (catégories, produits, réglages, horaires).
 *   Les éléments créés après la sauvegarde ne sont PAS supprimés ; ceux de la sauvegarde retrouvent leur état d'alors.
 * Input : _previous — état précédent (useActionState) ; formData — backup (fichier JSON) et confirmation (mot « RESTAURER »).
 * Output : { ok: true, message } (avec les photos manquantes éventuelles) ou { ok: false, error } ; rien n'est écrit si le fichier est invalide.
 * Effets de bord : vérifie l'administrateur ; écrit en base (journalisée) ; rafraîchit les pages.
 */
export async function restoreBackupAction(_previous: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (formData.get("confirmation") !== CONFIRMATION_WORD) {
    return { ok: false, error: `Pour confirmer, tapez le mot ${CONFIRMATION_WORD} dans le champ prévu.` };
  }
  const file = formData.get("backup");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choisissez un fichier de sauvegarde (.json)." };
  if (file.size > MAX_BACKUP_BYTES) return { ok: false, error: "Fichier trop volumineux pour une sauvegarde (5 Mo maximum)." };

  const parsed = parseBackup(await file.text());
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const backup = parsed.data;

  try {
    const steps: [string, PromiseLike<{ error: { message: string } | null }>][] = [
      ["catégories", supabase.from("categories").upsert(backup.categories, { onConflict: "id" })],
    ];
    for (const [label, step] of steps) {
      const { error } = await step;
      if (error) throw new Error(`Restauration des ${label} : ${error.message}`);
    }
    const afterCategories: [string, PromiseLike<{ error: { message: string } | null }>][] = [
      ["produits", supabase.from("products").upsert(backup.products, { onConflict: "id" })],
      ["réglages", supabase.from("site_settings").upsert(backup.settings, { onConflict: "key" })],
      ["horaires", supabase.from("opening_hours").upsert(backup.hours, { onConflict: "day_index" })],
    ];
    for (const [label, step] of afterCategories) {
      const { error } = await step;
      if (error) throw new Error(`Restauration des ${label} : ${error.message}`);
    }
    const missing = await findMissingPhotos(supabase, backup);
    revalidatePath("/");
    revalidatePath("/admin", "layout");
    const base = `Sauvegarde du ${new Date(backup.exportedAt).toLocaleDateString("fr-FR")} restaurée (${backup.products.length} produits, ${backup.categories.length} catégories).`;
    return { ok: true, message: missing.length > 0 ? `${base} Attention : ${missing.length} photo(s) n'existent plus dans le stockage et s'afficheront comme « Photo à venir ».` : base };
  } catch (error) {
    return toActionError(error, "Restauration de la sauvegarde");
  }
}
