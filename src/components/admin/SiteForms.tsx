"use client";

import { saveHeroPhotoAction, saveHoursAction, saveSettingsAction } from "@/app/admin/_actions/site";
import { DAY_NAMES } from "@/lib/siteData";
import { ActionForm } from "./ActionForm";
import { FormMessage } from "./FormMessage";
import { PhotoField } from "./PhotoField";
import { SubmitButton } from "./SubmitButton";

interface SettingsFormProps {
  tag: string;
  lead: string;
  phone: string;
}

/** Formulaire des textes d'accueil et du téléphone public (vide = bouton Appeler désactivé). */
export function SettingsForm({ tag, lead, phone }: SettingsFormProps) {
  return (
    <ActionForm action={saveSettingsAction} className="adm-card adm-form">
      <h2 className="adm-h2">Textes de la page d&rsquo;accueil</h2>
      <label className="adm-label" htmlFor="tag">Petit texte au-dessus du titre</label>
      <input className="adm-input" id="tag" name="tag" defaultValue={tag} maxLength={60} required />
      <label className="adm-label" htmlFor="lead">Paragraphe d&rsquo;accueil</label>
      <textarea className="adm-input" id="lead" name="lead" defaultValue={lead} maxLength={300} rows={4} required />
      <label className="adm-label" htmlFor="phone">Numéro de téléphone</label>
      <input className="adm-input adm-input--short" id="phone" name="phone" defaultValue={phone} inputMode="tel" placeholder="03 88 12 34 56" />
      <p className="adm-hint">Laissez vide tant que le numéro n&rsquo;est pas connu : le bouton « Appeler » restera désactivé.</p>
      <FormMessage />
      <div className="adm-actions"><SubmitButton pendingLabel="Enregistrement…">Enregistrer les textes</SubmitButton></div>
    </ActionForm>
  );
}

export interface HoursFormValue {
  isClosed: boolean;
  opensAt: string;
  closesAt: string;
}

/** Formulaire des horaires : une ligne par jour (heures au format 15h30, ou « Fermé »). */
export function HoursForm({ hours }: { hours: HoursFormValue[] }) {
  return (
    <ActionForm action={saveHoursAction} className="adm-card adm-form">
      <h2 className="adm-h2">Horaires d&rsquo;ouverture</h2>
      <p className="adm-hint">Une fermeture après minuit (ex. 01h30) compte pour la nuit du jour indiqué.</p>
      <div className="adm-hours">
        {DAY_NAMES.map((day, index) => (
          <div className="adm-hours__row" key={day}>
            <b>{day}</b>
            <label className="adm-sr" htmlFor={`opens_${index}`}>{day} : ouverture</label>
            <input className="adm-input" id={`opens_${index}`} name={`opens_${index}`} defaultValue={hours[index]?.opensAt ?? ""} placeholder="15h30" maxLength={5} />
            <span aria-hidden="true">→</span>
            <label className="adm-sr" htmlFor={`closes_${index}`}>{day} : fermeture</label>
            <input className="adm-input" id={`closes_${index}`} name={`closes_${index}`} defaultValue={hours[index]?.closesAt ?? ""} placeholder="00h30" maxLength={5} />
            <label className="adm-check">
              <input type="checkbox" name={`closed_${index}`} defaultChecked={hours[index]?.isClosed ?? false} />
              Fermé
            </label>
          </div>
        ))}
      </div>
      <FormMessage />
      <div className="adm-actions"><SubmitButton pendingLabel="Enregistrement…">Enregistrer les horaires</SubmitButton></div>
    </ActionForm>
  );
}

/** Formulaire de la photo d'accueil (la photo est affichée entière, jamais recadrée). */
export function HeroPhotoForm({ currentUrl }: { currentUrl: string | null }) {
  return (
    <ActionForm action={saveHeroPhotoAction} className="adm-card adm-form" encType="multipart/form-data">
      <h2 className="adm-h2">Photo d&rsquo;accueil</h2>
      <PhotoField currentUrl={currentUrl} hint="Affichée entière dans le cadre « Découvrez Chez Elia ». Format vertical 3:4 conseillé. Évitez de montrer des bouteilles d'alcool au premier plan." />
      <FormMessage />
      <div className="adm-actions"><SubmitButton pendingLabel="Envoi…">Enregistrer la photo</SubmitButton></div>
    </ActionForm>
  );
}
