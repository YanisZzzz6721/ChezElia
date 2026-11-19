"use client";

import { createCategoryAction, renameCategoryAction, saveCategorySeoIntroAction } from "@/app/admin/_actions/categories";
import { CATEGORY_SEO_INTRO_MAX_LENGTH } from "@/content/products";
import { ActionForm } from "./ActionForm";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

/** Formulaire d'ajout d'une catégorie. */
export function CreateCategoryForm() {
  return (
    <ActionForm action={createCategoryAction} className="adm-card adm-form">
      <label className="adm-label" htmlFor="new-category">Nouvelle catégorie</label>
      <div className="adm-inline">
        <input className="adm-input" id="new-category" name="name" maxLength={60} required placeholder="Ex. Snacks salés" />
        <SubmitButton pendingLabel="Ajout…">Ajouter</SubmitButton>
      </div>
      <FormMessage />
    </ActionForm>
  );
}

/** Formulaire de renommage d'une catégorie (une ligne). */
export function RenameCategoryForm({ id, name }: { id: string; name: string }) {
  return (
    <ActionForm action={renameCategoryAction} className="adm-inline">
      <input type="hidden" name="id" value={id} />
      <label className="adm-sr" htmlFor={`name-${id}`}>Nom de la catégorie</label>
      <input className="adm-input" id={`name-${id}`} name="name" defaultValue={name} maxLength={60} required />
      <SubmitButton variant="ghost" pendingLabel="…">Renommer</SubmitButton>
      <FormMessage />
    </ActionForm>
  );
}

/**
 * Quoi : formulaire du texte de présentation d'un rayon (page « /rayons/<slug> » vue par Google).
 * Input : id — identifiant de la catégorie ; seoIntro — texte actuel (null = pas encore rédigé).
 * Output : un formulaire (zone de texte, bouton « Enregistrer le texte ») avec son message de retour.
 * Effets de bord : appelle l'action serveur d'enregistrement du texte.
 */
export function CategorySeoIntroForm({ id, seoIntro }: { id: string; seoIntro: string | null }) {
  return (
    <ActionForm action={saveCategorySeoIntroAction} className="adm-form">
      <input type="hidden" name="id" value={id} />
      <label className="adm-label" htmlFor={`seo-intro-${id}`}>Texte de présentation du rayon (page Google)</label>
      <textarea className="adm-input" id={`seo-intro-${id}`} name="seoIntro" defaultValue={seoIntro ?? ""} maxLength={CATEGORY_SEO_INTRO_MAX_LENGTH} rows={5} />
      <p className="adm-hint">2 à 4 phrases vraies sur ce rayon ; laissez vide tant que ce n&rsquo;est pas rédigé — la page restera invisible pour Google.</p>
      <SubmitButton variant="ghost" pendingLabel="Enregistrement…">Enregistrer le texte</SubmitButton>
      <FormMessage />
    </ActionForm>
  );
}
