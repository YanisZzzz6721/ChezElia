/**
 * Proposition (jamais une écriture) des produits probablement importés des États-Unis, à partir de leur titre.
 * Utilisé par scripts/suggest-us-imports.mjs ; le propriétaire valide ensuite produit par produit dans l'administration
 * (case « Import USA »). Fichier volontairement sans import et sans syntaxe réservée à TypeScript (enum, etc.) :
 * Node l'exécute directement (--experimental-strip-types).
 */

/** « owner-list » : marque citée par les propriétaires. « to-check » : marque américaine connue, ajoutée à titre indicatif — à vérifier produit par produit. */
export type SuggestionConfidence = "owner-list" | "to-check";

export interface UsBrand {
  /** Nom affiché dans la proposition. */
  name: string;
  /** Autres écritures possibles dans un titre (« Mike & Ike » pour « Mike and Ike »). */
  aliases: readonly string[];
  confidence: SuggestionConfidence;
}

/**
 * Marques américaines reconnues dans les titres. LISTE INDICATIVE : une marque américaine peut être fabriquée en Europe,
 * et un produit portant l'une de ces marques n'est pas forcément importé. Rien n'est coché automatiquement.
 * Pour proposer une nouvelle marque : l'ajouter ici (écriture libre ; accents, casse et ponctuation sont ignorés).
 */
export const US_IMPORT_BRANDS: readonly UsBrand[] = [
  // Marques citées par les propriétaires.
  { name: "Candy Pop", aliases: [], confidence: "owner-list" },
  { name: "Mike and Ike", aliases: ["Mike & Ike", "Mike n Ike"], confidence: "owner-list" },
  { name: "Roll-Ups", aliases: ["Rollups", "Fruit by the Foot"], confidence: "owner-list" },
  { name: "Peelerz", aliases: [], confidence: "owner-list" },
  { name: "Kid Rock Punk", aliases: [], confidence: "owner-list" },
  { name: "Jolly Rancher", aliases: [], confidence: "owner-list" },
  { name: "Reese's", aliases: ["Reeses"], confidence: "owner-list" },
  { name: "Hershey's", aliases: ["Hersheys"], confidence: "owner-list" },
  { name: "Airheads", aliases: [], confidence: "owner-list" },
  { name: "Takis", aliases: [], confidence: "owner-list" },
  { name: "Arizona", aliases: [], confidence: "owner-list" },
  { name: "Dr Pepper", aliases: ["Dr. Pepper"], confidence: "owner-list" },
  { name: "Mountain Dew", aliases: [], confidence: "owner-list" },
  { name: "Fanta Exotic", aliases: ["Fanta Exotique", "Fanta Exotiques"], confidence: "owner-list" },
  // Marques américaines connues, ajoutées à titre indicatif.
  { name: "Jelly Belly", aliases: [], confidence: "to-check" },
  { name: "Nerds", aliases: [], confidence: "to-check" },
  { name: "Toxic Waste", aliases: [], confidence: "to-check" },
  { name: "Van Holten's", aliases: ["Van Holtens"], confidence: "to-check" },
  { name: "Marshmallow Fluff", aliases: [], confidence: "to-check" },
  { name: "Monster Energy", aliases: [], confidence: "to-check" },
  { name: "Calypso", aliases: [], confidence: "to-check" },
];

/**
 * Mots (entiers) qui signalent une boisson alcoolisée : jamais proposée, car la vente d'alcool n'est pas confirmée
 * (voir docs/admin.md, section « Alcool »). Liste en minuscules sans accents.
 */
export const ALCOHOL_WORDS: readonly string[] = [
  "alcool", "biere", "bieres", "vodka", "whisky", "whiskey", "bourbon", "rhum", "rum", "gin", "tequila",
  "champagne", "vin", "vins", "liqueur", "cognac", "lambrusco", "spritz",
];

export interface ProductToReview {
  id: string;
  title: string;
  visible: boolean;
  is_us_import: boolean;
}

export interface UsImportSuggestion {
  id: string;
  title: string;
  visible: boolean;
  brandName: string;
  confidence: SuggestionConfidence;
}

export interface UsImportReport {
  suggestions: UsImportSuggestion[];
  /** Produits déjà cochés « Import USA » : non reproposés. */
  alreadyMarkedCount: number;
  /** Produits de marque américaine écartés car ce sont des boissons alcoolisées. */
  excludedAlcoholCount: number;
}

/**
 * Quoi : met un texte sous une forme comparable : minuscules, sans accents, apostrophes retirées, ponctuation et espaces réduits à un espace.
 * Input : text — titre ou nom de marque.
 * Output : le texte normalisé (ex. « Reese’s Cups » → « reeses cups », « Mike & Ike » → « mike ike »).
 * Effets de bord : aucun (fonction pure).
 */
export function normalizeForBrandMatching(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Vrai si `phrase` apparaît dans `text` en MOTS ENTIERS (les deux déjà normalisés). */
function containsWholeWords(text: string, phrase: string): boolean {
  return phrase !== "" && ` ${text} `.includes(` ${phrase} `);
}

/**
 * Quoi : indique si un titre désigne une boisson alcoolisée (mot entier de ALCOHOL_WORDS).
 * Input : title — titre du produit.
 * Output : vrai pour une boisson alcoolisée, faux sinon (« Gingembre » ne contient pas « gin » comme mot entier).
 * Effets de bord : aucun (fonction pure).
 */
export function isAlcoholTitle(title: string): boolean {
  const normalized = normalizeForBrandMatching(title);
  return ALCOHOL_WORDS.some((word) => containsWholeWords(normalized, word));
}

/**
 * Quoi : cherche une marque américaine de la liste dans un titre de produit.
 * Input : title — titre du produit.
 * Output : la première marque trouvée (mot entier, casse/accents/ponctuation ignorés), ou null.
 * Effets de bord : aucun (fonction pure).
 */
export function findUsImportBrand(title: string): UsBrand | null {
  const normalizedTitle = normalizeForBrandMatching(title);
  if (normalizedTitle === "") return null;
  for (const brand of US_IMPORT_BRANDS) {
    const spellings = [brand.name, ...brand.aliases].map(normalizeForBrandMatching);
    if (spellings.some((spelling) => containsWholeWords(normalizedTitle, spelling))) return brand;
  }
  return null;
}

/**
 * Quoi : propose les produits probablement américains parmi une liste de produits (lecture seule).
 * Input : products — produits non supprimés, avec leur titre, leur visibilité et leur case « Import USA ».
 * Output : un rapport : propositions (dans l'ordre reçu), nombre de produits déjà cochés, nombre d'alcools écartés.
 * Effets de bord : aucun (fonction pure : ne modifie pas la liste reçue, n'écrit rien nulle part).
 */
export function suggestUsImports(products: readonly ProductToReview[]): UsImportReport {
  const report: UsImportReport = { suggestions: [], alreadyMarkedCount: 0, excludedAlcoholCount: 0 };
  for (const product of products) {
    const brand = findUsImportBrand(product.title);
    if (brand === null) continue;
    if (product.is_us_import) {
      report.alreadyMarkedCount += 1;
      continue;
    }
    if (isAlcoholTitle(product.title)) {
      report.excludedAlcoholCount += 1;
      continue;
    }
    report.suggestions.push({ id: product.id, title: product.title, visible: product.visible, brandName: brand.name, confidence: brand.confidence });
  }
  return report;
}
