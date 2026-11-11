"use client";

import { useActionFormState } from "./ActionForm";

/** Message de retour du formulaire d'action le plus proche : succès (vert) ou erreur (rouge), annoncé aux lecteurs d'écran. */
export function FormMessage() {
  const { state } = useActionFormState();
  if (!state) return null;
  return (
    <p className={`adm-msg ${state.ok ? "adm-msg--ok" : "adm-msg--err"}`} role={state.ok ? "status" : "alert"}>
      {state.ok ? state.message : state.error}
    </p>
  );
}
