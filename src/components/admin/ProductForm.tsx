"use client";

import Link from "next/link";
import { saveProductAction } from "@/app/admin/_actions/products";
import { ActionForm } from "./ActionForm";
import { FormMessage } from "./FormMessage";
import { PhotoField } from "./PhotoField";
import { SubmitButton } from "./SubmitButton";

export interface ProductFormValues {
  id?: string;
  title: string;
  categoryId: string | null;
  description: string;
  /** Texte du champ prix (« 2,50 » ou vide). */
  price: string;
  visible: boolean;
  photoUrl: string | null;
}

interface ProductFormProps {
  values: ProductFormValues;
  categories: { id: string; name: string }[];
}

/** Formulaire de création / modification d'un produit (champ prix vide = « Prix à confirmer »). */
export function ProductForm({ values, categories }: ProductFormProps) {
  return (
    <ActionForm action={saveProductAction} className="adm-card adm-form" encType="multipart/form-data">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <div className="adm-product">
      <div className="adm-product__fields">
      <label className="adm-label" htmlFor="title">Titre du produit</label>
      <input className="adm-input" id="title" name="title" defaultValue={values.title} maxLength={200} required />

      <label className="adm-label" htmlFor="categoryId">Catégorie</label>
      <select className="adm-input" id="categoryId" name="categoryId" defaultValue={values.categoryId ?? ""}>
        <option value="">Aucune catégorie</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>{category.name}</option>
        ))}
      </select>

      <label className="adm-label" htmlFor="description">Courte description (facultative)</label>
      <textarea className="adm-input" id="description" name="description" defaultValue={values.description} maxLength={500} rows={3} />

      <label className="adm-label" htmlFor="price">Prix en euros</label>
      <input className="adm-input adm-input--short" id="price" name="price" defaultValue={values.price} inputMode="decimal" placeholder="Ex. 2,50" autoComplete="off" />
      <p className="adm-hint">Laissez vide si le prix n&rsquo;est pas connu : le site affichera « Prix à confirmer ». Tapez 0 uniquement pour un produit réellement gratuit.</p>

      <label className="adm-check">
        <input type="checkbox" name="visible" defaultChecked={values.visible} />
        Visible sur le site
      </label>
      </div>

      <div className="adm-product__photo">
        <PhotoField currentUrl={values.photoUrl} hint="Pour un rendu soigné, une photo du produit seul sur fond uni (ou détourée en PNG)." />
      </div>
      </div>

      <FormMessage />
      <div className="adm-actions">
        <SubmitButton pendingLabel="Enregistrement…">{values.id ? "Enregistrer" : "Créer le produit"}</SubmitButton>
        <Link className="adm-link" href="/admin/produits">Annuler</Link>
      </div>
    </ActionForm>
  );
}
