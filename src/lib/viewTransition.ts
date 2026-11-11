import { flushSync } from "react-dom";

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => unknown;
};

/**
 * Quoi : exécute une mise à jour d'état React avec une transition de vue (les éléments nommés se
 * déplacent en douceur vers leur nouvelle place), ou directement si le navigateur ne la gère pas
 * ou si le visiteur demande moins d'animations.
 * Input : update — la mise à jour d'état à appliquer (synchrone).
 * Output : aucun.
 * Effets de bord : peut démarrer une View Transition ; force le rendu synchrone de React pendant celle-ci.
 */
export function runWithViewTransition(update: () => void): void {
  const doc = document as ViewTransitionDocument;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion || typeof doc.startViewTransition !== "function") {
    update();
    return;
  }
  doc.startViewTransition(() => flushSync(update));
}
