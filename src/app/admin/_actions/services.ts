"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import type { ActionResult } from "@/lib/admin/result";
import { parseServiceEditForm, parseServiceForm } from "@/lib/adminForms";
import { moveItem } from "@/lib/reorder";

const idSchema = z.string().uuid("Identifiant de service invalide.");

/**
 * Quoi : demande à Next de régénérer la page d'accueil et la page d'admin des services.
 * Input : aucun. Output : aucun.
 * Effets de bord : invalide le cache des pages « / » et « /admin/services ».
 */
function refreshPages(): void {
  revalidatePath("/");
  revalidatePath("/admin/services");
}

/**
 * Quoi : ajoute un service, placé en dernière position.
 * Input : _previous — état précédent (useActionState) ; formData — champs title, body, highlight, icon et visible.
 * Output : { ok: true, message } ou { ok: false, error } (champ vide, trop long, icône inconnue).
 * Effets de bord : vérifie l'administrateur ; écrit en base (journalisée) ; rafraîchit la page d'accueil et l'admin.
 */
export async function createServiceAction(_previous: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const input = parseServiceForm(formData);
  if (!input.ok) return { ok: false, error: input.error };

  const { data: last, error: readError } = await supabase.from("services").select("position").order("position", { ascending: false }).limit(1);
  if (readError) return { ok: false, error: `Lecture des services impossible : ${readError.message}` };
  const position = (last?.[0]?.position ?? -1) + 1;

  const { error } = await supabase.from("services").insert({ ...input.data, position });
  if (error) return { ok: false, error: `Ajout impossible : ${error.message}` };
  refreshPages();
  const visibility = input.data.visible ? "Il est visible sur le site d'ici une minute." : "Il est masqué : cochez « Visible sur le site » pour l'afficher.";
  return { ok: true, message: `Service ajouté. ${visibility}` };
}

/**
 * Quoi : modifie un service existant (textes, mention, icône, visibilité).
 * Input : _previous — état précédent ; formData — champs id, title, body, highlight, icon et visible.
 * Output : { ok: true, message } ou { ok: false, error }.
 * Effets de bord : vérifie l'administrateur ; met à jour la base ; rafraîchit les pages.
 */
export async function updateServiceAction(_previous: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const input = parseServiceEditForm(formData);
  if (!input.ok) return { ok: false, error: input.error };

  const { id, ...fields } = input.data;
  const { data, error } = await supabase.from("services").update(fields).eq("id", id).select("id");
  if (error) return { ok: false, error: `Enregistrement impossible : ${error.message}` };
  if (!data || data.length === 0) return { ok: false, error: "Ce service n'existe plus (il a peut-être été supprimé). Rechargez la page." };
  refreshPages();
  return { ok: true, message: "Service enregistré." };
}

/**
 * Quoi : monte ou descend un service d'un cran.
 * Input : formData — id et direction (« up » / « down »).
 * Output : aucun. Effets de bord : vérifie l'administrateur ; renumérote les positions en base ; rafraîchit les pages.
 *   Sans effet si le service est déjà en bout de liste. Lève une Error si une écriture échoue.
 */
export async function moveServiceAction(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const id = idSchema.parse(formData.get("id"));
  const direction = z.enum(["up", "down"]).parse(formData.get("direction"));

  const { data: rows, error: readError } = await supabase.from("services").select("id").order("position", { ascending: true });
  if (readError) throw new Error(`Lecture des services impossible : ${readError.message}`);
  const currentOrder = (rows ?? []).map((row) => row.id);
  const newOrder = moveItem(currentOrder, id, direction);
  if (newOrder.every((value, index) => value === currentOrder[index])) return;

  // Les positions sont renumérotées 0..n-1 : correct même si elles avaient des trous ou des doublons.
  for (const [position, rowId] of newOrder.entries()) {
    const { error } = await supabase.from("services").update({ position }).eq("id", rowId);
    if (error) throw new Error(`Réordonnancement impossible : ${error.message}`);
  }
  refreshPages();
}

/**
 * Quoi : supprime un service.
 * Input : formData — id. Output : aucun.
 * Effets de bord : vérifie l'administrateur ; supprime la ligne (journalisée) ; rafraîchit les pages. Lève une Error si l'écriture échoue.
 */
export async function deleteServiceAction(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const id = idSchema.parse(formData.get("id"));
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw new Error(`Suppression du service impossible : ${error.message}`);
  refreshPages();
}
