"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionResult } from "@/lib/admin/result";
import { createSessionClient } from "@/lib/supabase/sessionClient";

const credentialsSchema = z.object({ email: z.string().trim().email().max(200), password: z.string().min(1).max(200) });
const FAILED_LOGIN_DELAY_MS = 700;
const GENERIC_LOGIN_ERROR = "Identifiant ou mot de passe incorrect.";

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

/**
 * Quoi : connecte l'administrateur (compte commun) par e-mail et mot de passe.
 * Input : _previous — état précédent (useActionState) ; formData — champs email et password.
 * Output : null avant tentative ; { ok: false, error } si la connexion échoue (message volontairement
 *   identique pour un mauvais identifiant, un mauvais mot de passe ou un compte non admin).
 * Effets de bord : appelle Supabase Auth, pose les cookies de session (httpOnly), redirige vers /admin en cas de succès.
 *   Ralentit chaque échec de 0,7 s (freine les essais en rafale ; Supabase limite aussi les tentatives par IP).
 */
export async function loginAction(_previous: ActionResult, formData: FormData): Promise<ActionResult> {
  const credentials = credentialsSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!credentials.success) {
    await wait(FAILED_LOGIN_DELAY_MS);
    return { ok: false, error: GENERIC_LOGIN_ERROR };
  }

  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.signInWithPassword(credentials.data);
  const isAdmin = data.user?.app_metadata?.role === "admin";
  if (error || !isAdmin) {
    if (!error) await supabase.auth.signOut();
    await wait(FAILED_LOGIN_DELAY_MS);
    return { ok: false, error: GENERIC_LOGIN_ERROR };
  }
  redirect("/admin");
}

/**
 * Quoi : déconnecte l'administrateur.
 * Input : aucun.
 * Output : aucun (redirige vers la page de connexion).
 * Effets de bord : invalide la session Supabase et supprime les cookies.
 */
export async function logoutAction(): Promise<void> {
  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signOut();
  if (error) console.error("[admin] Déconnexion :", error.message);
  redirect("/admin/login");
}
