export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

/**
 * Quoi : lit et valide la configuration Supabase depuis les variables d'environnement.
 * Input : aucun (lit process.env).
 * Output : { url, anonKey }.
 * Effets de bord : aucun. Lève une Error actionnable si une variable manque ou si l'URL est invalide.
 */
export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Configuration Supabase manquante : définissez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY (voir .env.example, puis .env.local).",
    );
  }
  try {
    new URL(url);
  } catch {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL n'est pas une URL valide : « ${url} ».`);
  }
  return { url, anonKey };
}
