import type { Product } from "@/content/products";

export const ALL_CATEGORIES_ID = "all";

/**
 * Quoi : filtre les produits selon la catégorie choisie.
 * Input : products — tous les produits ; categoryId — identifiant de catégorie, ou « all » pour tous (y compris sans catégorie).
 * Output : les produits à afficher, dans l'ordre d'origine.
 * Effets de bord : aucun (fonction pure).
 */
export function filterProducts(products: readonly Product[], categoryId: string): readonly Product[] {
  if (categoryId === ALL_CATEGORIES_ID) return products;
  return products.filter((product) => product.categoryId === categoryId);
}
