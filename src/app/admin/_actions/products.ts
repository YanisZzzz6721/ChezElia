"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { readPhotoFile, removePhoto, uploadPhoto, type StoredPhoto } from "@/lib/admin/photoStorage";
import { redirectWithFlash, toActionError, type ActionResult } from "@/lib/admin/result";
import { parseProductForm } from "@/lib/adminForms";

const idSchema = z.string().uuid("Identifiant de produit invalide.");

function refreshPages(): void {
  revalidatePath("/");
  revalidatePath("/admin/produits");
}

/**
 * Quoi : crée ou modifie un produit (titre, catégorie, description, prix facultatif, visibilité, photo).
 * Input : _previous — état précédent (useActionState) ; formData — champs du formulaire + id (si modification)
 *   + photo (fichier) + removePhoto (case cochée).
 * Output : null avant tentative ; { ok: false, error } si la saisie ou l'envoi échoue. En cas de succès, redirige
 *   vers la liste avec un message.
 * Effets de bord : vérifie l'administrateur ; écrit en base (journalisée) et dans le stockage de photos ;
 *   supprime l'ancienne photo remplacée ; rafraîchit les pages. Si l'écriture en base échoue après l'envoi
 *   d'une photo, cette photo est retirée (aucun fichier orphelin).
 */
export async function saveProductAction(_previous: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const input = parseProductForm(formData);
  if (!input.ok) return { ok: false, error: input.error };

  const rawId = formData.get("id");
  const productId = typeof rawId === "string" && rawId !== "" ? idSchema.safeParse(rawId) : null;
  if (productId && !productId.success) return { ok: false, error: productId.error.issues[0]?.message ?? "Identifiant invalide." };

  let uploaded: StoredPhoto | null = null;
  try {
    const file = readPhotoFile(formData);
    uploaded = file ? await uploadPhoto(supabase, "products", file) : null;

    let previousPath: string | null = null;
    if (productId) {
      const { data: current, error: readError } = await supabase.from("products").select("photo_path").eq("id", productId.data).single();
      if (readError) throw new Error(`Produit introuvable : ${readError.message}`);
      previousPath = current.photo_path;
    }

    const removeRequested = formData.get("removePhoto") === "on";
    const photoColumns: { photo_path?: string | null; photo_width?: number | null; photo_height?: number | null } = uploaded
      ? { photo_path: uploaded.path, photo_width: uploaded.width, photo_height: uploaded.height }
      : removeRequested
        ? { photo_path: null, photo_width: null, photo_height: null }
        : {};
    const row = {
      title: input.data.title,
      category_id: input.data.categoryId,
      description: input.data.description,
      price_cents: input.data.priceCents,
      visible: input.data.visible,
      ...photoColumns,
    };

    const { error } = productId
      ? await supabase.from("products").update(row).eq("id", productId.data)
      : await supabase.from("products").insert(row);
    if (error) throw new Error(error.message);

    const replacedPath = "photo_path" in photoColumns ? previousPath : null;
    if (replacedPath) {
      const warning = await removePhoto(supabase, replacedPath);
      if (warning) console.error("[admin]", warning);
    }
  } catch (error) {
    if (uploaded) {
      const warning = await removePhoto(supabase, uploaded.path);
      if (warning) console.error("[admin] Nettoyage après échec :", warning);
    }
    return toActionError(error, "Enregistrement du produit");
  }

  refreshPages();
  redirectWithFlash("/admin/produits", productId ? "updated" : "created");
}

/** Lit l'identifiant d'un formulaire d'action de ligne (bouton). Lève une Error si invalide. */
function readProductId(formData: FormData): string {
  return idSchema.parse(formData.get("id"));
}

/**
 * Quoi : affiche ou masque un produit sur le site.
 * Input : formData — id et visible (« true » / « false »).
 * Output : aucun. Effets de bord : vérifie l'administrateur ; met à jour la base ; rafraîchit les pages. Lève une Error si l'écriture échoue.
 */
export async function setProductVisibilityAction(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const id = readProductId(formData);
  const visible = formData.get("visible") === "true";
  const { error } = await supabase.from("products").update({ visible }).eq("id", id);
  if (error) throw new Error(`Changement de visibilité impossible : ${error.message}`);
  refreshPages();
}

/**
 * Quoi : met un produit à la corbeille (il disparaît du site mais reste restaurable).
 * Input : formData — id. Output : aucun (redirige avec un message).
 * Effets de bord : vérifie l'administrateur ; renseigne deleted_at ; rafraîchit les pages. Lève une Error si l'écriture échoue.
 */
export async function trashProductAction(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const id = readProductId(formData);
  const { error } = await supabase.from("products").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(`Mise à la corbeille impossible : ${error.message}`);
  refreshPages();
  redirectWithFlash("/admin/produits", "trashed");
}

/**
 * Quoi : restaure un produit de la corbeille.
 * Input : formData — id. Output : aucun (redirige avec un message).
 * Effets de bord : vérifie l'administrateur ; remet deleted_at à null ; rafraîchit les pages. Lève une Error si l'écriture échoue.
 */
export async function restoreProductAction(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const id = readProductId(formData);
  const { error } = await supabase.from("products").update({ deleted_at: null }).eq("id", id);
  if (error) throw new Error(`Restauration impossible : ${error.message}`);
  refreshPages();
  redirectWithFlash("/admin/produits", "restored");
}

/**
 * Quoi : supprime définitivement un produit déjà à la corbeille, avec sa photo.
 * Input : formData — id. Output : aucun (redirige avec un message).
 * Effets de bord : vérifie l'administrateur ; supprime la ligne (journalisée) puis la photo ; rafraîchit les pages.
 *   Refuse un produit qui n'est pas à la corbeille. Lève une Error si une étape échoue.
 */
export async function deleteProductForeverAction(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const id = readProductId(formData);
  const { data: product, error: readError } = await supabase.from("products").select("photo_path, deleted_at").eq("id", id).single();
  if (readError) throw new Error(`Produit introuvable : ${readError.message}`);
  if (product.deleted_at === null) throw new Error("Suppression refusée : mettez d'abord le produit à la corbeille.");

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(`Suppression impossible : ${error.message}`);
  if (product.photo_path) {
    const warning = await removePhoto(supabase, product.photo_path);
    if (warning) console.error("[admin]", warning);
  }
  refreshPages();
  redirectWithFlash("/admin/produits", "deleted");
}
