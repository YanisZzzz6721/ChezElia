"use client";

import { quickSaveProductAction } from "@/app/admin/_actions/products";
import { ActionForm } from "./ActionForm";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

interface QuickEditFormProps {
  id: string;
  title: string;
  /** Texte du champ prix (« 2,50 » ou vide). */
  price: string;
}

/**
 * Quoi : modification rapide du titre et du prix d'un produit, directement dans la liste.
 * Input : id, title, price — valeurs actuelles du produit.
 * Output : un mini-formulaire (titre, prix, bouton « Enregistrer ») avec son message de retour.
 * Effets de bord : appelle l'action serveur d'enregistrement rapide.
 */
export function QuickEditForm({ id, title, price }: QuickEditFormProps) {
  return (
    <ActionForm action={quickSaveProductAction} className="adm-quick">
      <input type="hidden" name="id" value={id} />
      <label className="adm-sr" htmlFor={`title-${id}`}>Titre du produit</label>
      <input className="adm-input adm-quick__title" id={`title-${id}`} name="title" defaultValue={title} maxLength={200} required />
      <label className="adm-sr" htmlFor={`price-${id}`}>Prix en euros</label>
      <input className="adm-input adm-quick__price" id={`price-${id}`} name="price" defaultValue={price} inputMode="decimal" placeholder="Prix en €" autoComplete="off" />
      <SubmitButton variant="ghost" pendingLabel="…">Enregistrer</SubmitButton>
      <FormMessage />
    </ActionForm>
  );
}
