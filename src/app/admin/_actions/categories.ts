"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import type { ActionResult } from "@/lib/admin/result";
import { parseCategoryForm } from "@/lib/adminForms";

const idSchema = z.string().uuid("Identifiant de catégorie invalide.");

function refreshPages(): void {
  revalidatePath("/");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/produits");
}

/**
 * Quoi : crée une catégorie, placée en dernière position.
 * Input : _previous — état précédent (useActionState) ; formData — champ name.
 * Output : { ok: true, message } ou { ok: false, error } (nom vide, trop long ou déjà utilisé).
 * Effets de bord : vérifie l'administrateur ; écrit en base (journalisée) ; rafraîchit les pages.
 */
export async function createCategoryAction(_previous: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const input = parseCategoryForm(formData);
  if (!input.ok) return { ok: false, error: input.error };

  const { data: last, error: readError } = await supabase.from("categories").select("position").order("position", { ascending: false }).limit(1);
  if (readError) return { ok: false, error: `Lecture des catégories impossible : ${readError.message}` };
  const position = (last?.[0]?.position ?? -1) + 1;

  const { error } = await supabase.from("categories").insert({ name: input.data.name, position });
  if (error) return { ok: false, error: error.code === "23505" ? "Une catégorie porte déjà ce nom." : `Création impossible : ${error.message}` };
  refreshPages();
  return { ok: true, message: `Catégorie « ${input.data.name} » créée.` };
}

/**
 * Quoi : renomme une catégorie.
 * Input : _previous — état précédent ; formData — id et name.
 * Output : { ok: true, message } ou { ok: false, error }.
 * Effets de bord : vérifie l'administrateur ; met à jour la base ; rafraîchit les pages.
 */
export async function renameCategoryAction(_previous: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, error: id.error.issues[0]?.message ?? "Identifiant invalide." };
  const input = parseCategoryForm(formData);
  if (!input.ok) return { ok: false, error: input.error };

  const { error } = await supabase.from("categories").update({ name: input.data.name }).eq("id", id.data);
  if (error) return { ok: false, error: error.code === "23505" ? "Une catégorie porte déjà ce nom." : `Renommage impossible : ${error.message}` };
  refreshPages();
  return { ok: true, message: "Catégorie renommée." };
}

/**
 * Quoi : monte ou descend une catégorie d'un cran (échange sa position avec sa voisine).
 * Input : formData — id et direction (« up » / « down »).
 * Output : aucun. Effets de bord : vérifie l'administrateur ; met à jour deux lignes ; rafraîchit les pages.
 *   Sans effet si la catégorie est déjà en première ou dernière position. Lève une Error si une écriture échoue.
 */
export async function moveCategoryAction(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const id = idSchema.parse(formData.get("id"));
  const direction = z.enum(["up", "down"]).parse(formData.get("direction"));

  const { data: rows, error: readError } = await supabase.from("categories").select("id, position").order("position", { ascending: true });
  if (readError) throw new Error(`Lecture des catégories impossible : ${readError.message}`);
  const ordered = rows ?? [];
  const index = ordered.findIndex((row) => row.id === id);
  const neighbourIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || neighbourIndex < 0 || neighbourIndex >= ordered.length) return;

  // Les positions sont renumérotées 0..n-1 : un échange reste correct même si elles avaient des trous ou des doublons.
  const reordered = [...ordered];
  [reordered[index], reordered[neighbourIndex]] = [reordered[neighbourIndex]!, reordered[index]!];
  for (const [position, row] of reordered.entries()) {
    const { error } = await supabase.from("categories").update({ position }).eq("id", row.id);
    if (error) throw new Error(`Réordonnancement impossible : ${error.message}`);
  }
  refreshPages();
}

/**
 * Quoi : supprime une catégorie ; ses produits restent visibles dans « Tout » (sans catégorie).
 * Input : formData — id. Output : aucun.
 * Effets de bord : vérifie l'administrateur ; supprime la ligne (journalisée) ; rafraîchit les pages. Lève une Error si l'écriture échoue.
 */
export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const id = idSchema.parse(formData.get("id"));
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(`Suppression de la catégorie impossible : ${error.message}`);
  refreshPages();
}
