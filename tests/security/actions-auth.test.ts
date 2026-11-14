import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ACTIONS_DIR = join(process.cwd(), "src/app/admin/_actions");
const PUBLIC_ACTIONS = new Set(["loginAction", "logoutAction"]);

/** Découpe le fichier en fonctions exportées : [nom, corps]. */
function listExportedActions(source: string): [string, string][] {
  const parts = source.split(/\n(?=export async function )/).slice(1);
  return parts.map((part) => [/^export async function (\w+)/.exec(part)![1]!, part]);
}

describe("actions d'administration : contrôle de l'administrateur obligatoire", () => {
  const files = readdirSync(ACTIONS_DIR).filter((name) => name.endsWith(".ts"));

  it("trouve bien les fichiers d'actions", () => {
    expect(files.length).toBeGreaterThanOrEqual(5);
  });

  for (const file of files) {
    for (const [name, body] of listExportedActions(readFileSync(join(ACTIONS_DIR, file), "utf8"))) {
      if (PUBLIC_ACTIONS.has(name)) continue;
      it(`${file} › ${name} appelle requireAdmin() avant toute lecture ou écriture`, () => {
        const firstCall = body.indexOf("requireAdmin()");
        expect(firstCall, `${name} n'appelle pas requireAdmin()`).toBeGreaterThan(-1);
        // requireAdmin doit précéder tout accès à des données (supabase.from / storage) et toute lecture du formulaire.
        for (const sensitive of ["supabase.from(", "supabase.storage", "formData.get(", "parse"]) {
          const position = body.indexOf(sensitive);
          if (position !== -1) expect(firstCall, `${name} : ${sensitive} avant requireAdmin()`).toBeLessThan(position);
        }
      });
    }
  }

  it("la route d'export et toutes les pages d'administration vérifient aussi l'administrateur", () => {
    const targets = [
      "src/app/admin/(panel)/sauvegarde/export/route.ts",
      "src/app/admin/(panel)/sauvegarde/page.tsx",
      "src/app/admin/(panel)/site/page.tsx",
      "src/app/admin/(panel)/categories/page.tsx",
      "src/app/admin/(panel)/faq/page.tsx",
      "src/app/admin/(panel)/produits/page.tsx",
      "src/app/admin/(panel)/produits/nouveau/page.tsx",
      "src/app/admin/(panel)/produits/[id]/page.tsx",
      "src/app/admin/(panel)/layout.tsx",
    ];
    for (const target of targets) expect(readFileSync(join(process.cwd(), target), "utf8"), target).toContain("requireAdmin()");
  });
});
