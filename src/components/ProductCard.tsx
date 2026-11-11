import { formatPrice } from "@/lib/price";
import type { Product } from "@/content/products";

/**
 * Quoi : image d'un produit, ou cadre « Photo à venir » si aucune photo n'est autorisée.
 * Input : product — le produit à illustrer.
 * Output : le bloc image.
 * Effets de bord : aucun (composant pur).
 */
function ProductPicture({ product }: { product: Product }) {
  if (!product.photo) {
    return (
      <div className="b-card__pic b-card__pic--empty"><span>Photo à venir</span></div>
    );
  }
  return (
    <div className="b-card__pic">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={product.photo} alt={product.title} loading="lazy" />
    </div>
  );
}

/**
 * Quoi : fiche produit (photo ou « Photo à venir », titre, description facultative, prix ou « Prix à confirmer »).
 * Input : product — le produit à afficher.
 * Output : la carte du produit.
 * Effets de bord : aucun (composant pur). Lève une Error si le prix du produit est invalide (négatif ou non entier).
 */
export function ProductCard({ product }: { product: Product }) {
  const hasPrice = product.priceInCents !== null;
  return (
    <article className="b-card">
      <ProductPicture product={product} />
      <div className="b-card__body">
        <h3 className="b-card__title">{product.title}</h3>
        {product.description ? <p className="b-card__desc">{product.description}</p> : null}
        <p className={`b-price ${hasPrice ? "b-price--known" : "b-price--tbd"}`}>
          <span className="b-price__tag">{formatPrice(product.priceInCents)}</span>
        </p>
      </div>
    </article>
  );
}
