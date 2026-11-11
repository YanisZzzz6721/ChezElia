"use client";

import { useState } from "react";
import { loginAction } from "@/app/admin/_actions/auth";
import { ActionForm } from "./ActionForm";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

/** Formulaire de connexion de l'administrateur (compte commun). */
export function LoginForm() {
  const [email, setEmail] = useState("");
  return (
    <ActionForm action={loginAction} className="adm-card adm-form">
      <label className="adm-label" htmlFor="email">Adresse e-mail</label>
      <input className="adm-input" id="email" name="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
      <label className="adm-label" htmlFor="password">Mot de passe</label>
      <input className="adm-input" id="password" name="password" type="password" autoComplete="current-password" required />
      <FormMessage />
      <div className="adm-actions">
        <SubmitButton pendingLabel="Connexion…">Se connecter</SubmitButton>
      </div>
    </ActionForm>
  );
}
