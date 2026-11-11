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
  publisherName: null,
  legalForm: null,
  siret: null,
  publicationDirector: null,
  contactEmail: null,
  hostName: null,
  hostAddress: null,
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
