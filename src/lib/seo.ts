/**
 * Quoi : lit l'adresse publique du site (variable NEXT_PUBLIC_SITE_URL) et la normalise.
 * Input : raw — la valeur brute de la variable (éventuellement absente).
 * Output : l'origine sans chemin ni barre finale (« https://chez-elia.fr »), ou null si la variable est absente.
 * Effets de bord : aucun (fonction pure). Lève une Error explicite si la valeur n'est pas une adresse https
 *   (http n'est accepté que pour localhost).
 */
export function parseSiteUrl(raw: string | undefined): string | null {
  if (raw === undefined || raw.trim() === "") return null;
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error(`NEXT_PUBLIC_SITE_URL invalide : « ${raw} » (attendu : https://votre-domaine.fr).`);
  }
  const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  const isAllowed = url.protocol === "https:" || (url.protocol === "http:" && isLocalhost);
  if (!isAllowed || url.hostname === "") {
    throw new Error(`NEXT_PUBLIC_SITE_URL invalide : « ${raw} » (https obligatoire, http seulement pour localhost).`);
  }
  return url.origin;
}

/**
 * Quoi : décide si le site peut être indexé par les moteurs de recherche. Sûr par défaut : il faut
 *   que l'interrupteur SITE_INDEXING vaille exactement « on », qu'une adresse https de production soit définie
 *   et que toutes les mentions légales soient renseignées.
 * Input : flag — valeur de SITE_INDEXING ; siteUrl — adresse normalisée ou null ; missingLegalFields — mentions légales manquantes.
 * Output : vrai seulement si les trois conditions sont remplies.
 * Effets de bord : aucun (fonction pure).
 */
export function isIndexingEnabled(flag: string | undefined, siteUrl: string | null, missingLegalFields: readonly string[]): boolean {
  if (flag !== "on") return false;
  if (siteUrl === null || !siteUrl.startsWith("https://")) return false;
  return missingLegalFields.length === 0;
}

/**
 * Quoi : construit une adresse absolue à partir de l'adresse du site et d'un chemin interne.
 * Input : siteUrl — origine du site ; path — chemin commençant par une seule barre (« /mentions-legales »).
 * Output : l'adresse complète.
 * Effets de bord : aucun (fonction pure). Lève une Error si le chemin n'est pas un chemin interne.
 */
export function buildAbsoluteUrl(siteUrl: string, path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) throw new Error(`Chemin invalide : « ${path} » (un chemin interne commençant par « / » est attendu).`);
  return `${siteUrl}${path}`;
}
