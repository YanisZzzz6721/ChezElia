import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

const LOGIN_PATH = "/admin/login";

/**
 * Quoi : rafraîchit la session de l'administrateur et redirige vers la connexion si elle est absente
 * (contrôle « optimiste » : l'autorisation réelle est refaite dans chaque page et chaque action).
 * Input : request — la requête vers /admin/*.
 * Output : la réponse (suite normale avec cookies à jour, ou redirection vers /admin/login).
 * Effets de bord : appelle Supabase Auth ; réécrit les cookies de session (httpOnly).
 */
export async function proxy(request: NextRequest) {
  const { url, anonKey } = getSupabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, { ...options, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
        }
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const isLoginPage = request.nextUrl.pathname === LOGIN_PATH;
  if (!data.user && !isLoginPage) return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  if (data.user && isLoginPage) return NextResponse.redirect(new URL("/admin", request.url));
  return response;
}

export const config = { matcher: ["/admin/:path*"] };
