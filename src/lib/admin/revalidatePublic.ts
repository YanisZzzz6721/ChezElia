import { revalidatePath } from "next/cache";

/**
 * Quoi : demande à Next de régénérer les pages publiques qui affichent le catalogue : accueil, pages de rayon et page des produits américains.
 * Input : categorySlug — adresse du rayon concerné, si elle est connue (sa page est alors invalidée explicitement).
 * Output : aucun.
 * Effets de bord : invalide le cache de « / », de « /produits-americains », de « /rayons/<slug> » et, par le layout « /rayons »,
 *   de toutes les pages de rayon (un produit ou un rayon modifié peut changer plusieurs pages).
 */
export function revalidateCataloguePages(categorySlug?: string): void {
  revalidatePath("/");
  revalidatePath("/produits-americains");
  revalidatePath("/rayons", "layout");
  if (categorySlug) revalidatePath(`/rayons/${categorySlug}`);
}
