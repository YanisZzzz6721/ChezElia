import { describe, expect, it } from "vitest";
import { CATEGORY_SLUG_MAX_LENGTH, isValidCategorySlug, CATEGORY_SLUG_PATTERN, CategorySlugError, assignLegacyCategorySlugs, pickFreeSlug, slugifyCategoryName } from "./categorySlug";

describe("slugifyCategoryName", () => {
  it("passe en minuscules et retire les accents", () => {
    expect(slugifyCategoryName("Épicerie")).toBe("epicerie");
    expect(slugifyCategoryName("Hygiène")).toBe("hygiene");
    expect(slugifyCategoryName("Çà et Là")).toBe("ca-et-la");
  });

  it("traduit les ligatures et le eszett comme la base de données (unaccent)", () => {
    expect(slugifyCategoryName("Œufs")).toBe("oeufs");
    expect(slugifyCategoryName("Æther")).toBe("aether");
    expect(slugifyCategoryName("Straße")).toBe("strasse");
  });

  it("transforme apostrophes (droite et typographique) et ponctuation en tirets", () => {
    expect(slugifyCategoryName("Produits d'ici")).toBe("produits-d-ici");
    expect(slugifyCategoryName("L’été")).toBe("l-ete");
    expect(slugifyCategoryName("Snacks & boissons !")).toBe("snacks-boissons");
  });

  it("réduit les espaces multiples et retire les tirets de début et de fin", () => {
    expect(slugifyCategoryName("  Snacks    salés  ")).toBe("snacks-sales");
    expect(slugifyCategoryName("--Boissons--")).toBe("boissons");
  });

  it("ignore les emoji et garde le reste", () => {
    expect(slugifyCategoryName("Pizza 🍕 surgelée")).toBe("pizza-surgelee");
  });

  it("garde les chiffres", () => {
    expect(slugifyCategoryName("Rayon 24h")).toBe("rayon-24h");
  });

  it("produit toujours une adresse valide (même motif que la base)", () => {
    for (const name of ["Épicerie", "a", "Œufs & Café — été 2026", "A  B"]) {
      expect(slugifyCategoryName(name)).toMatch(CATEGORY_SLUG_PATTERN);
    }
  });

  it("limite l'adresse à 60 caractères sans finir par un tiret", () => {
    const slug = slugifyCategoryName(`${"a".repeat(59)} bbb`);
    expect(slug).toBe("a".repeat(59));
    expect(slug.length).toBeLessThanOrEqual(CATEGORY_SLUG_MAX_LENGTH);
    expect(slugifyCategoryName("œ".repeat(40)).length).toBe(CATEGORY_SLUG_MAX_LENGTH);
  });

  it("refuse un nom sans lettre ni chiffre avec une erreur explicite", () => {
    for (const name of ["", "   ", "🍕", "!!! ???", "---"]) {
      expect(() => slugifyCategoryName(name), JSON.stringify(name)).toThrow(CategorySlugError);
    }
    expect(() => slugifyCategoryName("🍕")).toThrow(/lettre ou un chiffre/);
  });
});

describe("isValidCategorySlug", () => {
  it("accepte une adresse bien formée de 1 à 60 caractères", () => {
    for (const slug of ["a", "epicerie", "rayon-24h", "a".repeat(60)]) expect(isValidCategorySlug(slug), slug).toBe(true);
  });

  it("refuse le vide, la casse, les accents, les tirets mal placés, les chemins et plus de 60 caractères", () => {
    for (const slug of ["", "Epicerie", "épicerie", "a b", "a--b", "-a", "a-", "../x", "a/b", "a".repeat(61)]) expect(isValidCategorySlug(slug), slug).toBe(false);
  });
});

describe("pickFreeSlug", () => {
  it("garde l'adresse de base si elle est libre", () => {
    expect(pickFreeSlug("boissons", [])).toBe("boissons");
    expect(pickFreeSlug("boissons", ["confiserie"])).toBe("boissons");
  });

  it("ajoute -2, -3… en cas de collision", () => {
    expect(pickFreeSlug("boissons", ["boissons"])).toBe("boissons-2");
    expect(pickFreeSlug("boissons", ["boissons", "boissons-2"])).toBe("boissons-3");
  });

  it("saute un suffixe déjà pris par une autre catégorie", () => {
    expect(pickFreeSlug("boissons", new Set(["boissons", "boissons-2", "boissons-3", "boissons-5"]))).toBe("boissons-4");
  });

  it("reste dans 60 caractères avec le suffixe, sans tiret double", () => {
    const base = "a".repeat(60);
    const result = pickFreeSlug(base, [base]);
    expect(result).toBe(`${"a".repeat(58)}-2`);
    expect(result).toMatch(CATEGORY_SLUG_PATTERN);
    const hyphenated = `${"a".repeat(57)}-bb`;
    expect(pickFreeSlug(hyphenated, [hyphenated])).toBe(`${"a".repeat(57)}-2`);
  });
});

describe("assignLegacyCategorySlugs", () => {
  it("calcule l'adresse depuis le nom, dans l'ordre des positions, et résout les collisions", () => {
    const result = assignLegacyCategorySlugs([
      { id: "b", name: "Boissons!", position: 2 },
      { id: "a", name: "Boissons", position: 1 },
    ]);
    expect(result.get("a")).toBe("boissons");
    expect(result.get("b")).toBe("boissons-2");
  });

  it("respecte les adresses déjà connues et les réserve", () => {
    const result = assignLegacyCategorySlugs([
      { id: "a", name: "Épicerie", position: 0, slug: "epicerie-fine" },
      { id: "b", name: "Epicerie fine", position: 1 },
    ]);
    expect(result.get("a")).toBe("epicerie-fine");
    expect(result.get("b")).toBe("epicerie-fine-2");
  });

  it("utilise « rayon » pour un nom sans lettre ni chiffre (comme la migration)", () => {
    const result = assignLegacyCategorySlugs([{ id: "a", name: "🍕", position: 0 }, { id: "b", name: "🍔", position: 1 }]);
    expect(result.get("a")).toBe("rayon");
    expect(result.get("b")).toBe("rayon-2");
  });

  it("accepte une liste vide", () => {
    expect(assignLegacyCategorySlugs([]).size).toBe(0);
  });
});
