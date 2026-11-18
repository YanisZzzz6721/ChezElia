import type { SocialLink } from "@/content/social";
import { BrandIcon } from "./BrandIcons";

/**
 * Quoi : rangée d'icônes rondes vers les réseaux sociaux du magasin (discrète, alignée, cible tactile de 44 px).
 * Input : links — réseaux à afficher ; liste vide = rien n'est affiché.
 * Output : la rangée, ou null si aucun lien.
 * Effets de bord : aucun (composant pur). Simples liens sortants : aucun widget ni cookie tiers.
 */
export function SocialIconRow({ links }: { links: readonly SocialLink[] }) {
  if (links.length === 0) return null;
  return (
    <ul className="b-social" aria-label="Nos réseaux sociaux">
      {links.map((link) => (
        <li key={link.url}>
          <a className="b-social__a" href={link.url} target="_blank" rel="noopener noreferrer" aria-label={`${link.label} (nouvel onglet)`}>
            <BrandIcon name={link.network} className="b-social__ic" />
          </a>
        </li>
      ))}
    </ul>
  );
}
