export const PRICE_TO_CONFIRM_LABEL = "Prix à confirmer";

/** Prix en centimes d'euro. `null` = prix absent (≠ 0, qui est un vrai prix nul). */
export type PriceInCents = number | null;

const NON_BREAKING_SPACE = "\u00a0";

const euroFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

/**
 * Quoi : met en forme le prix d'un produit pour l'affichage public.
 * Input : priceInCents — entier de centimes (>= 0) ou null si le prix est inconnu.
 * Output : « Prix à confirmer » si null, sinon le montant en euros (ex. « 2,50 € », espace insécable).
 * Effets de bord : aucun (fonction pure). Lève une Error si le prix est négatif, non entier ou supérieur à Number.MAX_SAFE_INTEGER.
 */
export function formatPrice(priceInCents: PriceInCents): string {
  if (priceInCents === null) return PRICE_TO_CONFIRM_LABEL;
  if (!Number.isInteger(priceInCents)) {
    throw new Error(`Prix invalide : un nombre entier de centimes est attendu (reçu ${priceInCents}).`);
  }
  if (priceInCents > Number.MAX_SAFE_INTEGER) {
    throw new Error(`Prix invalide : montant trop grand pour être représenté exactement (reçu ${priceInCents}).`);
  }
  if (priceInCents < 0) {
    throw new Error(`Prix invalide : un prix ne peut pas être négatif (reçu ${priceInCents}).`);
  }
  const normalizedCents = priceInCents === 0 ? 0 : priceInCents; // -0 → 0 : jamais « -0,00 € »
  return euroFormatter.format(normalizedCents / 100).replace(/[\u202f\u00a0]/g, NON_BREAKING_SPACE);
}
