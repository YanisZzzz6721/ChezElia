import Link from "next/link";
import type { Category } from "@/content/products";

interface CatalogueLinksProps {
  /** Rayon sélectionné dans le catalogue, ou null pour « Tout » (aucun lien de rayon). */
  rayon: Pick<Category, "label" | "slug"> | null;
  /** Vrai s'il y a au moins un produit américain visible. */
  showUsImportLink: boolean;
}

/**
 * Quoi : liens discrets sous le catalogue vers la page du rayon sélectionné et vers la page des produits américains (maillage interne).
 * Input : rayon — rayon sélectionné ou null ; showUsImportLink — afficher le lien « Produits américains ».
 * Output : la ligne de liens, ou rien s'il n'y a aucun lien à proposer. Le nom du rayon est échappé par React.
 * Effets de bord : aucun (composant pur).
 */
export function CatalogueLinks({ rayon, showUsImportLink }: CatalogueLinksProps) {
  if (rayon === null && !showUsImportLink) return null;
  return (
    <p className="b-seealso">
      {rayon !== null ? <Link href={`/rayons/${rayon.slug}`}>Voir le rayon {rayon.label}</Link> : null}
      {showUsImportLink ? <Link href="/produits-americains">Produits américains</Link> : null}
    </p>
  );
}
