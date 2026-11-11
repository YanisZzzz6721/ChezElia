import { describe, expect, it } from "vitest";
import { formatPrice } from "@/lib/price";
import { CATEGORIES, PRODUCTS } from "./products";

describe("données du catalogue", () => {
  it("n'a pas deux produits avec le même identifiant", () => {
    const ids = PRODUCTS.map((product) => product.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("n'utilise que des catégories existantes", () => {
    const knownIds = new Set(CATEGORIES.map((category) => category.id));
    for (const product of PRODUCTS) {
      if (product.categoryId !== null) expect(knownIds.has(product.categoryId)).toBe(true);
    }
  });

  it("a un titre non vide et un prix valide (ou absent) pour chaque produit", () => {
    for (const product of PRODUCTS) {
      expect(product.title.trim()).not.toBe("");
      expect(() => formatPrice(product.priceInCents)).not.toThrow();
    }
  });
});
