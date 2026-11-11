import Link from "next/link";

const MOON_PATH = "M46 6C28 8 16 22 16 38c0 12 10 20 22 20 8 0 16-4 20-10-16 2-28-8-28-20 0-8 6-16 16-22z";

interface LogoProps {
  /** « nav » : petit autocollant du menu ; « footer » : grand autocollant avec l'étiquette « Épicerie de nuit ». */
  size: "nav" | "footer";
  /** Destination du lien (ancre du haut de page ou accueil). */
  href: string;
}

/**
 * Quoi : logo « autocollant » (plaque jaune cerclée de blanc, lettres au feutre, lune violette).
 * Input : size — variante petite (menu) ou grande (pied de page) ; href — destination du lien.
 * Output : le logo cliquable, avec un nom accessible.
 * Effets de bord : aucun (composant d'affichage).
 */
export function Logo({ size, href }: LogoProps) {
  const isFooter = size === "footer";
  return (
    <Link className="lg-link" href={href} aria-label="Chez Elia, épicerie de nuit — accueil">
      <span className={`lg-sticker ${isFooter ? "" : "lg-sticker--s"}`} aria-hidden="true">
        <svg className="lg-sticker__moon" viewBox="0 0 64 64" focusable="false">
          <path d={MOON_PATH} fill="#5b21d6" stroke="#fff" strokeWidth="5" strokeLinejoin="round" />
        </svg>
        <span className="lg-sticker__name">Chez Elia</span>
        {isFooter ? <span className="lg-sticker__tape">Épicerie de nuit</span> : null}
      </span>
    </Link>
  );
}
