import type { NextConfig } from "next";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

/** Origine du stockage Supabase (photos publiques) ; vide si la variable n'est pas définie. */
function getSupabaseOrigin(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return "";
  try {
    return new URL(url).origin;
  } catch {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL n'est pas une URL valide : « ${url} ».`);
  }
}
const SUPABASE_ORIGIN = getSupabaseOrigin();

/**
 * Politique CSP : tout vient du site lui-même. « unsafe-inline » reste nécessaire pour les scripts et
 * styles injectés par Next ; « unsafe-eval » n'est autorisé qu'en développement (rechargement à chaud).
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${IS_PRODUCTION ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: ${SUPABASE_ORIGIN}`.trim(),
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

/** En-têtes de sécurité appliqués à toutes les pages. */
const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Permet de lancer en parallèle un second serveur de développement (ex. branché sur le cloud) sans conflit de verrou.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // Les photos (8 Mo maximum, vérifiées côté serveur) transitent par les Server Actions : limite relevée au-delà du 1 Mo par défaut.
  experimental: { serverActions: { bodySizeLimit: "10mb" } },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
