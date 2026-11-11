import type { PriceInCents } from "@/lib/price";

export interface Category {
  id: string;
  label: string;
}

export interface Product {
  id: string;
  title: string;
  /** null = produit présent dans « Tout » seulement (pas de catégorie attribuée). */
  categoryId: string | null;
  /** Courte description facultative — jamais générée, saisie avec le client. */
  description?: string;
  /** Centimes. null = « Prix à confirmer ». */
  priceInCents: PriceInCents;
  /** Chemin d'une photo dont les droits sont confirmés. Absent = « Photo à venir ». */
  photo?: string;
}

export const CATEGORIES: readonly Category[] = [
  { id: "boissons", label: "Boissons" },
  { id: "confiserie", label: "Confiserie" },
];

/**
 * DONNÉES DE DÉMONSTRATION — à remplacer par la saisie du vrai catalogue avec le client (phase 8).
 * Titres lus sur les emballages, sans prix ni description inventés.
 */
export const PRODUCTS: readonly Product[] = [
  { id: "coca-cola-cherry", title: "Coca-Cola Cherry", categoryId: "boissons", priceInCents: null },
  { id: "fanta", title: "Fanta", categoryId: "boissons", priceInCents: null },
  { id: "red-bull", title: "Red Bull", categoryId: "boissons", priceInCents: null },
  { id: "pepsi", title: "Pepsi", categoryId: "boissons", priceInCents: null },
  { id: "frosty-bites", title: "Frosty Bites", categoryId: "confiserie", priceInCents: null },
  { id: "tetes-brulees-paint-billes", title: "Têtes Brûlées Paint Billes", categoryId: "confiserie", priceInCents: null },
  {
    id: "conik-sweet-waffle-cones",
    title: "Conik Sweet Waffle Cones fourrés au chocolat au lait et à la crème pistache, édition Dubaï",
    categoryId: "confiserie",
    priceInCents: null,
  },
  { id: "couscous-samia-moyen", title: "Couscous Samia moyen", categoryId: null, priceInCents: null },
];
