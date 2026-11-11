const FRENCH_NATIONAL_PATTERN = /^0[1-9]\d{8}$/;
const FRENCH_INTERNATIONAL_PATTERN = /^\+33[1-9]\d{8}$/;

/** Retire espaces, points, tirets et parenthèses ; ne touche pas au reste (rejeté ensuite). */
function stripSeparators(input: string): string {
  return input.replace(/[\s.\-()]/g, "");
}

/** « 0388123456 » → « 03 88 12 34 56 ». */
function formatNational(digits: string): string {
  return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

/** « +33388123456 » → « +33 3 88 12 34 56 ». */
function formatInternational(compact: string): string {
  const rest = compact.slice(3);
  return `+33 ${rest.slice(0, 1)} ${rest.slice(1).replace(/(\d{2})(?=\d)/g, "$1 ")}`.trim();
}

/**
 * Quoi : valide et normalise un numéro de téléphone français saisi dans l'admin.
 * Input : input — « 03 88 12 34 56 », « 0388123456 », « +33 3 88 12 34 56 » ou vide.
 * Output : le numéro bien espacé, ou null si le champ est vide (le bouton Appeler reste alors désactivé).
 * Effets de bord : aucun (fonction pure). Lève une Error « Numéro invalide » si ce n'est pas un numéro français.
 */
export function normalizePhoneInput(input: string): string | null {
  const compact = stripSeparators(input.trim());
  if (compact === "") return null;
  if (FRENCH_NATIONAL_PATTERN.test(compact)) return formatNational(compact);
  if (FRENCH_INTERNATIONAL_PATTERN.test(compact)) return formatInternational(compact);
  throw new Error(`Numéro invalide : « ${input} ». Saisissez un numéro français comme 03 88 12 34 56.`);
}

/**
 * Quoi : construit le lien tel: d'un numéro déjà normalisé.
 * Input : phoneNumber — numéro issu de normalizePhoneInput (national ou +33).
 * Output : « tel:+33… » sans espaces.
 * Effets de bord : aucun (fonction pure). Lève une Error « Numéro invalide » si le numéro n'est pas valide.
 */
export function toTelHref(phoneNumber: string): string {
  const compact = stripSeparators(phoneNumber);
  if (FRENCH_NATIONAL_PATTERN.test(compact)) return `tel:+33${compact.slice(1)}`;
  if (FRENCH_INTERNATIONAL_PATTERN.test(compact)) return `tel:${compact}`;
  throw new Error(`Numéro invalide : « ${phoneNumber} ».`);
}
