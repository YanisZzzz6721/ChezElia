import { describe, expect, it } from "vitest";
import { formatPrice, PRICE_TO_CONFIRM_LABEL } from "./price";

// Le montant utilise des espaces insécables (\u00a0) : le prix ne se coupe jamais en fin de ligne.
describe("formatPrice", () => {
  it("affiche « Prix à confirmer » quand le prix est absent (null)", () => {
    expect(formatPrice(null)).toBe(PRICE_TO_CONFIRM_LABEL);
    expect(formatPrice(null)).toBe("Prix à confirmer");
  });

  it("distingue un prix absent d'un prix véritablement nul", () => {
    expect(formatPrice(0)).toBe("0,00\u00a0€");
    expect(formatPrice(0)).not.toBe(formatPrice(null));
  });

  it("formate des centimes en euros avec virgule", () => {
    expect(formatPrice(250)).toBe("2,50\u00a0€");
    expect(formatPrice(5)).toBe("0,05\u00a0€");
    expect(formatPrice(100)).toBe("1,00\u00a0€");
  });

  it("formate un très grand montant sans perdre de précision", () => {
    expect(formatPrice(123456789)).toMatch(/^1[\s  ]234[\s  ]567,89[\s  ]€$/);
  });

  it("rejette un prix négatif avec une erreur explicite", () => {
    expect(() => formatPrice(-1)).toThrow(/négatif/);
  });

  it("rejette un prix non entier (les prix sont en centimes)", () => {
    expect(() => formatPrice(2.5)).toThrow(/entier/);
    expect(() => formatPrice(Number.NaN)).toThrow(/entier/);
    expect(() => formatPrice(Number.POSITIVE_INFINITY)).toThrow(/entier/);
  });

  it("traite -0 comme un vrai zéro, sans signe moins", () => {
    expect(formatPrice(-0)).toBe("0,00\u00a0€");
  });

  it("rejette un entier trop grand pour être représenté exactement", () => {
    expect(() => formatPrice(Number.MAX_SAFE_INTEGER + 1)).toThrow(/trop grand/);
  });
});
