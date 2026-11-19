import Link from "next/link";
import type { Category, Product } from "@/content/products";
import { listProductsOfCategory } from "@/lib/shelfPages";

/**
 * Quoi : liste des rayons (liens vers leur page, avec le nombre de produits).
 * Input : rayons — les rayons à lister (déjà filtrés : non vides) ; products — les produits visibles (pour le compte).
 * Output : la liste de liens, ou le message « arrive bientôt » s'il n'y a aucun rayon. Les noms sont échappés par React.
 * Effets de bord : aucun (composant pur).
 */
export function RayonsList({ rayons, products }: { rayons: readonly Category[]; products: readonly Product[] }) {
  if (rayons.length === 0) {
    return <div className="b-empty"><p>Les rayons arrivent bientôt.</p></div>;
  }
  return (
    <ul className="r-rayons">
      {rayons.map((rayon) => {
        const count = listProductsOfCategory(products, rayon.id).length;
        return (
          <li key={rayon.id}>
            <Link className="b-tab r-rayons__link" href={`/rayons/${rayon.slug}`}>
              <span>{rayon.label}</span>
              <small>{count} produit{count > 1 ? "s" : ""}</small>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
