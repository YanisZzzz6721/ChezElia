import { describe, expect, it } from "vitest";
import type { LegalInfo } from "@/content/legal";
import { LEGAL } from "@/content/legal";
import { listMissingLegalFields, MISSING_FIELD_TEXT, valueOrPlaceholder } from "./legal";

const complete: LegalInfo = {
  publisherName: "A", legalForm: "B", siret: "C", publicationDirector: "D",
  contactEmail: "e@example.org", hostName: "H", hostAddress: "I",
};

describe("valueOrPlaceholder", () => {
  it("renvoie la valeur quand elle existe", () => {
    expect(valueOrPlaceholder("Chez Elia")).toBe("Chez Elia");
  });

  it("renvoie le texte « à compléter » pour null, vide ou espaces", () => {
    expect(valueOrPlaceholder(null)).toBe(MISSING_FIELD_TEXT);
    expect(valueOrPlaceholder("")).toBe(MISSING_FIELD_TEXT);
    expect(valueOrPlaceholder("   ")).toBe(MISSING_FIELD_TEXT);
  });
});

describe("listMissingLegalFields", () => {
  it("liste tous les champs manquants quand rien n'est fourni", () => {
    const empty: LegalInfo = {
      publisherName: null, legalForm: null, siret: null, publicationDirector: null,
      contactEmail: null, hostName: null, hostAddress: null,
    };
    expect(listMissingLegalFields(empty)).toHaveLength(7);
  });

  it("les mentions légales réelles du site sont complètes (condition d'ouverture à Google)", () => {
    expect(listMissingLegalFields(LEGAL)).toEqual([]);
  });

  it("renvoie une liste vide quand tout est fourni", () => {
    expect(listMissingLegalFields(complete)).toEqual([]);
  });

  it("ne signale que le champ manquant ou vide", () => {
    expect(listMissingLegalFields({ ...complete, siret: null })).toEqual(["Numéro SIRET"]);
    expect(listMissingLegalFields({ ...complete, siret: "  " })).toEqual(["Numéro SIRET"]);
  });
});
