import { describe, expect, it } from "vitest";
import { findUsImportBrand, isAlcoholTitle, normalizeForBrandMatching, suggestUsImports, type ProductToReview } from "./usImportSuggestions";

describe("normalizeForBrandMatching", () => {
  it("passe en minuscules, retire accents et apostrophes, remplace la ponctuation par des espaces", () => {
    expect(normalizeForBrandMatching("Reese’s  Peanut-Butter Cups")).toBe("reeses peanut butter cups");
    expect(normalizeForBrandMatching("Dr. Pepper (Cherry)")).toBe("dr pepper cherry");
    expect(normalizeForBrandMatching("Mike & Ike")).toBe("mike ike");
  });
});

describe("findUsImportBrand", () => {
  it("reconnaît une marque de la liste du propriétaire, quelle que soit la casse ou la ponctuation", () => {
    expect(findUsImportBrand("Candy Pop Popcorn Twix")?.name).toBe("Candy Pop");
    expect(findUsImportBrand("REESE'S Peanut Butter Cups")?.name).toBe("Reese's");
    expect(findUsImportBrand("Hersheys Kisses")?.name).toBe("Hershey's");
    expect(findUsImportBrand("Fruit Roll-Ups Strawberry")?.name).toBe("Roll-Ups");
    expect(findUsImportBrand("Mike & Ike Original Fruits")?.name).toBe("Mike and Ike");
    expect(findUsImportBrand("Dr. Pepper Cherry")?.name).toBe("Dr Pepper");
  });

  it("ne reconnaît qu'un mot entier (pas un morceau d'un autre mot)", () => {
    expect(findUsImportBrand("Takisha thé")).toBeNull();
    expect(findUsImportBrand("Pizzarizona")).toBeNull();
  });

  it("ne propose rien pour un titre sans marque connue, vide ou blanc", () => {
    expect(findUsImportBrand("Couscous Samia moyen")).toBeNull();
    expect(findUsImportBrand("")).toBeNull();
    expect(findUsImportBrand("   ")).toBeNull();
  });

  it("conserve le niveau de confiance de la marque trouvée", () => {
    expect(findUsImportBrand("Takis Fuego")?.confidence).toBe("owner-list");
    expect(findUsImportBrand("Jelly Belly Bubble Gum")?.confidence).toBe("to-check");
  });

  it("n'écarte pas un produit simplement parce qu'il contient un mot d'alcool dans une autre marque (mot entier seulement)", () => {
    expect(isAlcoholTitle("Gingembre Citron")).toBe(false);
    expect(isAlcoholTitle("Vinaigre balsamique")).toBe(false);
  });
});

describe("isAlcoholTitle", () => {
  it("repère les boissons alcoolisées (jamais proposées : licence non confirmée)", () => {
    for (const title of ["Jack Daniel's Old No.7 Tennessee Whiskey 70 cl", "Slash IPA (bière)", "Cîroc Mango (vodka aromatisée)", "Veuve Pelletier Champagne Brut"]) {
      expect(isAlcoholTitle(title), title).toBe(true);
    }
  });
});

describe("suggestUsImports", () => {
  const product = (overrides: Partial<ProductToReview>): ProductToReview => ({ id: "1", title: "Takis Fuego", visible: true, is_us_import: false, ...overrides });

  it("propose les produits de marque américaine, avec leur état et la marque trouvée", () => {
    const result = suggestUsImports([product({ id: "a" }), product({ id: "b", title: "Couscous", visible: false }), product({ id: "c", title: "Arizona Green Tea", visible: false })]);
    expect(result.suggestions.map((s) => [s.id, s.brandName, s.visible])).toEqual([["a", "Takis", true], ["c", "Arizona", false]]);
  });

  it("ignore les produits déjà cochés « Import USA » (et les compte), et les alcools (et les compte)", () => {
    const result = suggestUsImports([product({ id: "a", is_us_import: true }), product({ id: "b", title: "Jolly Rancher Vodka aromatisée" }), product({ id: "c", title: "Takis Blue Heat" })]);
    expect(result.suggestions.map((s) => s.id)).toEqual(["c"]);
    expect(result.alreadyMarkedCount).toBe(1);
    expect(result.excludedAlcoholCount).toBe(1);
  });

  it("accepte une liste vide", () => {
    expect(suggestUsImports([])).toEqual({ suggestions: [], alreadyMarkedCount: 0, excludedAlcoholCount: 0 });
  });

  it("ne modifie pas les produits reçus (lecture seule)", () => {
    const input = [product({ id: "a" })];
    const snapshot = JSON.stringify(input);
    suggestUsImports(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});
