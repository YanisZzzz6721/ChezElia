"use client";

import { useFormStatus } from "react-dom";
import { useActionFormState } from "./ActionForm";

interface SubmitButtonProps {
  children: React.ReactNode;
  /** Texte affiché pendant l'envoi. */
  pendingLabel?: string;
  variant?: "primary" | "ghost" | "danger";
}

/** Bouton d'envoi de formulaire : se désactive et change de texte pendant l'envoi (évite le double clic). */
export function SubmitButton({ children, pendingLabel = "Envoi…", variant = "primary" }: SubmitButtonProps) {
  const { pending: nativePending } = useFormStatus();
  const { pending: actionPending } = useActionFormState();
  const pending = nativePending || actionPending;
  return (
    <button className={`b-btn b-btn--${variant === "primary" ? "primary" : "ghost"} adm-btn adm-btn--${variant}`} type="submit" disabled={pending} aria-disabled={pending}>
      <span className="b-btn__row">{pending ? pendingLabel : children}</span>
    </button>
  );
}
