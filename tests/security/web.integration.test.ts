/**
 * Tests de sécurité « boîte noire » du site, rejouables contre un serveur lancé (production de préférence).
 * Usage : TARGET_URL=http://localhost:3000 npm run test:security
 * Cible : UNIQUEMENT une application appartenant au commerçant (local ou son propre déploiement).
 */
import { describe, expect, it } from "vitest";

const TARGET_URL = process.env.TARGET_URL;
if (!TARGET_URL) throw new Error("Variable TARGET_URL requise (ex. http://localhost:3000).");

const UUID = "11111111-1111-4111-8111-111111111111";
const fetchRaw = (path: string, init: RequestInit = {}) => fetch(`${TARGET_URL}${path}`, { redirect: "manual", ...init });
const isRedirectToLogin = (response: Response) => [307, 308, 302, 303].includes(response.status) && (response.headers.get("location") ?? "").includes("/admin/login");

describe("authentification : aucune page d'admin sans session", () => {
  const adminPaths = ["/admin", "/admin/produits", "/admin/produits?q=a", "/admin/produits?vue=corbeille", "/admin/produits/nouveau", `/admin/produits/${UUID}`, "/admin/categories", "/admin/site", "/admin/sauvegarde", "/admin/sauvegarde/export"];

  it.each(adminPaths)("%s redirige vers la connexion et ne renvoie aucun contenu", async (path) => {
    const response = await fetchRaw(path);
    expect(isRedirectToLogin(response), `${path} → ${response.status}`).toBe(true);
    expect(await response.text()).not.toMatch(/Coca|Produits|Sauvegarde|price_cents/i);
  });

  it("refuse un jeton falsifié ou expiré", async () => {
    const forged = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYWRtaW4ifQ.signature-bidon";
    const response = await fetchRaw("/admin/produits", { headers: { cookie: `sb-127-auth-token=${forged}; sb-access-token=${forged}` } });
    expect(isRedirectToLogin(response)).toBe(true);
  });

  it("n'expose pas l'export complet sans session, même avec des en-têtes d'autorisation forgés", async () => {
    const response = await fetchRaw("/admin/sauvegarde/export", { headers: { authorization: "Bearer faux", "x-forwarded-user": "admin", "x-middleware-subrequest": "src/proxy" } });
    expect(isRedirectToLogin(response)).toBe(true);
  });
});

describe("en-têtes de sécurité", () => {
  for (const path of ["/", "/admin/login", "/mentions-legales"]) {
    it(`${path} porte les en-têtes attendus`, async () => {
      const headers = (await fetchRaw(path)).headers;
      expect(headers.get("x-content-type-options")).toBe("nosniff");
      expect(headers.get("x-frame-options")).toBe("DENY");
      expect(headers.get("referrer-policy")).toBeTruthy();
      expect(headers.get("permissions-policy")).toMatch(/camera=\(\)/);
      expect(headers.get("x-powered-by")).toBeNull();
      const csp = headers.get("content-security-policy") ?? "";
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).not.toMatch(/script-src[^;]*\*[^;]*;/);
    });
  }

  it("ne met jamais les pages d'administration en cache partagé", async () => {
    const cacheControl = (await fetchRaw("/admin/login")).headers.get("cache-control") ?? "";
    expect(cacheControl).not.toMatch(/public|s-maxage/i);
  });
});

describe("endpoints oubliés et fuites de fichiers", () => {
  const sensitivePaths = ["/.env", "/.env.local", "/.git/config", "/.git/HEAD", "/package.json", "/package-lock.json", "/next.config.ts", "/supabase/config.toml", "/supabase/seed.sql", "/src/proxy.ts", "/scripts/create-admin.mjs", "/docs/admin.md", "/api", "/api/internal", "/debug", "/metrics", "/admin/.env", "/..%2f..%2f.env", "/%2e%2e/%2e%2e/etc/passwd", "/_next/../package.json"];

  it.each(sensitivePaths)("%s ne renvoie rien de sensible", async (path) => {
    const response = await fetchRaw(path);
    expect([301, 302, 307, 308, 400, 403, 404]).toContain(response.status);
    const body = await response.text();
    expect(body).not.toMatch(/SUPABASE_|service_role|sb_secret|root:x:|\[core\]|"dependencies"/);
  });

  it("n'expose pas de source maps en production", async () => {
    const html = await (await fetchRaw("/")).text();
    const scriptPath = /\/_next\/static\/chunks\/[^"']+\.js/.exec(html)?.[0];
    expect(scriptPath).toBeTruthy();
    expect((await fetchRaw(`${scriptPath}.map`)).status).toBe(404);
  });
});

describe("entrées malveillantes sur les pages publiques", () => {
  const payloads = ["' OR 1=1 --", "\"; DROP TABLE products; --", "../../etc/passwd", "<script>alert(1)</script>", "${7*7}", "%00", "A".repeat(5000)];

  it.each(payloads)("la page d'accueil ignore ou rejette proprement %j", async (payload) => {
    const response = await fetchRaw(`/?q=${encodeURIComponent(payload)}&cat=${encodeURIComponent(payload)}`);
    expect(response.status).toBeLessThan(500);
    const body = await response.text();
    expect(body).not.toContain("<script>alert(1)</script>");
    expect(body).not.toMatch(/syntax error|PGRST|stack|at Object\./i);
  });

  it("répond 404 (pas 500) à une page inexistante et ne reflète pas son chemin", async () => {
    const response = await fetchRaw("/<img src=x onerror=alert(1)>");
    expect([400, 404]).toContain(response.status);
    expect(await response.text()).not.toContain("<img src=x onerror");
  });

  it("refuse les méthodes d'écriture sur les pages publiques", async () => {
    for (const method of ["PUT", "DELETE", "PATCH"]) {
      const response = await fetchRaw("/", { method });
      expect([404, 405, 400, 403]).toContain(response.status);
    }
  });
});

describe("référencement et exposition", () => {
  it("robots.txt interdit l'administration à tous les robots", async () => {
    const body = await (await fetchRaw("/robots.txt")).text();
    expect(body).toMatch(/Disallow: \/(admin)?\s*$/m);
  });
});
