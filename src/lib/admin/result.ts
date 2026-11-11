import { redirect } from "next/navigation";
import { PhotoError } from "@/lib/photo";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string } | null;

/** Messages d'information affichés après une redirection (clés fermées : aucun texte libre dans l'URL). */
export const FLASH_MESSAGES = {
  created: "Produit créé.",
  updated: "Modifications enregistrées.",
  trashed: "Produit mis à la corbeille.",
  restored: "Produit restauré.",
  deleted: "Produit supprimé définitivement.",
} as const;

export type FlashKey = keyof typeof FLASH_MESSAGES;

/** Redirige vers une page d'admin en demandant d'y afficher un message d'information. */
export function redirectWithFlash(path: string, key: FlashKey): never {
  redirect(`${path}?flash=${key}`);
}

/**
 * Quoi : transforme une erreur interceptée dans une action en message pour l'administrateur.
 * Input : error — l'erreur levée ; context — ce qui était en cours (« Enregistrement du produit »).
 * Output : un résultat { ok: false, error } ; les erreurs prévues (photo refusée) gardent leur message,
 *   les autres sont journalisées côté serveur avec leur contexte et résumées sans détail technique.
 * Effets de bord : console.error pour les erreurs inattendues.
 */
export function toActionError(error: unknown, context: string): { ok: false; error: string } {
  if (error instanceof PhotoError) return { ok: false, error: error.message };
  console.error(`[admin] ${context} :`, error);
  const detail = error instanceof Error ? error.message : "erreur inconnue";
  return { ok: false, error: `${context} impossible : ${detail}` };
}
