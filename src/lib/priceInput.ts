import type { PriceInCents } from "./price";

/** Plafond de saisie : 9 999,99 € (au-delà, c'est presque sûrement une erreur de frappe). */
const MAX_PRICE_CENTS = 999_999;
const PRICE_PATTERN = /^(\d{1,6})(?:[.,](\d{1,2}))?$/;

/**
 * Quoi : convertit le texte saisi dans l'admin en centimes.
 * Input : text — « 2,50 », « 2.5 », « 2,5 € », « 0 » ou vide.
 * Output : centimes (entier >= 0), ou null si le champ est vide (= « Prix à confirmer »).
 * Effets de bord : aucun (fonction pure). Lève une Error « Prix invalide » si le texte n'est pas un montant
 *   (négatif, lettres, plus de 2 décimales, au-delà de 9 999,99 €). Calcul en entiers : pas d'erreur d'arrondi.
 */
export function parsePriceInput(text: string): PriceInCents {
  const cleaned = text.replace(/€/g, "").trim();
  const isBlank = text.trim() === "";
  if (isBlank) return null;

  const match = PRICE_PATTERN.exec(cleaned);
  if (!match) {
    throw new Error(`Prix invalide : « ${text} ». Saisissez un montant comme 2,50 (laissez vide pour « Prix à confirmer »).`);
  }
  const euros = Number(match[1]);
  const centimes = Number((match[2] ?? "").padEnd(2, "0"));
  const totalCents = euros * 100 + centimes;
  if (totalCents > MAX_PRICE_CENTS) {
    throw new Error(`Prix invalide : « ${text} » dépasse le maximum de 9 999,99 €.`);
  }
  return totalCents;
}

/**
 * Quoi : prépare un prix pour le champ de saisie de l'admin.
 * Input : cents — centimes, ou null si le prix est absent.
 * Output : « 2,50 » (virgule, 2 décimales), ou « » (vide) pour un prix absent.
 * Effets de bord : aucun (fonction pure).
 */
export function centsToPriceInput(cents: PriceInCents): string {
  if (cents === null) return "";
  const euros = Math.floor(cents / 100);
  const centimes = String(cents % 100).padStart(2, "0");
  return `${euros},${centimes}`;
}
