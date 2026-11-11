import { LEGAL_FIELD_LABELS, type LegalInfo } from "@/content/legal";

export const MISSING_FIELD_TEXT = "[à compléter avant la mise en ligne]";

/**
 * Quoi : prépare une information légale pour l'affichage.
 * Input : value — la valeur fournie, ou null si inconnue.
 * Output : la valeur, ou « [à compléter avant la mise en ligne] » si elle est absente ou vide.
 * Effets de bord : aucun (fonction pure).
 */
export function valueOrPlaceholder(value: string | null): string {
  if (value === null || value.trim() === "") return MISSING_FIELD_TEXT;
  return value;
}

/**
 * Quoi : liste les informations légales encore manquantes (verrou avant mise en ligne publique).
 * Input : legal — les informations légales.
 * Output : les libellés des champs absents ou vides (liste vide = complet).
 * Effets de bord : aucun (fonction pure).
 */
export function listMissingLegalFields(legal: LegalInfo): string[] {
  const keys = Object.keys(LEGAL_FIELD_LABELS) as (keyof LegalInfo)[];
  return keys
    .filter((key) => valueOrPlaceholder(legal[key]) === MISSING_FIELD_TEXT)
    .map((key) => LEGAL_FIELD_LABELS[key]);
}
