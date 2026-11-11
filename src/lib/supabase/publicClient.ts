import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

/**
 * Quoi : client Supabase anonyme pour lire les données publiques (sans session, sans cookie).
 * Input : aucun.
 * Output : un client qui ne peut que lire ce que les règles RLS autorisent aux visiteurs.
 * Effets de bord : aucun (pas de session conservée).
 */
export function createPublicClient(): SupabaseClient {
  const { url, anonKey } = getSupabaseEnv();
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
