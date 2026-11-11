import type { DayHours } from "@/content/hours";

/**
 * Quoi : met en forme la ligne d'horaires d'un jour pour l'affichage.
 * Input : hours — un jour ouvert (heures d'ouverture et de fermeture) ou fermé.
 * Output : « 15h30 – 00h30 » pour un jour ouvert, « Fermé » pour un jour fermé.
 * Effets de bord : aucun (fonction pure). Lève une Error si un jour ouvert a une heure vide.
 */
export function formatDayHours(hours: DayHours): string {
  if (hours.isClosed) return "Fermé";
  if (hours.opensAt === "" || hours.closesAt === "") {
    throw new Error(`Horaires invalides pour ${hours.day} : heure d'ouverture ou de fermeture vide.`);
  }
  return `${hours.opensAt} – ${hours.closesAt}`;
}
