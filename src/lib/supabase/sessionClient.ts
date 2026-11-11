import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";

/**
 * Quoi : client Supabase lié à la session de l'administrateur (cookies de la requête en cours).
 * Input : aucun.
 * Output : un client qui agit avec les droits de l'utilisateur connecté (ou anonyme s'il ne l'est pas).
 * Effets de bord : lit les cookies ; peut en écrire (session rafraîchie) avec httpOnly, sameSite=lax, secure en production.
 */
export async function createSessionClient(): Promise<SupabaseClient> {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, { ...options, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
          }
        } catch {
          // Appelé depuis un Server Component : Next interdit d'écrire un cookie à ce moment.
          // Sans conséquence : proxy.ts rafraîchit la session à chaque requête /admin.
        }
      },
    },
  });
}
