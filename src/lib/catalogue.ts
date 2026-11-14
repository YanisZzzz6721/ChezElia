import type { Category, Product } from "@/content/products";

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

/**
 * Quoi : liste les catégories à proposer en onglets : seulement celles qui ont au moins un produit affichable
 *   (un onglet vide donnerait l'impression d'un site inachevé).
 * Input : categories — toutes les catégories, dans l'ordre d'affichage ; products — les produits visibles.
 * Output : les catégories non vides, dans l'ordre d'origine.
 * Effets de bord : aucun (fonction pure).
 */
export function listCategoriesWithProducts(categories: readonly Category[], products: readonly Product[]): Category[] {
  const usedCategoryIds = new Set(products.map((product) => product.categoryId));
  return categories.filter((category) => usedCategoryIds.has(category.id));
}
