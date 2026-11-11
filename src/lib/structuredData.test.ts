import { describe, expect, it } from "vitest";
import type { DayHours } from "@/content/hours";
import { OPENING_HOURS } from "@/content/hours";
import { buildStoreJsonLd, serializeJsonLd, toSchemaTime } from "./structuredData";

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
  const jsonLd = buildStoreJsonLd(OPENING_HOURS);

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

describe("serializeJsonLd", () => {
  it("échappe « < » pour qu'aucune balise ne puisse fermer le script", () => {
    const serialized = serializeJsonLd({ name: "</script><b>" });
    expect(serialized).not.toContain("<");
    expect(JSON.parse(serialized)).toEqual({ name: "</script><b>" });
  });
});
