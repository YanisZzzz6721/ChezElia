"use client";

import { restoreBackupAction } from "@/app/admin/_actions/backup";
import { ActionForm } from "./ActionForm";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

/** Formulaire de restauration d'une sauvegarde (demande de taper RESTAURER pour confirmer). */
export function RestoreForm() {
  return (
    <ActionForm action={restoreBackupAction} className="adm-card adm-form" encType="multipart/form-data">
      <h2 className="adm-h2">Restaurer une sauvegarde</h2>
      <p className="adm-hint">Les produits et réglages du fichier retrouvent leur état d&rsquo;alors. Ce qui a été créé depuis n&rsquo;est pas supprimé.</p>
      <label className="adm-label" htmlFor="backup">Fichier de sauvegarde (.json)</label>
      <input id="backup" name="backup" type="file" accept="application/json,.json" required />
      <label className="adm-label" htmlFor="confirmation">Tapez RESTAURER pour confirmer</label>
      <input className="adm-input adm-input--short" id="confirmation" name="confirmation" autoComplete="off" required />
      <FormMessage />
      <div className="adm-actions"><SubmitButton variant="danger" pendingLabel="Restauration…">Restaurer</SubmitButton></div>
    </ActionForm>
  );
}
