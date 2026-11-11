import { describe, expect, it } from "vitest";
import { centsToPriceInput, parsePriceInput } from "./priceInput";

describe("parsePriceInput", () => {
  it("renvoie null (« Prix à confirmer ») pour un champ vide ou d'espaces", () => {
    expect(parsePriceInput("")).toBeNull();
    expect(parsePriceInput("   ")).toBeNull();
  });

  it("distingue le vrai zéro du prix absent", () => {
    expect(parsePriceInput("0")).toBe(0);
    expect(parsePriceInput("0,00")).toBe(0);
  });

  it("accepte virgule ou point, avec ou sans symbole €", () => {
    expect(parsePriceInput("2,50")).toBe(250);
    expect(parsePriceInput("2.5")).toBe(250);
    expect(parsePriceInput("2,5 €")).toBe(250);
    expect(parsePriceInput("12")).toBe(1200);
    expect(parsePriceInput("0,05")).toBe(5);
  });

  it("n'a pas d'erreur d'arrondi flottant (19,99 → 1999 centimes)", () => {
    expect(parsePriceInput("19,99")).toBe(1999);
    expect(parsePriceInput("0,29")).toBe(29);
    expect(parsePriceInput("1,15")).toBe(115);
  });

  it.each(["-1", "-0,50", "abc", "2,505", "1,2,3", "€", "1e3", "2 5"])("rejette %j avec une erreur explicite", (value) => {
    expect(() => parsePriceInput(value)).toThrow(/Prix invalide/);
  });

  it("rejette un montant démesuré", () => {
    expect(() => parsePriceInput("1000000")).toThrow(/Prix invalide/);
  });
});

describe("centsToPriceInput", () => {
  it("renvoie un champ vide pour un prix absent", () => {
    expect(centsToPriceInput(null)).toBe("");
  });

  it("formate les centimes avec virgule, et garde « 0,00 » pour un vrai zéro", () => {
    expect(centsToPriceInput(250)).toBe("2,50");
    expect(centsToPriceInput(0)).toBe("0,00");
    expect(centsToPriceInput(5)).toBe("0,05");
    expect(centsToPriceInput(1999)).toBe("19,99");
  });

  it("fait l'aller-retour avec parsePriceInput", () => {
    for (const cents of [0, 5, 99, 100, 250, 1999, 99999]) {
      expect(parsePriceInput(centsToPriceInput(cents))).toBe(cents);
    }
  });
});
