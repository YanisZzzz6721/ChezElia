import type { PriceInCents } from "@/lib/price";

export interface Category {
  id: string;
  label: string;
}

export interface ProductPhoto {
  url: string;
  width: number;
  height: number;
}

export interface Product {
  id: string;
  title: string;
  /** null = produit présent dans « Tout » seulement (pas de catégorie attribuée). */
  categoryId: string | null;
  /** Courte description facultative — jamais générée, saisie avec le client. */
  description?: string;
  /** Centimes. null = « Prix à confirmer » (≠ 0, qui est un vrai prix nul). */
  priceInCents: PriceInCents;
  /** Photo publiée. Absent = « Photo à venir ». */
  photo?: ProductPhoto;
}
