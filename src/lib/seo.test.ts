import { describe, expect, it } from "vitest";
import { buildAbsoluteUrl, isIndexingEnabled, parseSiteUrl } from "./seo";

describe("parseSiteUrl", () => {
  it("renvoie null quand l'adresse n'est pas fournie", () => {
    expect(parseSiteUrl(undefined)).toBeNull();
    expect(parseSiteUrl("")).toBeNull();
    expect(parseSiteUrl("   ")).toBeNull();
  });

  it("normalise une adresse https (sans chemin, sans barre finale)", () => {
    expect(parseSiteUrl("https://chez-elia.fr")).toBe("https://chez-elia.fr");
    expect(parseSiteUrl("https://chez-elia.fr/")).toBe("https://chez-elia.fr");
    expect(parseSiteUrl("https://www.chez-elia.fr/page?x=1#y")).toBe("https://www.chez-elia.fr");
  });

  it("accepte http uniquement pour localhost", () => {
    expect(parseSiteUrl("http://localhost:3000")).toBe("http://localhost:3000");
  });

  it.each(["http://chez-elia.fr", "ftp://chez-elia.fr", "javascript:alert(1)", "chez-elia.fr", "https://", "pas une url"])(
    "rejette %j avec une erreur explicite",
    (value) => {
      expect(() => parseSiteUrl(value)).toThrow(/NEXT_PUBLIC_SITE_URL/);
    },
  );
});

describe("isIndexingEnabled (interrupteur sûr par défaut)", () => {
  const url = "https://chez-elia.fr";

  it("n'autorise l'indexation que si tout est réuni : interrupteur « on », adresse https, mentions légales complètes", () => {
    expect(isIndexingEnabled("on", url, [])).toBe(true);
  });

  it("refuse si l'interrupteur est absent, faux ou différent de « on »", () => {
    for (const flag of [undefined, "", "off", "true", "1", "ON "]) expect(isIndexingEnabled(flag, url, []), String(flag)).toBe(false);
  });

  it("refuse sans adresse de production ou avec une adresse locale", () => {
    expect(isIndexingEnabled("on", null, [])).toBe(false);
    expect(isIndexingEnabled("on", "http://localhost:3000", [])).toBe(false);
  });

  it("refuse tant que des mentions légales manquent", () => {
    expect(isIndexingEnabled("on", url, ["Numéro SIRET"])).toBe(false);
  });
});

describe("buildAbsoluteUrl", () => {
  it("assemble adresse et chemin", () => {
    expect(buildAbsoluteUrl("https://chez-elia.fr", "/mentions-legales")).toBe("https://chez-elia.fr/mentions-legales");
    expect(buildAbsoluteUrl("https://chez-elia.fr", "/")).toBe("https://chez-elia.fr/");
  });

  it("rejette un chemin qui ne commence pas par « / » (pas d'URL externe injectée)", () => {
    expect(() => buildAbsoluteUrl("https://chez-elia.fr", "//evil.example")).toThrow(/chemin/i);
    expect(() => buildAbsoluteUrl("https://chez-elia.fr", "https://evil.example")).toThrow(/chemin/i);
    expect(() => buildAbsoluteUrl("https://chez-elia.fr", "page")).toThrow(/chemin/i);
  });
});
