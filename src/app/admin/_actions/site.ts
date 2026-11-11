"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { readPhotoFile, removePhoto, uploadPhoto, type StoredPhoto } from "@/lib/admin/photoStorage";
import { toActionError, type ActionResult } from "@/lib/admin/result";
import { parseHoursForm, parseSettingsForm } from "@/lib/adminForms";

function refreshPages(): void {
  revalidatePath("/");
  revalidatePath("/admin/site");
}

/**
 * Quoi : enregistre les textes d'accueil et le téléphone public.
 * Input : _previous — état précédent (useActionState) ; formData — tag, lead, phone.
 * Output : { ok: true, message } ou { ok: false, error } (saisie invalide).
 * Effets de bord : vérifie l'administrateur ; écrit 3 réglages en base (journalisés) ; rafraîchit les pages.
 *   Un téléphone vide désactive le bouton Appeler sur le site.
 */
export async function saveSettingsAction(_previous: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const input = parseSettingsForm(formData);
  if (!input.ok) return { ok: false, error: input.error };

  const rows = [
    { key: "tag", value: input.data.tag },
    { key: "lead", value: input.data.lead },
    { key: "phone_number", value: input.data.phoneNumber },
  ];
  const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
  if (error) return { ok: false, error: `Enregistrement impossible : ${error.message}` };
  refreshPages();
  return { ok: true, message: "Textes enregistrés." };
}

/**
 * Quoi : enregistre les horaires d'ouverture des 7 jours.
 * Input : _previous — état précédent ; formData — closed_i, opens_i, closes_i pour chaque jour.
 * Output : { ok: true, message } ou { ok: false, error } nommant le jour fautif.
 * Effets de bord : vérifie l'administrateur ; écrit 7 lignes en base (journalisées) ; rafraîchit les pages.
 */
export async function saveHoursAction(_previous: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const input = parseHoursForm(formData);
  if (!input.ok) return { ok: false, error: input.error };

  const { error } = await supabase.from("opening_hours").upsert(input.data, { onConflict: "day_index" });
  if (error) return { ok: false, error: `Enregistrement des horaires impossible : ${error.message}` };
  refreshPages();
  return { ok: true, message: "Horaires enregistrés." };
}

/**
 * Quoi : remplace la photo d'accueil, ou la retire.
 * Input : _previous — état précédent ; formData — photo (fichier) ou removePhoto (case cochée).
 * Output : { ok: true, message } ou { ok: false, error } (photo refusée : format, taille, illisible…).
 * Effets de bord : vérifie l'administrateur ; envoie la nouvelle photo, met à jour le réglage « hero_photo »,
 *   supprime l'ancienne ; si la mise à jour échoue, la nouvelle photo est retirée (aucun orphelin).
 */
export async function saveHeroPhotoAction(_previous: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const file = readPhotoFile(formData);
  const removeRequested = formData.get("removePhoto") === "on";
  if (!file && !removeRequested) return { ok: false, error: "Choisissez une photo à envoyer, ou cochez « Retirer la photo »." };

  let uploaded: StoredPhoto | null = null;
  try {
    const { data: current, error: readError } = await supabase.from("site_settings").select("value").eq("key", "hero_photo").maybeSingle();
    if (readError) throw new Error(readError.message);
    const previousPath = (current?.value as { path?: string } | null)?.path ?? null;

    uploaded = file ? await uploadPhoto(supabase, "site", file) : null;
    const { error } = await supabase.from("site_settings").upsert({ key: "hero_photo", value: uploaded }, { onConflict: "key" });
    if (error) throw new Error(error.message);

    if (previousPath) {
      const warning = await removePhoto(supabase, previousPath);
      if (warning) console.error("[admin]", warning);
    }
  } catch (error) {
    if (uploaded) {
      const warning = await removePhoto(supabase, uploaded.path);
      if (warning) console.error("[admin] Nettoyage après échec :", warning);
    }
    return toActionError(error, "Mise à jour de la photo d'accueil");
  }
  refreshPages();
  return { ok: true, message: uploaded ? "Photo d'accueil mise à jour." : "Photo d'accueil retirée." };
}
