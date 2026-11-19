import { describe, expect, it } from "vitest";
import { buildSitemapPaths } from "./sitemapPaths";

const pathsOf = (input: Parameters<typeof buildSitemapPaths>[0]) => buildSitemapPaths(input).map((entry) => entry.path);

describe("buildSitemapPaths", () => {
  it("garde toujours l'accueil et les pages légales", () => {
    expect(pathsOf({ indexableRayonSlugs: [], isUsImportPageIndexable: false })).toEqual(["/", "/mentions-legales", "/confidentialite"]);
  });

  it("ajoute /rayons et chaque rayon indexable (dans l'ordre reçu) dès qu'il y en a un", () => {
    expect(pathsOf({ indexableRayonSlugs: ["boissons", "confiserie"], isUsImportPageIndexable: false })).toEqual([
      "/",
      "/rayons",
      "/rayons/boissons",
      "/rayons/confiserie",
      "/mentions-legales",
      "/confidentialite",
    ]);
  });

  it("n'ajoute /rayons ni aucun rayon quand aucun n'est indexable (la page /rayons serait en noindex)", () => {
    expect(pathsOf({ indexableRayonSlugs: [], isUsImportPageIndexable: true })).not.toContain("/rayons");
  });

  it("ajoute /produits-americains seulement s'il est indexable", () => {
    expect(pathsOf({ indexableRayonSlugs: [], isUsImportPageIndexable: true })).toContain("/produits-americains");
    expect(pathsOf({ indexableRayonSlugs: [], isUsImportPageIndexable: false })).not.toContain("/produits-americains");
  });
});
