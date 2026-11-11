import type { SupabaseClient, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/sessionClient";

export interface AdminContext {
  supabase: SupabaseClient;
  user: User;
}

const ADMIN_ROLE = "admin";

/**
 * Quoi : vérifie qu'une requête vient bien de l'administrateur connecté (à appeler en tête de chaque page
 * et de chaque action d'admin : l'interface masquée ne protège rien).
 * Input : aucun (lit la session dans les cookies).
 * Output : { supabase, user } pour agir avec les droits de l'administrateur.
 * Effets de bord : appelle Supabase Auth (getUser vérifie le jeton côté serveur) ; redirige vers /admin/login
 *   si la session est absente, expirée ou si le compte n'a pas le rôle admin.
 */
export async function requireAdmin(): Promise<AdminContext> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/admin/login");
  if (data.user.app_metadata?.role !== ADMIN_ROLE) redirect("/admin/login");
  return { supabase, user: data.user };
}
