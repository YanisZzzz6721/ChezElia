import { describe, expect, it } from "vitest";
import { staggerStyle } from "./motion";

describe("staggerStyle", () => {
  it("porte l'index dans la variable CSS --i", () => {
    expect(staggerStyle(3)).toEqual({ "--i": 3 });
    expect(staggerStyle(0)).toEqual({ "--i": 0 });
  });

  it("rejette un index négatif ou non entier", () => {
    expect(() => staggerStyle(-1)).toThrow(/Index de cascade invalide/);
    expect(() => staggerStyle(1.5)).toThrow(/Index de cascade invalide/);
    expect(() => staggerStyle(Number.NaN)).toThrow(/Index de cascade invalide/);
  });
});
