import type { Category } from "@/content/products";
import type { SocialLink } from "@/content/social";
import { GrainFilter } from "./GrainFilter";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { StoreAccessBlock } from "./StoreAccessBlock";

interface InnerPageShellProps {
  socialLinks: readonly SocialLink[];
  /** Rayons non vides, pour la ligne « Nos rayons » du pied de page. */
  rayons: readonly Category[];
  children: React.ReactNode;
}

/**
 * Quoi : gabarit commun des pages publiques secondaires (rayons, produits américains) : en-tête, contenu, bloc d'accès, pied de page.
 * Input : socialLinks — réseaux du pied de page ; rayons — rayons non vides ; children — le contenu de la page (balise <main>).
 * Output : la page complète, dans l'habillage « Mur néon » de l'accueil.
 * Effets de bord : aucun (composant pur).
 */
export function InnerPageShell({ socialLinks, rayons, children }: InnerPageShellProps) {
  return (
    <div className="b-page">
      <GrainFilter />
      <div className="r-top"><SiteHeader variant="inner" /></div>
      <main className="b-cat r-main">
        <div className="b-wrap">{children}</div>
      </main>
      <StoreAccessBlock />
      <SiteFooter socialLinks={socialLinks} rayons={rayons} />
    </div>
  );
}
