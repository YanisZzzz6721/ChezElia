import { describe, expect, it } from "vitest";
import { normalizePhoneInput, toTelHref } from "./phone";

describe("normalizePhoneInput", () => {
  it("renvoie null pour un champ vide (le bouton Appeler reste désactivé)", () => {
    expect(normalizePhoneInput("")).toBeNull();
    expect(normalizePhoneInput("   ")).toBeNull();
  });

  it("garde un numéro français lisible, espaces normalisés", () => {
    expect(normalizePhoneInput("03 88 12 34 56")).toBe("03 88 12 34 56");
    expect(normalizePhoneInput("0388123456")).toBe("03 88 12 34 56");
    expect(normalizePhoneInput("06.12.34.56.78")).toBe("06 12 34 56 78");
  });

  it("accepte le format international +33", () => {
    expect(normalizePhoneInput("+33 3 88 12 34 56")).toBe("+33 3 88 12 34 56");
    expect(normalizePhoneInput("+33388123456")).toBe("+33 3 88 12 34 56");
  });

  it.each(["abc", "123", "03 88 12 34", "03 88 12 34 56 78", "+1 202 555 0100", "javascript:alert(1)", "03<script>"])(
    "rejette %j",
    (value) => {
      expect(() => normalizePhoneInput(value)).toThrow(/Numéro invalide/);
    },
  );
});

describe("toTelHref", () => {
  it("construit un lien tel: en format international sans espaces", () => {
    expect(toTelHref("03 88 12 34 56")).toBe("tel:+33388123456");
    expect(toTelHref("+33 3 88 12 34 56")).toBe("tel:+33388123456");
    expect(toTelHref("06 12 34 56 78")).toBe("tel:+33612345678");
  });
});
