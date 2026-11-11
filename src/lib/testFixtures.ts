import type { DayHours } from "@/content/hours";

/** Horaires de test (mêmes valeurs que les horaires par défaut de la migration). */
export const SAMPLE_HOURS: readonly DayHours[] = [
  { day: "Lundi", isClosed: false, opensAt: "15h30", closesAt: "00h30" },
  { day: "Mardi", isClosed: false, opensAt: "16h00", closesAt: "00h30" },
  { day: "Mercredi", isClosed: false, opensAt: "16h00", closesAt: "00h30" },
  { day: "Jeudi", isClosed: false, opensAt: "15h30", closesAt: "01h00" },
  { day: "Vendredi", isClosed: false, opensAt: "15h30", closesAt: "01h30" },
  { day: "Samedi", isClosed: false, opensAt: "15h30", closesAt: "01h30" },
  { day: "Dimanche", isClosed: true },
];
