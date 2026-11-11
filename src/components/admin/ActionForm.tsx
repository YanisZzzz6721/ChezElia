"use client";

import { createContext, startTransition, useActionState, useContext, type FormEvent } from "react";
import type { ActionResult } from "@/lib/admin/result";

interface ActionFormContextValue {
  state: ActionResult;
  pending: boolean;
}

const ActionFormContext = createContext<ActionFormContextValue>({ state: null, pending: false });

/** État (message de retour, envoi en cours) du formulaire d'action le plus proche. */
export function useActionFormState(): ActionFormContextValue {
  return useContext(ActionFormContext);
}

interface ActionFormProps {
  action: (previous: ActionResult, formData: FormData) => Promise<ActionResult>;
  className?: string;
  encType?: "multipart/form-data";
  children: React.ReactNode;
}

/**
 * Quoi : formulaire branché sur une action serveur, qui CONSERVE les valeurs saisies après une erreur
 *   (React 19 vide sinon les champs à la fin de l'action) et expose le message de retour et l'envoi en cours.
 * Input : action — l'action serveur (état précédent, données) ; className/encType — habillage ; children — champs.
 * Output : le <form>, avec un contexte lu par SubmitButton et FormMessage.
 * Effets de bord : au envoi, empêche la soumission native et appelle l'action serveur dans une transition.
 */
export function ActionForm({ action, className, encType, children }: ActionFormProps) {
  const [state, runAction, pending] = useActionState<ActionResult, FormData>(action, null);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => runAction(formData));
  }

  return (
    <ActionFormContext.Provider value={{ state, pending }}>
      <form onSubmit={handleSubmit} className={className} encType={encType}>
        {children}
      </form>
    </ActionFormContext.Provider>
  );
}
