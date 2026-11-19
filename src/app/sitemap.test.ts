import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Category, Product } from "@/content/products";

const seoConfig = vi.hoisted(() => ({ value: { siteUrl: "https://chez-elia.fr" as string | null, indexing: true } }));
const fetchSiteData = vi.hoisted(() => vi.fn());

vi.mock("@/lib/seoConfig", () => ({ getSeoConfig: () => seoConfig.value }));
vi.mock("@/lib/siteQueries", () => ({ fetchSiteData }));

import sitemap from "./sitemap";

const category = (id: string, slug: string, label: string, seoIntro: string | null): Category => ({ id, slug, label, seoIntro });
const productsOf = (categoryId: string, count: number, overrides: Partial<Product> = {}): Product[] =>
  Array.from({ length: count }, (_, index) => ({ id: `${categoryId}-${index}`, title: `P${index}`, categoryId, priceInCents: null, isUsImport: false, ...overrides }));

describe("sitemap", () => {
  beforeEach(() => {
    seoConfig.value = { siteUrl: "https://chez-elia.fr", indexing: true };
    fetchSiteData.mockReset();
  });

  it("reste vide, sans aucune lecture en base, tant que l'indexation globale est fermée", async () => {
    seoConfig.value = { siteUrl: "https://chez-elia.fr", indexing: false };
    expect(await sitemap()).toEqual([]);
    expect(fetchSiteData).not.toHaveBeenCalled();
  });

  it("reste vide sans adresse de site", async () => {
    seoConfig.value = { siteUrl: null, indexing: true };
    expect(await sitemap()).toEqual([]);
  });

  it("liste les pages indexables en adresses absolues : rayons avec texte et 6 produits, produits américains hors alcool", async () => {
    fetchSiteData.mockResolvedValue({
      categories: [
        category("c1", "confiserie", "Confiserie", "Texte."),
        category("c2", "boissons", "Boissons", null),
        category("c3", "alcools", "Alcools", "Texte."),
      ],
      products: [
        ...productsOf("c1", 6),
        ...productsOf("c2", 10),
        ...productsOf("c3", 8, { isUsImport: true }),
      ],
    });
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toContain("https://chez-elia.fr/rayons");
    expect(urls).toContain("https://chez-elia.fr/rayons/confiserie");
    expect(urls).toContain("https://chez-elia.fr/rayons/alcools");
    expect(urls).not.toContain("https://chez-elia.fr/rayons/boissons");
    // Les 8 produits américains sont tous des alcools : exclus, donc moins de 6 produits.
    expect(urls).not.toContain("https://chez-elia.fr/produits-americains");
  });

  it("ajoute /produits-americains avec au moins 6 produits américains hors alcool", async () => {
    fetchSiteData.mockResolvedValue({ categories: [category("c1", "confiserie", "Confiserie", null)], products: productsOf("c1", 6, { isUsImport: true }) });
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toContain("https://chez-elia.fr/produits-americains");
    expect(urls).not.toContain("https://chez-elia.fr/rayons");
  });

  it("propage l'erreur de lecture au lieu de publier un sitemap partiel", async () => {
    fetchSiteData.mockRejectedValue(new Error("Lecture de « products » impossible : panne"));
    await expect(sitemap()).rejects.toThrow(/impossible/);
  });
});
