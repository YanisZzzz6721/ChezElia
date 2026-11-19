import type { Category, Product } from "@/content/products";
import { isAlcoholCategoryLabel } from "./catalogue";

/** Seuil anti-contenu mince : en dessous, une page de rayon reste visible des visiteurs mais demande aux moteurs de ne pas l'indexer. */
export const MIN_PRODUCTS_FOR_INDEXING = 6;

/**
 * Quoi : décide si la page d'un rayon peut être indexée par les moteurs (règle anti-contenu mince).
 * Input : category — le rayon (seoIntro = texte rédigé par les propriétaires, ou null) ; products — ses produits visibles.
 * Output : vrai seulement si le texte de présentation contient au moins un caractère visible ET qu'il y a au moins 6 produits visibles.
 * Effets de bord : aucun (fonction pure).
 */
export function isCategoryPageIndexable(category: Category, products: readonly Product[]): boolean {
  const hasIntro = category.seoIntro !== null && category.seoIntro.trim() !== "";
  return hasIntro && products.length >= MIN_PRODUCTS_FOR_INDEXING;
}

/**
 * Quoi : décide si la page « produits américains » peut être indexée.
 * Input : products — les produits affichés sur la page (alcools déjà exclus).
 * Output : vrai si elle contient au moins 6 produits (aucun texte de présentation n'est requis : le texte de la page est fixe).
 * Effets de bord : aucun (fonction pure).
 */
export function isUsImportPageIndexable(products: readonly Product[]): boolean {
  return products.length >= MIN_PRODUCTS_FOR_INDEXING;
}

/**
 * Quoi : isole les produits d'un rayon.
 * Input : products — les produits visibles ; categoryId — identifiant du rayon.
 * Output : les produits de ce rayon, dans l'ordre reçu.
 * Effets de bord : aucun (fonction pure).
 */
export function listProductsOfCategory(products: readonly Product[], categoryId: string): Product[] {
  return products.filter((product) => product.categoryId === categoryId);
}

/**
 * Quoi : liste les rayons dont la page est indexable (texte rédigé et au moins 6 produits visibles).
 * Input : categories — tous les rayons ; products — tous les produits visibles.
 * Output : les rayons indexables, dans l'ordre reçu.
 * Effets de bord : aucun (fonction pure).
 */
export function listIndexableCategories(categories: readonly Category[], products: readonly Product[]): Category[] {
  return categories.filter((category) => isCategoryPageIndexable(category, listProductsOfCategory(products, category.id)));
}

/**
 * Quoi : liste les produits de la page « produits américains » : Import USA, sans jamais aucun alcool
 *   (la page ne porte pas la mention de santé et ne doit rien présenter d'alcoolisé).
 * Input : products — les produits visibles ; categories — tous les rayons (pour reconnaître le rayon des alcools).
 * Output : les produits Import USA dont le rayon n'est pas un rayon d'alcool, dans l'ordre reçu.
 * Effets de bord : aucun (fonction pure).
 */
export function listPublicUsImportProducts(products: readonly Product[], categories: readonly Category[]): Product[] {
  const alcoholCategoryIds = new Set(categories.filter((category) => isAlcoholCategoryLabel(category.label)).map((category) => category.id));
  return products.filter((product) => product.isUsImport && !(product.categoryId !== null && alcoholCategoryIds.has(product.categoryId)));
}
