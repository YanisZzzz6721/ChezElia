import { describe, expect, it } from "vitest";
import { OPENING_HOURS } from "@/content/hours";
import { formatDayHours } from "./hours";

describe("formatDayHours", () => {
  it("affiche l'ouverture et la fermeture d'un jour ouvert", () => {
    expect(formatDayHours({ day: "Lundi", isClosed: false, opensAt: "15h30", closesAt: "00h30" })).toBe("15h30 – 00h30");
  });

  it("affiche « Fermé » pour un jour fermé", () => {
    expect(formatDayHours({ day: "Dimanche", isClosed: true })).toBe("Fermé");
  });

  it("rejette un jour ouvert dont une heure est vide", () => {
    expect(() => formatDayHours({ day: "Mardi", isClosed: false, opensAt: "", closesAt: "00h30" })).toThrow(/Mardi/);
  });
});

describe("OPENING_HOURS", () => {
  it("couvre les 7 jours dans l'ordre, une seule fois chacun", () => {
    expect(OPENING_HOURS.map((hours) => hours.day)).toEqual([
      "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche",
    ]);
  });

  it("se met en forme sans erreur pour chaque jour", () => {
    for (const hours of OPENING_HOURS) expect(() => formatDayHours(hours)).not.toThrow();
  });
});
