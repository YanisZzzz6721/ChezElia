import Link from "next/link";
import { SITE } from "@/content/site";
import type { SocialLink } from "@/content/social";
import { BrandIcon } from "./BrandIcons";
import { Logo } from "./Logo";

/**
 * Quoi : pied de page : logo, adresse, liens vers les réseaux sociaux (s'il y en a) et liens légaux obligatoires.
 * Input : socialLinks — réseaux à afficher (liste vide = aucune ligne).
 * Output : le pied de page.
 * Effets de bord : aucun. Simples liens sortants : aucun widget ni cookie tiers.
 */
export function SiteFooter({ socialLinks = [] }: { socialLinks?: readonly SocialLink[] }) {
  return (
    <footer className="s-foot" data-reveal>
      <div className="s-foot__logo"><Logo size="footer" href="/" /></div>
      <p>{SITE.name} · {SITE.address}</p>
      {socialLinks.length > 0 ? (
        <ul className="s-foot__social" aria-label="Réseaux sociaux">
          {socialLinks.map((link) => (
            <li key={link.url}>
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                <BrandIcon name={link.network} className="s-foot__ic" />
                <span>{link.label}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="s-foot__legal">
        <span className="s-foot__legal-item">
          <Link href="/mentions-legales">Mentions légales</Link>
          <span className="s-foot__sep" aria-hidden="true">·</span>
        </span>
        {" "}
        <span className="s-foot__legal-item">
          <Link href="/confidentialite">Politique de confidentialité</Link>
        </span>
      </p>
    </footer>
  );
}
