import type { SupabaseClient } from "@supabase/supabase-js";
import { processPhoto } from "@/lib/photo";

export type PhotoFolder = "products" | "site";

export interface StoredPhoto {
  path: string;
  width: number;
  height: number;
}

const BUCKET = "photos";

/**
 * Quoi : valide, convertit en WebP et envoie une photo dans le stockage (nom généré côté serveur).
 * Input : supabase — client de l'administrateur ; folder — « products » ou « site » ; file — le fichier envoyé.
 * Output : { path, width, height } de la photo stockée.
 * Effets de bord : écrit un fichier dans le bucket « photos ». Lève PhotoError (photo refusée, message lisible)
 *   ou Error (envoi impossible).
 */
export async function uploadPhoto(supabase: SupabaseClient, folder: PhotoFolder, file: File): Promise<StoredPhoto> {
  const processed = await processPhoto(new Uint8Array(await file.arrayBuffer()));
  const path = `${folder}/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, processed.bytes, { contentType: "image/webp", upsert: false });
  if (error) throw new Error(`Envoi de la photo impossible : ${error.message}`);
  return { path, width: processed.width, height: processed.height };
}

/**
 * Quoi : supprime une photo du stockage.
 * Input : supabase — client de l'administrateur ; path — chemin de la photo.
 * Output : null si tout va bien, sinon un avertissement lisible (l'action principale a déjà réussi).
 * Effets de bord : supprime un fichier du bucket « photos ».
 */
export async function removePhoto(supabase: SupabaseClient, path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) return `L'ancienne photo n'a pas pu être supprimée du stockage (${error.message}).`;
  // Le stockage répond « succès » même si rien n'a été supprimé (fichier absent ou droit manquant) : on vérifie.
  if (data.length === 0) return `L'ancienne photo « ${path} » est introuvable dans le stockage ou n'a pas pu être supprimée.`;
  return null;
}

/**
 * Quoi : lit le fichier « photo » d'un formulaire.
 * Input : formData — le formulaire.
 * Output : le File choisi, ou null si aucun fichier n'a été sélectionné.
 * Effets de bord : aucun (fonction pure).
 */
export function readPhotoFile(formData: FormData): File | null {
  const value = formData.get("photo");
  return value instanceof File && value.size > 0 ? value : null;
}
