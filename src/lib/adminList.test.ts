import { describe, expect, it } from "vitest";
import { PAGE_SIZE, buildPageRange, parseListQuery, sanitizeSearch } from "./adminList";

const UUID = "11111111-1111-4111-8111-111111111111";

describe("sanitizeSearch", () => {
  it("nettoie les espaces et borne la longueur", () => {
    expect(sanitizeSearch("  red   bull  ")).toBe("red bull");
    expect(sanitizeSearch("x".repeat(200))).toHaveLength(60);
  });

  it("retire les caractères qui ont un sens dans les filtres de la base (joker, virgule, parenthèses, antislash)", () => {
    expect(sanitizeSearch("a%b_c*d,e(f)g\\h")).toBe("a b c d e f g h".replace(/ /g, " "));
    expect(sanitizeSearch("%%%")).toBe("");
  });

  it("renvoie une chaîne vide pour une entrée vide", () => {
    expect(sanitizeSearch("")).toBe("");
    expect(sanitizeSearch("   ")).toBe("");
  });
});

describe("parseListQuery", () => {
  it("donne des valeurs par défaut sûres", () => {
    expect(parseListQuery({})).toEqual({ search: "", categoryId: null, state: "all", page: 1, view: "active" });
  });

  it("lit des paramètres valides", () => {
    expect(parseListQuery({ q: "fanta", cat: UUID, etat: "sans-prix", page: "3", vue: "corbeille" })).toEqual({
      search: "fanta", categoryId: UUID, state: "no-price", page: 3, view: "trash",
    });
    expect(parseListQuery({ etat: "masques" }).state).toBe("hidden");
    expect(parseListQuery({ etat: "visibles" }).state).toBe("visible");
  });

  it("lit le filtre « Import USA »", () => {
    expect(parseListQuery({ etat: "import-usa" }).state).toBe("us-import");
  });

  it("ignore un identifiant de catégorie, un état ou une vue invalides", () => {
    expect(parseListQuery({ cat: "pas-un-uuid" }).categoryId).toBeNull();
    expect(parseListQuery({ etat: "n-importe-quoi" }).state).toBe("all");
    expect(parseListQuery({ vue: "autre" }).view).toBe("active");
  });

  it("ramène une page invalide, nulle, négative ou démesurée à une valeur sûre", () => {
    for (const page of ["abc", "0", "-4", "1.5", ""]) expect(parseListQuery({ page }).page).toBe(1);
    expect(parseListQuery({ page: "99999999" }).page).toBe(10000);
  });
});

describe("buildPageRange", () => {
  it("calcule les bornes (inclusives) d'une page", () => {
    expect(buildPageRange(1)).toEqual({ from: 0, to: PAGE_SIZE - 1 });
    expect(buildPageRange(3)).toEqual({ from: 2 * PAGE_SIZE, to: 3 * PAGE_SIZE - 1 });
  });
});
