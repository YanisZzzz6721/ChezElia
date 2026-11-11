import type { CSSProperties } from "react";

/**
 * Quoi : fabrique le style qui décale l'animation d'apparition d'un élément (cascade).
 * Input : index — rang de l'élément dans son groupe (entier >= 0).
 * Output : un style React portant la variable CSS --i (le CSS multiplie par 80 ms).
 * Effets de bord : aucun (fonction pure). Lève une Error si l'index est négatif ou non entier.
 */
export function staggerStyle(index: number): CSSProperties {
  if (!Number.isInteger(index) || index < 0) {
    throw new Error(`Index de cascade invalide : un entier >= 0 est attendu (reçu ${index}).`);
  }
  return { "--i": index } as CSSProperties;
}
