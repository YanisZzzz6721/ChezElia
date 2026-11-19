/**
 * Adresse publique d'un rayon (« slug » de /rayons/<slug>).
 * Même règle que la migration 20261119000000_seo_rayons.sql : minuscules, sans accents, tout ce qui n'est
 * pas lettre ou chiffre devient un tiret, 60 caractères maximum.
 */

export const CATEGORY_SLUG_MAX_LENGTH = 60;
/** Même motif que la contrainte `categories_slug_format` de la base. */
export const CATEGORY_SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
/** Base utilisée quand un nom ancien (ancienne sauvegarde) ne contient aucune lettre ni chiffre : même repli que la migration. */
export const CATEGORY_SLUG_FALLBACK = "rayon";

/** Lettres que la décomposition Unicode (NFD) ne sépare pas de leur accent : traduites à la main, comme `unaccent` de Postgres. */
const SPECIAL_LETTERS: Record<string, string> = { œ: "oe", æ: "ae", ß: "ss", ø: "o", ł: "l", đ: "d" };
const SPECIAL_LETTERS_PATTERN = /[œæßøłđ]/g;
const COMBINING_MARKS_PATTERN = /\p{M}/gu;
const NOT_ALPHANUMERIC_PATTERN = /[^a-z0-9]+/g;
const EDGE_HYPHENS_PATTERN = /^-+|-+$/g;

/**
 * Quoi : vérifie qu'un texte venu de l'extérieur (URL) a la forme d'une adresse de rayon.
 * Input : candidate — texte à vérifier.
 * Output : vrai si c'est une adresse valide (motif de la base, 1 à 60 caractères).
 * Effets de bord : aucun (fonction pure).
 */
export function isValidCategorySlug(candidate: string): boolean {
  return candidate.length <= CATEGORY_SLUG_MAX_LENGTH && CATEGORY_SLUG_PATTERN.test(candidate);
}

/** Erreur prévue : le nom ne permet pas de fabriquer une adresse (aucune lettre ni chiffre). */
export class CategorySlugError extends Error {
  constructor(categoryName: string) {
    super(`Le nom « ${categoryName} » doit contenir au moins une lettre ou un chiffre pour fabriquer l'adresse de la page du rayon.`);
    this.name = "CategorySlugError";
  }
}

/** Coupe à la longueur maximale sans laisser de tiret au bout. */
function truncateSlug(slug: string, maxLength: number): string {
  return slug.slice(0, maxLength).replace(EDGE_HYPHENS_PATTERN, "");
}

/**
 * Quoi : transforme un nom de rayon en adresse de page (ex. « Épicerie » → « epicerie »).
 * Input : name — le nom saisi (accents, apostrophes, emoji, espaces multiples acceptés).
 * Output : une adresse de 1 à 60 caractères conforme à CATEGORY_SLUG_PATTERN.
 * Effets de bord : aucun (fonction pure). Lève une CategorySlugError si le nom ne contient aucune lettre ni chiffre
 *   (vide, espaces, emoji ou ponctuation seulement).
 */
export function slugifyCategoryName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(SPECIAL_LETTERS_PATTERN, (letter) => SPECIAL_LETTERS[letter] ?? letter)
    .normalize("NFD")
    .replace(COMBINING_MARKS_PATTERN, "")
    .replace(NOT_ALPHANUMERIC_PATTERN, "-")
    .replace(EDGE_HYPHENS_PATTERN, "");
  if (slug === "") throw new CategorySlugError(name);
  return truncateSlug(slug, CATEGORY_SLUG_MAX_LENGTH);
}

/**
 * Quoi : choisit la première adresse libre pour une base : « base », puis « base-2 », « base-3 »…
 * Input : baseSlug — adresse souhaitée (déjà valide) ; takenSlugs — adresses déjà utilisées par d'autres rayons.
 * Output : une adresse absente de takenSlugs, de 60 caractères maximum suffixe compris.
 * Effets de bord : aucun (fonction pure).
 */
export function pickFreeSlug(baseSlug: string, takenSlugs: Iterable<string>): string {
  const taken = new Set(takenSlugs);
  let candidate = baseSlug;
  for (let counter = 2; taken.has(candidate); counter += 1) {
    const suffix = `-${counter}`;
    candidate = `${truncateSlug(baseSlug, CATEGORY_SLUG_MAX_LENGTH - suffix.length)}${suffix}`;
  }
  return candidate;
}

export interface LegacyCategory {
  id: string;
  name: string;
  position: number;
  /** Absent des sauvegardes antérieures aux pages de rayon. */
  slug?: string;
}

/**
 * Quoi : attribue une adresse à chaque catégorie d'une ancienne sauvegarde (même résultat que la migration pour la base).
 * Input : categories — catégories, avec ou sans `slug` ; celles qui en ont un le gardent (et le réservent).
 * Output : une Map identifiant → adresse unique ; pour les autres, adresse calculée depuis le nom (dans l'ordre des positions,
 *   suffixe -2… en cas de collision, « rayon » si le nom n'a ni lettre ni chiffre).
 * Effets de bord : aucun (fonction pure).
 */
export function assignLegacyCategorySlugs(categories: readonly LegacyCategory[]): Map<string, string> {
  const assigned = new Map<string, string>();
  const taken = new Set<string>();
  for (const category of categories) {
    if (category.slug === undefined) continue;
    assigned.set(category.id, category.slug);
    taken.add(category.slug);
  }
  const missingSlug = categories.filter((category) => category.slug === undefined).sort((a, b) => a.position - b.position);
  for (const category of missingSlug) {
    const slug = pickFreeSlug(slugBaseOrFallback(category.name), taken);
    assigned.set(category.id, slug);
    taken.add(slug);
  }
  return assigned;
}

/** Base d'adresse d'un ancien nom : le slug du nom, ou « rayon » si le nom n'a ni lettre ni chiffre (repli documenté, pas une erreur avalée). */
function slugBaseOrFallback(name: string): string {
  try {
    return slugifyCategoryName(name);
  } catch (error) {
    if (error instanceof CategorySlugError) return CATEGORY_SLUG_FALLBACK;
    throw error;
  }
}
