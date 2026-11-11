"use client";

import { SubmitButton } from "./SubmitButton";

interface ConfirmSubmitButtonProps {
  children: React.ReactNode;
  /** Question posée avant l'action (ex. « Supprimer définitivement ce produit ? »). */
  message: string;
  variant?: "primary" | "ghost" | "danger";
}

/**
 * Quoi : bouton d'envoi qui demande une confirmation avant d'agir (suppression, corbeille…).
 * Input : message — la question ; children — le libellé du bouton ; variant — le style.
 * Output : le bouton ; si l'administrateur annule, l'envoi du formulaire est bloqué.
 * Effets de bord : ouvre une boîte de confirmation du navigateur au clic.
 */
export function ConfirmSubmitButton({ children, message, variant = "danger" }: ConfirmSubmitButtonProps) {
  return (
    <span
      onClickCapture={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <SubmitButton variant={variant}>{children}</SubmitButton>
    </span>
  );
}
