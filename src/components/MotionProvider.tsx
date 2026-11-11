"use client";

import Lenis from "lenis";
import { useEffect } from "react";

const REVEAL_SELECTOR = "[data-reveal]";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Quoi : observe les éléments [data-reveal] (présents et futurs) et leur ajoute la classe « is-in »
 * quand ils entrent à l'écran, ce qui déclenche leur animation d'apparition (une seule fois).
 * Input : aucun.
 * Output : une fonction de nettoyage qui arrête les observateurs.
 * Effets de bord : lit le DOM, ajoute des classes, installe un IntersectionObserver et un MutationObserver.
 */
function startRevealObserver(): () => void {
  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        intersectionObserver.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
  );

  const observeIfNew = (element: Element) => {
    if (!element.classList.contains("is-in")) intersectionObserver.observe(element);
  };
  const observeAllIn = (root: ParentNode) => root.querySelectorAll(REVEAL_SELECTOR).forEach(observeIfNew);

  observeAllIn(document);
  const mutationObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (node.matches(REVEAL_SELECTOR)) observeIfNew(node);
        observeAllIn(node);
      });
    }
  });
  mutationObserver.observe(document.body, { childList: true, subtree: true });

  return () => {
    intersectionObserver.disconnect();
    mutationObserver.disconnect();
  };
}

/**
 * Quoi : démarre le défilement lissé (Lenis), avec ancres douces, sur la souris/trackpad
 * (le toucher reste natif).
 * Input : aucun.
 * Output : une fonction de nettoyage qui arrête la boucle et détruit l'instance.
 * Effets de bord : boucle requestAnimationFrame, classes sur <html>, écoute du scroll.
 */
function startSmoothScroll(): () => void {
  const lenis = new Lenis({
    duration: 1.15,
    easing: (progress) => Math.min(1, 1.001 - Math.pow(2, -10 * progress)),
    anchors: true,
  });
  let frameId = requestAnimationFrame(function loop(time) {
    lenis.raf(time);
    frameId = requestAnimationFrame(loop);
  });
  return () => {
    cancelAnimationFrame(frameId);
    lenis.destroy();
  };
}

/**
 * Quoi : active les animations de la page (scroll lissé et apparitions au scroll), sauf si le
 * visiteur demande moins d'animations (prefers-reduced-motion) : dans ce cas rien n'est caché ni animé.
 * Input : aucun.
 * Output : aucun rendu (null).
 * Effets de bord : pose data-anim sur <html>, démarre les observateurs et Lenis ; nettoie au démontage.
 */
export function MotionProvider() {
  useEffect(() => {
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return;

    const html = document.documentElement;
    html.dataset.anim = "on";
    const stopReveal = startRevealObserver();
    const stopSmoothScroll = startSmoothScroll();

    return () => {
      stopSmoothScroll();
      stopReveal();
      delete html.dataset.anim;
    };
  }, []);

  return null;
}
