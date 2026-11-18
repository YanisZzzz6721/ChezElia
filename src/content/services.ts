/** Icônes proposées pour un service (liste fermée : la base de données applique la même, migration 20261118000000_services.sql). */
export const SERVICE_ICONS = [
  { name: "sandwich", label: "Sandwich" },
  { name: "parcel", label: "Colis" },
  { name: "vinted", label: "Vinted" },
] as const;

/** Nom d'une icône de service (source unique : les composants publics importent ce type). */
export type ServiceIconName = (typeof SERVICE_ICONS)[number]["name"];

/** Un service tel que fourni au site (la colonne `body` de la base devient le texte de la carte). */
export interface ServiceItem {
  id: string;
  title: string;
  body: string;
  /** Mention courte mise en avant (ex. « 2,50 € ») ; null = aucune. */
  highlight: string | null;
  icon: ServiceIconName;
  visible: boolean;
}

/** Limites de longueur (en caractères) ; la base de données applique les mêmes. */
export const SERVICE_TITLE_MAX_LENGTH = 60;
export const SERVICE_BODY_MAX_LENGTH = 300;
export const SERVICE_HIGHLIGHT_MAX_LENGTH = 30;

/**
 * Quoi : indique si une valeur inconnue est bien le nom d'une icône de service.
 * Input : value — valeur à tester (texte d'un formulaire, d'une ligne de base, d'une sauvegarde…).
 * Output : true (et affine le type) si c'est « sandwich », « parcel » ou « vinted ».
 * Effets de bord : aucun (fonction pure).
 */
export function isServiceIconName(value: unknown): value is ServiceIconName {
  return SERVICE_ICONS.some((icon) => icon.name === value);
}
