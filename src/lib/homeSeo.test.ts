import { describe, expect, it } from "vitest";
import type { DayHours } from "@/content/hours";
import { buildHomeDescription, findLatestClosing, formatClosingTime, HOME_TITLE } from "./homeSeo";
import { SAMPLE_HOURS } from "./testFixtures";

const open = (day: string, opensAt: string, closesAt: string): DayHours => ({ day, isClosed: false, opensAt, closesAt });
const closed = (day: string): DayHours => ({ day, isClosed: true });

describe("HOME_TITLE", () => {
  it("est le titre validé par le propriétaire", () => {
    expect(HOME_TITLE).toBe("Épicerie de nuit à Strasbourg, rue Sédillot | Chez Elia");
  });
});

describe("formatClosingTime", () => {
  it.each([
    [0, "minuit"],
    [30, "0h30"],
    [90, "1h30"],
    [23 * 60, "23h"],
    [23 * 60 + 15, "23h15"],
    [24 * 60, "minuit"],
    [24 * 60 + 90, "1h30"],
  ])("formate %i minutes en %j", (minutes, expected) => {
    expect(formatClosingTime(minutes)).toBe(expected);
  });

  it.each([-1, 1.5, Number.NaN])("rejette %s", (minutes) => {
    expect(() => formatClosingTime(minutes)).toThrow(/invalide/);
  });
});

describe("findLatestClosing", () => {
  it("compte une fermeture après minuit comme plus tardive qu'une fermeture avant minuit", () => {
    const hours = [open("Lundi", "15h30", "23h00"), open("Mardi", "15h30", "01h30")];
    expect(findLatestClosing(hours)).toBe(24 * 60 + 90);
  });

  it("prend la plus tardive de la semaine (01h30 plutôt que 00h30)", () => {
    expect(findLatestClosing(SAMPLE_HOURS)).toBe(24 * 60 + 90);
  });

  it("gère minuit pile", () => {
    expect(findLatestClosing([open("Lundi", "16h00", "00h00")])).toBe(24 * 60);
  });

  it("gère une fermeture avant minuit", () => {
    expect(findLatestClosing([open("Lundi", "10h00", "22h00")])).toBe(22 * 60);
  });

  it("renvoie null si tout est fermé ou si la liste est vide", () => {
    expect(findLatestClosing([closed("Lundi"), closed("Mardi")])).toBeNull();
    expect(findLatestClosing([])).toBeNull();
  });

  it("rejette une heure invalide au lieu de l'ignorer", () => {
    expect(() => findLatestClosing([open("Lundi", "15h30", "25h00")])).toThrow(/Lundi/);
    expect(() => findLatestClosing([open("Lundi", "", "01h00")])).toThrow(/Lundi/);
  });
});

describe("buildHomeDescription", () => {
  it("cite la fermeture la plus tardive après minuit", () => {
    const description = buildHomeDescription(SAMPLE_HOURS);
    expect(description).toBe("Chez Elia, épicerie de nuit au 4 rue Sédillot à Strasbourg : boissons, snacks, confiseries et produits américains. Ouvert jusqu'à 1h30.");
  });

  it("écrit « minuit » pour 00h00", () => {
    expect(buildHomeDescription([open("Lundi", "16h00", "00h00")])).toMatch(/Ouvert jusqu'à minuit\.$/);
  });

  it("écrit « 0h30 » pour 00h30", () => {
    expect(buildHomeDescription([open("Lundi", "16h00", "00h30")])).toMatch(/Ouvert jusqu'à 0h30\.$/);
  });

  it("fonctionne avec un seul jour ouvert", () => {
    const hours = [closed("Lundi"), open("Mardi", "18h00", "23h15"), closed("Mercredi")];
    expect(buildHomeDescription(hours)).toMatch(/Ouvert jusqu'à 23h15\.$/);
  });

  it("n'invente aucune heure quand tous les jours sont fermés ou sans données", () => {
    for (const hours of [[closed("Lundi")], []]) {
      const description = buildHomeDescription(hours);
      expect(description).not.toMatch(/Ouvert jusqu'à/);
      expect(description).toBe("Chez Elia, épicerie de nuit au 4 rue Sédillot à Strasbourg : boissons, snacks, confiseries et produits américains.");
    }
  });

  it("reste sous 155 caractères, avec ou sans heure", () => {
    expect(buildHomeDescription(SAMPLE_HOURS).length).toBeLessThanOrEqual(155);
    expect(buildHomeDescription([open("Lundi", "10h00", "23h59")]).length).toBeLessThanOrEqual(155);
    expect(buildHomeDescription([]).length).toBeLessThanOrEqual(155);
  });
});
