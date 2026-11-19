import type { PriceInCents } from "@/lib/price";

/** Longueur maximale (en caractères) du texte de présentation d'un rayon ; la base applique la même (migration 20261119000000_seo_rayons.sql). */
export const CATEGORY_SEO_INTRO_MAX_LENGTH = 1200;

export interface Category {
  id: string;
  label: string;
  /** Adresse publique du rayon (/rayons/<slug>) : stable, jamais modifiée par un renommage. */
  slug: string;
  /** Texte de présentation du rayon rédigé par les propriétaires. null = pas encore rédigé (la page du rayon reste invisible pour Google). */
  seoIntro: string | null;
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
  /** Produit importé des États-Unis (« Import USA »), coché à la main par les propriétaires. */
  isUsImport: boolean;
}
