/**
 * Informations légales de l'éditeur. `null` = non fournie : la page affiche « à compléter » et
 * la mise en ligne publique reste bloquée tant que `listMissingLegalFields` n'est pas vide.
 * Dépôt public : ne renseigner ici que des informations déjà publiques (jamais de coordonnée privée).
 */
export interface LegalInfo {
  publisherName: string | null;
  legalForm: string | null;
  siret: string | null;
  publicationDirector: string | null;
  contactEmail: string | null;
  hostName: string | null;
  hostAddress: string | null;
}

export const LEGAL: LegalInfo = {
  // Informations publiques (registre officiel des entreprises), fournies par Yanis le 2026-11-19.
  publisherName: "CHEZ ELIA",
  legalForm: "SASU (société par actions simplifiée unipersonnelle)",
  siret: "941 234 338 00015",
  // Fonction et non nom : la présidente/le président ne souhaite pas voir son nom sur le site (choix de la société).
  publicationDirector: "Le représentant légal de la société CHEZ ELIA (SASU)",
  contactEmail: "chezelia@outlook.fr",
  // Adresse relevée sur https://vercel.com/legal/privacy-policy (section « Contact Us ») le 2026-11-19.
  hostName: "Vercel Inc.",
  hostAddress: "440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis",
};

export const LEGAL_FIELD_LABELS: Record<keyof LegalInfo, string> = {
  publisherName: "Nom ou raison sociale de l'éditeur",
  legalForm: "Forme juridique",
  siret: "Numéro SIRET",
  publicationDirector: "Directeur de la publication",
  contactEmail: "Adresse e-mail de contact",
  hostName: "Hébergeur (nom)",
  hostAddress: "Hébergeur (adresse)",
};
