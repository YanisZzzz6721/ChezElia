export const SITE = {
  name: "Chez Elia",
  tagline: "Votre épicerie de nuit à Strasbourg",
  address: "4 rue Sédillot, 67000 Strasbourg",
  lead: "Boissons, snacks, confiseries et produits américains, en plein centre-ville. Passez nous voir, nous sommes ouverts tard.",
  directionsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=4+rue+S%C3%A9dillot%2C+67000+Strasbourg",
  /** Numéro public non fourni : le bouton Appeler reste désactivé tant que ceci vaut null. */
  phoneNumber: null as string | null,
  tape: ["Boissons", "Snacks", "Confiseries", "Produits américains"],
} as const;
