"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import type { ActionResult } from "@/lib/admin/result";
import { parseFaqEditForm, parseFaqForm } from "@/lib/adminForms";
import { moveItem } from "@/lib/reorder";

const idSchema = z.string().uuid("Identifiant de question invalide.");

/**
 * Quoi : demande à Next de régénérer la page d'accueil et la page d'admin de la FAQ.
 * Input : aucun. Output : aucun.
 * Effets de bord : invalide le cache des pages « / » et « /admin/faq ».
 */
function refreshPages(): void {
  revalidatePath("/");
  revalidatePath("/admin/faq");
}

/**
 * Quoi : ajoute une question fréquente, placée en dernière position.
 * Input : _previous — état précédent (useActionState) ; formData — champs question et answer.
 * Output : { ok: true, message } ou { ok: false, error } (champ vide ou trop long).
 * Effets de bord : vérifie l'administrateur ; écrit en base (journalisée) ; rafraîchit la page d'accueil et l'admin.
 */
export async function createFaqAction(_previous: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const input = parseFaqForm(formData);
  if (!input.ok) return { ok: false, error: input.error };

  const { data: last, error: readError } = await supabase.from("faq_items").select("position").order("position", { ascending: false }).limit(1);
  if (readError) return { ok: false, error: `Lecture des questions impossible : ${readError.message}` };
  const position = (last?.[0]?.position ?? -1) + 1;

  const { error } = await supabase.from("faq_items").insert({ ...input.data, position });
  if (error) return { ok: false, error: `Ajout impossible : ${error.message}` };
  refreshPages();
  return { ok: true, message: "Question ajoutée. Elle est visible sur le site d'ici une minute." };
}

/**
 * Quoi : modifie la question et la réponse d'une question existante.
 * Input : _previous — état précédent ; formData — champs id, question et answer.
 * Output : { ok: true, message } ou { ok: false, error }.
 * Effets de bord : vérifie l'administrateur ; met à jour la base ; rafraîchit les pages.
 */
export async function updateFaqAction(_previous: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const input = parseFaqEditForm(formData);
  if (!input.ok) return { ok: false, error: input.error };

  const { data, error } = await supabase
    .from("faq_items")
    .update({ question: input.data.question, answer: input.data.answer })
    .eq("id", input.data.id)
    .select("id");
  if (error) return { ok: false, error: `Enregistrement impossible : ${error.message}` };
  if (!data || data.length === 0) return { ok: false, error: "Cette question n'existe plus (elle a peut-être été supprimée). Rechargez la page." };
  refreshPages();
  return { ok: true, message: "Question enregistrée." };
}

/**
 * Quoi : monte ou descend une question d'un cran.
 * Input : formData — id et direction (« up » / « down »).
 * Output : aucun. Effets de bord : vérifie l'administrateur ; renumérote les positions en base ; rafraîchit les pages.
 *   Sans effet si la question est déjà en bout de liste. Lève une Error si une écriture échoue.
 */
export async function moveFaqAction(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const id = idSchema.parse(formData.get("id"));
  const direction = z.enum(["up", "down"]).parse(formData.get("direction"));

  const { data: rows, error: readError } = await supabase.from("faq_items").select("id").order("position", { ascending: true });
  if (readError) throw new Error(`Lecture des questions impossible : ${readError.message}`);
  const currentOrder = (rows ?? []).map((row) => row.id);
  const newOrder = moveItem(currentOrder, id, direction);
  if (newOrder.every((value, index) => value === currentOrder[index])) return;

  // Les positions sont renumérotées 0..n-1 : correct même si elles avaient des trous ou des doublons.
  for (const [position, rowId] of newOrder.entries()) {
    const { error } = await supabase.from("faq_items").update({ position }).eq("id", rowId);
    if (error) throw new Error(`Réordonnancement impossible : ${error.message}`);
  }
  refreshPages();
}

/**
 * Quoi : supprime une question fréquente.
 * Input : formData — id. Output : aucun.
 * Effets de bord : vérifie l'administrateur ; supprime la ligne (journalisée) ; rafraîchit les pages. Lève une Error si l'écriture échoue.
 */
export async function deleteFaqAction(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const id = idSchema.parse(formData.get("id"));
  const { error } = await supabase.from("faq_items").delete().eq("id", id);
  if (error) throw new Error(`Suppression de la question impossible : ${error.message}`);
  refreshPages();
}
