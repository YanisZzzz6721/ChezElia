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

/** Nombre de fiches affichées au départ, puis ajoutées à chaque clic sur « Voir plus ». */
export const INITIAL_VISIBLE_COUNT = 24;
export const LOAD_MORE_STEP = 24;

/**
 * Quoi : met un texte sous une forme comparable pour la recherche (minuscules, sans accents ni ponctuation).
 * Input : text — titre ou saisie de l'utilisateur.
 * Output : le texte normalisé, mots séparés par un espace (vide si aucune lettre ni chiffre).
 * Effets de bord : aucun (fonction pure).
 */
export function normalizeForSearch(text: string): string {
  return text
    .replace(/œ/gi, "oe")
    .replace(/æ/gi, "ae")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Quoi : garde les produits dont le titre (ou la description) contient tous les mots recherchés.
 * Input : products — les produits à parcourir ; query — la saisie de l'utilisateur.
 * Output : les produits correspondants, dans l'ordre d'origine ; tous si la recherche est vide.
 * Effets de bord : aucun (fonction pure).
 */
export function searchProducts(products: readonly Product[], query: string): readonly Product[] {
  const words = normalizeForSearch(query).split(" ").filter((word) => word !== "");
  if (words.length === 0) return products;
  return products.filter((product) => {
    const haystack = normalizeForSearch(`${product.title} ${product.description ?? ""}`);
    return words.every((word) => haystack.includes(word));
  });
}

/**
 * Quoi : limite une liste à ses n premiers éléments (affichage progressif).
 * Input : items — la liste ; count — nombre d'éléments à garder (entier >= 0).
 * Output : les count premiers éléments.
 * Effets de bord : aucun (fonction pure). Lève une Error si la limite est négative ou non entière.
 */
export function limitVisible<Item>(items: readonly Item[], count: number): readonly Item[] {
  if (!Number.isInteger(count) || count < 0) throw new Error(`Limite invalide : un entier >= 0 est attendu (reçu ${count}).`);
  return items.slice(0, count);
}

/** Mention de santé qui doit accompagner la présentation de boissons alcoolisées (France). */
export const ALCOHOL_NOTICE =
  "L’abus d’alcool est dangereux pour la santé. À consommer avec modération. La vente d’alcool est interdite aux mineurs.";

/**
 * Quoi : indique si le nom d'une catégorie désigne de l'alcool (« Alcools », « Boissons alcoolisées »…).
 * Input : label — le nom de la catégorie.
 * Output : vrai si le nom contient « alcool » (sans tenir compte de la casse ni des accents).
 * Effets de bord : aucun (fonction pure).
 */
export function isAlcoholCategoryLabel(label: string): boolean {
  return normalizeForSearch(label).includes("alcool");
}

/**
 * Quoi : indique si au moins un produit affichable appartient à une catégorie d'alcool.
 * Input : categories — toutes les catégories ; products — les produits visibles.
 * Output : vrai si la mention de santé doit être affichée dans le catalogue.
 * Effets de bord : aucun (fonction pure).
 */
export function hasAlcoholProducts(categories: readonly Category[], products: readonly Product[]): boolean {
  const alcoholCategoryIds = new Set(categories.filter((category) => isAlcoholCategoryLabel(category.label)).map((category) => category.id));
  return products.some((product) => product.categoryId !== null && alcoholCategoryIds.has(product.categoryId));
}
