"use client";

import { createCategoryAction, renameCategoryAction } from "@/app/admin/_actions/categories";
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
