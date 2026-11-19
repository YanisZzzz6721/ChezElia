import type { DayHours } from "@/content/hours";

/** Titre de l'accueil validé par le propriétaire (balise title, og:title, twitter:title). Le H1 de la page est distinct. */
export const HOME_TITLE = "Épicerie de nuit à Strasbourg, rue Sédillot | Chez Elia";

const HOME_DESCRIPTION_BASE = "Chez Elia, épicerie de nuit au 4 rue Sédillot à Strasbourg : boissons, snacks, confiseries et produits américains.";
const FRENCH_TIME_PATTERN = /^(\d{2})h(\d{2})$/;
const MINUTES_PER_DAY = 24 * 60;

/**
 * Quoi : convertit une heure « 15h30 » en minutes depuis minuit.
 * Input : frenchTime — heure « HHhMM » ; day — nom du jour (pour le message d'erreur).
 * Output : le nombre de minutes (0 à 1439).
 * Effets de bord : aucun (fonction pure). Lève une Error si le format ou les bornes sont invalides.
 */
function parseMinutesSinceMidnight(frenchTime: string, day: string): number {
  const match = FRENCH_TIME_PATTERN.exec(frenchTime);
  const hours = match ? Number(match[1]) : Number.NaN;
  const minutes = match ? Number(match[2]) : Number.NaN;
  if (!(hours <= 23 && minutes <= 59)) {
    throw new Error(`Heure invalide pour ${day} : « ${frenchTime} » (format attendu « 15h30 », heures 00-23, minutes 00-59).`);
  }
  return hours * 60 + minutes;
}

/**
 * Quoi : trouve la fermeture la plus tardive de la semaine, en comptant une fermeture après minuit comme plus tardive qu'une fermeture avant minuit.
 * Input : hours — les horaires de la semaine (les jours fermés sont ignorés).
 * Output : la fermeture en minutes depuis minuit du jour d'ouverture (valeur > 1440 si elle tombe le lendemain), ou null si aucun jour n'est ouvert.
 * Effets de bord : aucun (fonction pure). Lève une Error si une heure d'un jour ouvert est invalide.
 */
export function findLatestClosing(hours: readonly DayHours[]): number | null {
  let latestClosing: number | null = null;
  for (const dayHours of hours) {
    if (dayHours.isClosed) continue;
    const opensAt = parseMinutesSinceMidnight(dayHours.opensAt, dayHours.day);
    const closesAt = parseMinutesSinceMidnight(dayHours.closesAt, dayHours.day);
    const closing = closesAt <= opensAt ? closesAt + MINUTES_PER_DAY : closesAt;
    if (latestClosing === null || closing > latestClosing) latestClosing = closing;
  }
  return latestClosing;
}

/**
 * Quoi : met une heure de fermeture en français courant (« 1h30 », « 23h », « minuit »).
 * Input : minutes — minutes depuis minuit, entier ≥ 0 (un dépassement de 24 h compte pour le lendemain).
 * Output : « minuit » pour 0 h 00, sinon « Hh » (heure pleine) ou « HhMM ».
 * Effets de bord : aucun (fonction pure). Lève une Error si la valeur n'est pas un entier positif ou nul.
 */
export function formatClosingTime(minutes: number): string {
  if (!Number.isInteger(minutes) || minutes < 0) throw new Error(`Durée invalide : ${minutes} (entier ≥ 0 attendu).`);
  const minutesInDay = minutes % MINUTES_PER_DAY;
  if (minutesInDay === 0) return "minuit";
  const hours = Math.floor(minutesInDay / 60);
  const remainingMinutes = minutesInDay % 60;
  return remainingMinutes === 0 ? `${hours}h` : `${hours}h${String(remainingMinutes).padStart(2, "0")}`;
}

/**
 * Quoi : construit la description de l'accueil (meta description, og, twitter, JSON-LD), sous 155 caractères.
 * Input : hours — les horaires de la semaine, lus en base.
 * Output : la description ; « Ouvert jusqu'à … » (fermeture la plus tardive) n'est ajouté que si au moins un jour est ouvert.
 * Effets de bord : aucun (fonction pure). Lève une Error si une heure d'un jour ouvert est invalide.
 */
export function buildHomeDescription(hours: readonly DayHours[]): string {
  const latestClosing = findLatestClosing(hours);
  if (latestClosing === null) return HOME_DESCRIPTION_BASE;
  return `${HOME_DESCRIPTION_BASE} Ouvert jusqu'à ${formatClosingTime(latestClosing)}.`;
}
