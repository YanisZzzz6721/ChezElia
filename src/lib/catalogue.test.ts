import { describe, expect, it } from "vitest";
import type { Product } from "@/content/products";
import { ALL_CATEGORIES_ID, filterProducts, limitVisible, listCategoriesWithProducts, normalizeForSearch, searchProducts } from "./catalogue";

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

describe("normalizeForSearch", () => {
  it("met en minuscules, retire les accents et la ponctuation", () => {
    expect(normalizeForSearch("Têtes  Brûlées — Paint-Billes!")).toBe("tetes brulees paint billes");
    expect(normalizeForSearch("Café ÉPICERIE")).toBe("cafe epicerie");
  });

  it("gère les ligatures et les apostrophes", () => {
    expect(normalizeForSearch("Côte de bœuf")).toBe("cote de boeuf");
    expect(normalizeForSearch("Jack Daniel's")).toBe("jack daniel s");
  });

  it("renvoie une chaîne vide pour une entrée vide ou sans lettre", () => {
    expect(normalizeForSearch("")).toBe("");
    expect(normalizeForSearch("  !!  ")).toBe("");
  });
});

describe("searchProducts", () => {
  const list: readonly Product[] = [
    { id: "1", title: "Coca-Cola Cherry", categoryId: null, priceInCents: null },
    { id: "2", title: "Têtes Brûlées Paint Billes", categoryId: null, priceInCents: null },
    { id: "3", title: "Brets chips Côte de bœuf grillée", categoryId: null, priceInCents: null, description: "Chips saveur barbecue" },
    { id: "4", title: "Fanta Orange", categoryId: null, priceInCents: 150 },
  ];

  it("renvoie tout pour une recherche vide", () => {
    expect(searchProducts(list, "").map((p) => p.id)).toEqual(["1", "2", "3", "4"]);
    expect(searchProducts(list, "   ").map((p) => p.id)).toEqual(["1", "2", "3", "4"]);
  });

  it("ignore accents, majuscules et tirets", () => {
    expect(searchProducts(list, "tete brulee").map((p) => p.id)).toEqual(["2"]);
    expect(searchProducts(list, "COCA cola").map((p) => p.id)).toEqual(["1"]);
    expect(searchProducts(list, "boeuf").map((p) => p.id)).toEqual(["3"]);
  });

  it("exige que tous les mots soient présents, dans n'importe quel ordre", () => {
    expect(searchProducts(list, "orange fanta").map((p) => p.id)).toEqual(["4"]);
    expect(searchProducts(list, "fanta cherry")).toEqual([]);
  });

  it("cherche aussi dans la description", () => {
    expect(searchProducts(list, "barbecue").map((p) => p.id)).toEqual(["3"]);
  });

  it("renvoie une liste vide si rien ne correspond, et accepte une liste vide", () => {
    expect(searchProducts(list, "xyz")).toEqual([]);
    expect(searchProducts([], "fanta")).toEqual([]);
  });

  it("traite les caractères spéciaux comme du texte, sans erreur", () => {
    expect(searchProducts(list, "%.*(")).toHaveLength(4);
    expect(searchProducts(list, "<script>")).toEqual([]);
  });
});

describe("limitVisible", () => {
  it("garde les n premiers éléments", () => {
    expect(limitVisible([1, 2, 3, 4, 5], 3)).toEqual([1, 2, 3]);
  });

  it("renvoie tout si la limite dépasse la taille, et rien pour 0", () => {
    expect(limitVisible([1, 2], 10)).toEqual([1, 2]);
    expect(limitVisible([1, 2], 0)).toEqual([]);
  });

  it("rejette une limite négative ou non entière", () => {
    expect(() => limitVisible([1], -1)).toThrow(/limite/i);
    expect(() => limitVisible([1], 1.5)).toThrow(/limite/i);
  });
});
