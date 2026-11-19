import { describe, expect, it } from "vitest";
import type { DayHours } from "@/content/hours";
import { SITE } from "@/content/site";
import { buildStoreJsonLd, buildWebSiteJsonLd, serializeJsonLd, toSchemaTime } from "./structuredData";
import { SAMPLE_HOURS } from "./testFixtures";

describe("toSchemaTime", () => {
  it("convertit « 15h30 » en « 15:30 » et gère l'après-minuit", () => {
    expect(toSchemaTime("15h30")).toBe("15:30");
    expect(toSchemaTime("00h30")).toBe("00:30");
    expect(toSchemaTime("01h30")).toBe("01:30");
  });

  it.each(["", "25h00", "10h60", "1530", "15h3", "ab"])("rejette l'heure invalide %j", (value) => {
    expect(() => toSchemaTime(value)).toThrow(/Heure invalide/);
  });
});

describe("buildStoreJsonLd", () => {
  const jsonLd = buildStoreJsonLd(SAMPLE_HOURS);

  it("décrit un commerce de proximité avec l'adresse exacte du site", () => {
    expect(jsonLd["@type"]).toBe("ConvenienceStore");
    expect(jsonLd.name).toBe("Chez Elia");
    expect(jsonLd.address.streetAddress).toBe("4 rue Sédillot");
    expect(jsonLd.address.postalCode).toBe("67000");
  });

  it("n'invente ni téléphone, ni image, ni coordonnées", () => {
    expect(jsonLd).not.toHaveProperty("telephone");
    expect(jsonLd).not.toHaveProperty("image");
    expect(jsonLd).not.toHaveProperty("geo");
  });

  it("ajoute le téléphone au format international quand il est fourni", () => {
    expect(buildStoreJsonLd(SAMPLE_HOURS, "03 88 12 34 56")).toMatchObject({ telephone: "+33388123456" });
  });

  it("ajoute l'adresse du site et l'image quand elles sont connues, et seulement alors", () => {
    expect(buildStoreJsonLd(SAMPLE_HOURS)).not.toHaveProperty("url");
    expect(buildStoreJsonLd(SAMPLE_HOURS)).not.toHaveProperty("image");
    expect(buildStoreJsonLd(SAMPLE_HOURS, null, { siteUrl: "https://chez-elia.fr", imageUrl: "https://cdn.test/a.webp" })).toMatchObject({ url: "https://chez-elia.fr", image: "https://cdn.test/a.webp" });
  });

  it("ajoute sameAs avec l'adresse exacte de chaque réseau quand il y en a", () => {
    const socialUrls = ["https://www.instagram.com/compte-test/", "https://www.tiktok.com/@compte-test"];
    expect(buildStoreJsonLd(SAMPLE_HOURS, null, { socialUrls })).toMatchObject({ sameAs: socialUrls });
  });

  it("omet sameAs sans réseau (propriété absente, pas un tableau vide)", () => {
    expect(buildStoreJsonLd(SAMPLE_HOURS)).not.toHaveProperty("sameAs");
    expect(buildStoreJsonLd(SAMPLE_HOURS, null, { socialUrls: [] })).not.toHaveProperty("sameAs");
  });

  it("omet le jour fermé et garde 6 jours d'ouverture", () => {
    const days = jsonLd.openingHoursSpecification.map((spec) => spec.dayOfWeek);
    expect(days).toEqual(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]);
  });

  it("garde l'heure de fermeture après minuit telle quelle", () => {
    const friday = jsonLd.openingHoursSpecification.find((spec) => spec.dayOfWeek === "Friday");
    expect(friday).toMatchObject({ opens: "15:30", closes: "01:30" });
  });

  it("rejette un nom de jour inconnu", () => {
    const unknownDay: DayHours[] = [{ day: "Lundy", isClosed: false, opensAt: "10h00", closesAt: "12h00" }];
    expect(() => buildStoreJsonLd(unknownDay)).toThrow(/Lundy/);
  });

  it("accepte une liste vide (aucun jour d'ouverture)", () => {
    expect(buildStoreJsonLd([]).openingHoursSpecification).toEqual([]);
  });
});

describe("buildStoreJsonLd : identité, description, carte et zone desservie", () => {
  const siteUrl = "https://chez-elia.fr";

  it("ajoute @id seulement quand l'adresse du site est connue", () => {
    expect(buildStoreJsonLd(SAMPLE_HOURS, null, { siteUrl })).toMatchObject({ "@id": "https://chez-elia.fr/#commerce" });
    expect(buildStoreJsonLd(SAMPLE_HOURS)).not.toHaveProperty("@id");
    expect(buildStoreJsonLd(SAMPLE_HOURS, null, { siteUrl: null })).not.toHaveProperty("@id");
  });

  it("ajoute la description fournie, et seulement elle", () => {
    expect(buildStoreJsonLd(SAMPLE_HOURS, null, { description: "Une description." })).toMatchObject({ description: "Une description." });
    expect(buildStoreJsonLd(SAMPLE_HOURS)).not.toHaveProperty("description");
    expect(buildStoreJsonLd(SAMPLE_HOURS, null, { description: "" })).not.toHaveProperty("description");
  });

  it("pointe hasMap vers l'itinéraire Google Maps du site, sans coordonnées inventées", () => {
    const jsonLd = buildStoreJsonLd(SAMPLE_HOURS);
    expect(jsonLd.hasMap).toBe(SITE.directionsUrl);
    expect(jsonLd.hasMap).toMatch(/^https:\/\/www\.google\.com\/maps\//);
    expect(jsonLd).not.toHaveProperty("geo");
  });

  it("déclare Strasbourg comme zone desservie", () => {
    expect(buildStoreJsonLd(SAMPLE_HOURS).areaServed).toEqual({ "@type": "City", name: "Strasbourg" });
  });

  it("n'invente ni priceRange ni FAQPage", () => {
    expect(buildStoreJsonLd(SAMPLE_HOURS, null, { siteUrl })).not.toHaveProperty("priceRange");
    expect(JSON.stringify(buildStoreJsonLd(SAMPLE_HOURS, null, { siteUrl }))).not.toContain("FAQPage");
  });
});

describe("buildWebSiteJsonLd", () => {
  it("décrit le site et renvoie au commerce comme éditeur quand l'adresse est connue", () => {
    expect(buildWebSiteJsonLd("https://chez-elia.fr")).toEqual({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://chez-elia.fr/#site",
      url: "https://chez-elia.fr",
      name: "Chez Elia",
      inLanguage: "fr-FR",
      publisher: { "@id": "https://chez-elia.fr/#commerce" },
    });
  });

  it("renvoie null sans adresse du site (rien n'est inventé)", () => {
    expect(buildWebSiteJsonLd(null)).toBeNull();
    expect(buildWebSiteJsonLd("")).toBeNull();
  });
});

describe("serializeJsonLd", () => {
  it("échappe « < » pour qu'aucune balise ne puisse fermer le script", () => {
    const serialized = serializeJsonLd({ name: "</script><b>" });
    expect(serialized).not.toContain("<");
    expect(JSON.parse(serialized)).toEqual({ name: "</script><b>" });
  });
});
