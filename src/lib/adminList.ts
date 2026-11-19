export const PAGE_SIZE = 25;
const MAX_SEARCH_LENGTH = 60;
const MAX_PAGE = 10_000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type StateFilter = "all" | "no-price" | "hidden" | "visible" | "us-import";
export type ListView = "active" | "trash";

export interface ProductListQuery {
  search: string;
  categoryId: string | null;
  state: StateFilter;
  page: number;
  view: ListView;
}

const STATE_BY_PARAM: Record<string, StateFilter> = {
  "sans-prix": "no-price",
  masques: "hidden",
  visibles: "visible",
  "import-usa": "us-import",
};

/**
 * Quoi : nettoie un texte de recherche avant de l'utiliser dans un filtre de base de données.
 * Input : text — ce que l'administrateur a tapé.
 * Output : le texte sans caractères spéciaux (% _ * , ( ) \), espaces normalisés, 60 caractères maximum.
 * Effets de bord : aucun (fonction pure).
 */
export function sanitizeSearch(text: string): string {
  return text
    .replace(/[%_*,()\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SEARCH_LENGTH)
    .trim();
}

/**
 * Quoi : lit et valide les paramètres d'adresse de la liste des produits.
 * Input : params — q, cat, etat, page, vue (valeurs brutes de l'URL, éventuellement absentes).
 * Output : une requête valide ; toute valeur invalide est remplacée par la valeur par défaut.
 * Effets de bord : aucun (fonction pure).
 */
export function parseListQuery(params: Record<string, string | undefined>): ProductListQuery {
  const rawPage = params.page ?? "";
  const page = /^\d+$/.test(rawPage) ? Math.min(Math.max(Number(rawPage), 1), MAX_PAGE) : 1;
  const categoryId = params.cat && UUID_PATTERN.test(params.cat) ? params.cat : null;
  return {
    search: sanitizeSearch(params.q ?? ""),
    categoryId,
    state: STATE_BY_PARAM[params.etat ?? ""] ?? "all",
    page,
    view: params.vue === "corbeille" ? "trash" : "active",
  };
}

/**
 * Quoi : calcule les bornes (inclusives) des lignes d'une page.
 * Input : page — numéro de page (>= 1).
 * Output : { from, to } pour une plage de lecture.
 * Effets de bord : aucun (fonction pure).
 */
export function buildPageRange(page: number): { from: number; to: number } {
  const from = (page - 1) * PAGE_SIZE;
  return { from, to: from + PAGE_SIZE - 1 };
}
