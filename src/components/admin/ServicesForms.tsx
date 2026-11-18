"use client";

import { createServiceAction, updateServiceAction } from "@/app/admin/_actions/services";
import {
  SERVICE_BODY_MAX_LENGTH,
  SERVICE_HIGHLIGHT_MAX_LENGTH,
  SERVICE_ICONS,
  SERVICE_TITLE_MAX_LENGTH,
  type ServiceItem,
} from "@/content/services";
import { ActionForm } from "./ActionForm";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

type ServiceFieldValues = Pick<ServiceItem, "title" | "body" | "highlight" | "icon" | "visible">;

/** Valeurs d'un nouveau service : icône « sandwich » proposée par défaut, visible dès l'ajout. */
const EMPTY_SERVICE: ServiceFieldValues = { title: "", body: "", highlight: null, icon: SERVICE_ICONS[0].name, visible: true };

/**
 * Quoi : champs communs à l'ajout et à la modification d'un service (titre, texte, mention, icône, visibilité).
 * Input : idPrefix — préfixe unique des identifiants de champs (liaison label/champ) ; values — valeurs de départ.
 * Output : les champs du formulaire, avec longueurs maximales identiques à celles de la base.
 * Effets de bord : aucun (composant pur).
 */
function ServiceFields({ idPrefix, values }: { idPrefix: string; values: ServiceFieldValues }) {
  return (
    <>
      <label className="adm-label" htmlFor={`${idPrefix}-title`}>Titre</label>
      <input className="adm-input" id={`${idPrefix}-title`} name="title" defaultValue={values.title} maxLength={SERVICE_TITLE_MAX_LENGTH} required placeholder="Ex. Sandwichs" />
      <label className="adm-label" htmlFor={`${idPrefix}-body`}>Texte</label>
      <textarea className="adm-input" id={`${idPrefix}-body`} name="body" defaultValue={values.body} maxLength={SERVICE_BODY_MAX_LENGTH} rows={3} required />
      <p className="adm-hint">Texte de {SERVICE_BODY_MAX_LENGTH} caractères maximum. N&rsquo;indiquez que des services réellement proposés.</p>
      <label className="adm-label" htmlFor={`${idPrefix}-highlight`}>Mention mise en avant (facultatif)</label>
      <input className="adm-input adm-input--short" id={`${idPrefix}-highlight`} name="highlight" defaultValue={values.highlight ?? ""} maxLength={SERVICE_HIGHLIGHT_MAX_LENGTH} placeholder="Ex. 2,50 €" />
      <p className="adm-hint">Courte mention affichée sur la carte (prix, par exemple). Laissez vide s&rsquo;il n&rsquo;y en a pas.</p>
      <label className="adm-label" htmlFor={`${idPrefix}-icon`}>Icône</label>
      <select className="adm-input adm-input--short" id={`${idPrefix}-icon`} name="icon" defaultValue={values.icon} required>
        {SERVICE_ICONS.map((icon) => (
          <option key={icon.name} value={icon.name}>{icon.label}</option>
        ))}
      </select>
      <label className="adm-check">
        <input type="checkbox" name="visible" defaultChecked={values.visible} />
        Visible sur le site
      </label>
    </>
  );
}

/** Formulaire d'ajout d'un service. */
export function CreateServiceForm() {
  return (
    <ActionForm action={createServiceAction} className="adm-card adm-form">
      <h2 className="adm-h2">Nouveau service</h2>
      <ServiceFields idPrefix="new-service" values={EMPTY_SERVICE} />
      <div className="adm-inline"><SubmitButton pendingLabel="Ajout…">Ajouter le service</SubmitButton></div>
      <FormMessage />
    </ActionForm>
  );
}

/** Formulaire de modification d'un service existant. */
export function EditServiceForm({ service }: { service: ServiceItem }) {
  return (
    <ActionForm action={updateServiceAction} className="adm-form adm-service-edit">
      <input type="hidden" name="id" value={service.id} />
      <ServiceFields idPrefix={`service-${service.id}`} values={service} />
      <div className="adm-inline"><SubmitButton variant="ghost" pendingLabel="Enregistrement…">Enregistrer</SubmitButton></div>
      <FormMessage />
    </ActionForm>
  );
}
