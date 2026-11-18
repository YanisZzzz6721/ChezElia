"use client";

import { useState } from "react";

/**
 * Quoi : donne le type du champ et le libellé du bouton selon que le mot de passe est affiché ou non.
 * Input : isVisible — vrai si le mot de passe doit être lisible.
 * Output : { inputType, buttonLabel }.
 * Effets de bord : aucun (fonction pure).
 */
export function passwordToggleState(isVisible: boolean): { inputType: "text" | "password"; buttonLabel: string } {
  return isVisible
    ? { inputType: "text", buttonLabel: "Masquer le mot de passe" }
    : { inputType: "password", buttonLabel: "Afficher le mot de passe" };
}

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {crossed ? <path d="M4 4l16 16" /> : null}
    </svg>
  );
}

interface PasswordInputProps {
  id: string;
  name: string;
  autoComplete: "current-password" | "new-password";
}

/**
 * Quoi : champ mot de passe avec un bouton « œil » pour afficher ou masquer la saisie.
 * Input : id, name, autoComplete — attributs du champ.
 * Output : le champ (masqué au chargement) et son bouton.
 * Effets de bord : état local d'affichage uniquement ; le bouton est de type « button » et n'envoie jamais le formulaire.
 */
export function PasswordInput({ id, name, autoComplete }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { inputType, buttonLabel } = passwordToggleState(isVisible);
  return (
    <div className="adm-pass">
      <input className="adm-input adm-pass__input" id={id} name={name} type={inputType} autoComplete={autoComplete} required />
      <button
        className="adm-pass__toggle"
        type="button"
        aria-label={buttonLabel}
        aria-pressed={isVisible}
        aria-controls={id}
        onClick={() => setIsVisible((visible) => !visible)}
      >
        <EyeIcon crossed={isVisible} />
      </button>
    </div>
  );
}
