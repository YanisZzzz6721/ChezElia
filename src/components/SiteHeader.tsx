import { SITE } from "@/content/site";
import { Logo } from "./Logo";

/** Liens du menu : ancres de la page elle-même (accueil) ou de l'accueil depuis une autre page (« /#horaires »). */
const NAV_ANCHORS = [
  { anchor: "#catalogue", label: "Catalogue" },
  { anchor: "#horaires", label: "Horaires" },
] as const;

interface SiteHeaderProps {
  /** « home » : ancres de la page d'accueil ; « inner » : page secondaire, les liens ramènent à l'accueil. */
  variant?: "home" | "inner";
}

/**
 * Quoi : en-tête avec la marque et la navigation principale (même rendu partout, seuls les liens changent selon la page).
 * Input : variant — « home » (par défaut) pour l'accueil, « inner » pour une page secondaire.
 * Output : le bloc d'en-tête (liens + lien « Venir au magasin »).
 * Effets de bord : aucun (composant pur).
 */
export function SiteHeader({ variant = "home" }: SiteHeaderProps) {
  const linkPrefix = variant === "inner" ? "/" : "";
  return (
    <header className="b-nav">
      <Logo size="nav" href={variant === "inner" ? "/" : "#top"} />
      <nav className="b-links" aria-label="Navigation principale">
        {NAV_ANCHORS.map((item) => (
          <a key={item.anchor} href={`${linkPrefix}${item.anchor}`}>{item.label}</a>
        ))}
        <a className="b-links__cta" href={SITE.directionsUrl} target="_blank" rel="noopener noreferrer">
          Venir au magasin
        </a>
      </nav>
    </header>
  );
}
