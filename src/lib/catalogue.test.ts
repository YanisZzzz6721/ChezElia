import { describe, expect, it } from "vitest";
import type { Product } from "@/content/products";
import { ALL_CATEGORIES_ID, filterProducts, listCategoriesWithProducts } from "./catalogue";

const products: readonly Product[] = [
  { id: "a", title: "A", categoryId: "boissons", priceInCents: null },
  { id: "b", title: "B", categoryId: "confiserie", priceInCents: 150 },
  { id: "c", title: "C", categoryId: null, priceInCents: 0 },
  { id: "d", title: "D", categoryId: "boissons", priceInCents: null },
];

describe("filterProducts", () => {
  it("renvoie tout (y compris sans catégorie) pour « all », dans l'ordre", () => {
    expect(filterProducts(products, ALL_CATEGORIES_ID).map((p) => p.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("ne garde que la catégorie demandée", () => {
    expect(filterProducts(products, "boissons").map((p) => p.id)).toEqual(["a", "d"]);
  });

  it("renvoie une liste vide pour une catégorie sans produit ou inconnue", () => {
    expect(filterProducts(products, "inconnue")).toEqual([]);
  });

  it("gère un catalogue vide", () => {
    expect(filterProducts([], ALL_CATEGORIES_ID)).toEqual([]);
  });
});

describe("listCategoriesWithProducts", () => {
  const categories = [
    { id: "boissons", label: "Boissons" },
    { id: "confiserie", label: "Confiserie" },
    { id: "vide", label: "Catégorie vide" },
  ];

  it("ne garde que les catégories qui ont au moins un produit, dans l'ordre d'origine", () => {
    expect(listCategoriesWithProducts(categories, products).map((c) => c.id)).toEqual(["boissons", "confiserie"]);
  });

  it("renvoie une liste vide sans produit", () => {
    expect(listCategoriesWithProducts(categories, [])).toEqual([]);
  });

  it("ignore les produits sans catégorie", () => {
    const onlyUncategorised: readonly Product[] = [{ id: "c", title: "C", categoryId: null, priceInCents: null }];
    expect(listCategoriesWithProducts(categories, onlyUncategorised)).toEqual([]);
  });
});
