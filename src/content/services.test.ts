import { describe, expect, it } from "vitest";
import { SERVICE_BODY_MAX_LENGTH, SERVICE_HIGHLIGHT_MAX_LENGTH, SERVICE_ICONS, SERVICE_TITLE_MAX_LENGTH, isServiceIconName } from "./services";

describe("services : constantes", () => {
  it("expose les trois icônes avec leur libellé français", () => {
    expect(SERVICE_ICONS).toEqual([
      { name: "sandwich", label: "Sandwich" },
      { name: "parcel", label: "Colis" },
      { name: "vinted", label: "Vinted" },
    ]);
  });

  it("expose les limites alignées sur la base", () => {
    expect([SERVICE_TITLE_MAX_LENGTH, SERVICE_BODY_MAX_LENGTH, SERVICE_HIGHLIGHT_MAX_LENGTH]).toEqual([60, 300, 30]);
  });

  it("reconnaît uniquement les icônes connues", () => {
    expect(isServiceIconName("vinted")).toBe(true);
    expect(isServiceIconName("rocket")).toBe(false);
    expect(isServiceIconName(undefined)).toBe(false);
  });
});
