"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { revalidateCataloguePages } from "@/lib/admin/revalidatePublic";
import type { ActionResult } from "@/lib/admin/result";
import { parseCategoryForm, parseCategoryIntroForm, type ParseResult } from "@/lib/adminForms";
import { CategorySlugError, pickFreeSlug, slugifyCategoryName } from "@/lib/categorySlug";

const idSchema = z.string().uuid("Identifiant de catégorie invalide.");

/** Rafraîchit le site public (accueil, pages de rayon, produits américains) et les pages d'admin concernées. */
function refreshPages(categorySlug?: string): void {
  revalidateCataloguePages(categorySlug);
  revalidatePath("/admin/categories");
  revalidatePath("/admin/produits");
}

/**
 * Quoi : fabrique l'adresse (slug) de la page d'un nouveau rayon, unique parmi les rayons existants.
 * Input : name — nom de la catégorie ; takenSlugs — adresses déjà utilisées.
 * Output : { ok: true, data: slug } ou { ok: false, error } si le nom ne contient aucune lettre ni chiffre.
 * Effets de bord : aucun (fonction pure). Toute autre erreur est relancée.
 */
function buildFreeSlug(name: string, takenSlugs: readonly string[]): ParseResult<string> {
  try {
    return { ok: true, data: pickFreeSlug(slugifyCategoryName(name), takenSlugs) };
  } catch (error) {
    if (error instanceof CategorySlugError) return { ok: false, error: error.message };
    throw error;
  }
}

/** Message d'une violation d'unicité à l'insertion : nom déjà pris, ou adresse prise entre-temps par une création simultanée. */
function describeCreateConflict(error: { message: string }): string {
  if (error.message.includes("categories_slug_unique")) return "L'adresse de la page de ce rayon vient d'être prise par une autre catégorie. Réessayez.";
  return "Une catégorie porte déjà ce nom.";
}

/**
 * Quoi : crée une catégorie, placée en dernière position, avec l'adresse de sa page (/rayons/<slug>) tirée de son nom.
 *   L'adresse est unique (suffixe -2, -3… en cas de collision) et ne change JAMAIS ensuite, même si la catégorie est renommée.
 * Input : _previous — état précédent (useActionState) ; formData — champ name.
 * Output : { ok: true, message } ou { ok: false, error } (nom vide, trop long, déjà utilisé, ou sans lettre ni chiffre).
 * Effets de bord : vérifie l'administrateur ; lit puis écrit en base (journalisée) ; rafraîchit les pages.
 */
export async function createCategoryAction(_previous: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const input = parseCategoryForm(formData);
  if (!input.ok) return { ok: false, error: input.error };

  const { data: existing, error: readError } = await supabase.from("categories").select("position, slug");
  if (readError) return { ok: false, error: `Lecture des catégories impossible : ${readError.message}` };
  const rows = existing ?? [];
  const position = Math.max(-1, ...rows.map((row) => row.position)) + 1;
  const slug = buildFreeSlug(input.data.name, rows.map((row) => row.slug));
  if (!slug.ok) return { ok: false, error: slug.error };

  const { error } = await supabase.from("categories").insert({ name: input.data.name, position, slug: slug.data });
  if (error) return { ok: false, error: error.code === "23505" ? describeCreateConflict(error) : `Création impossible : ${error.message}` };
  refreshPages(slug.data);
  return { ok: true, message: `Catégorie « ${input.data.name} » créée.` };
}

/**
 * Quoi : renomme une catégorie. L'adresse de sa page (slug) n'est PAS modifiée : les liens publics restent valables.
 * Input : _previous — état précédent ; formData — id et name.
 * Output : { ok: true, message } ou { ok: false, error } (nom invalide ou déjà utilisé, catégorie supprimée entre-temps).
 * Effets de bord : vérifie l'administrateur ; met à jour le nom en base ; rafraîchit les pages.
 */
export async function renameCategoryAction(_previous: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, error: id.error.issues[0]?.message ?? "Identifiant invalide." };
  const input = parseCategoryForm(formData);
  if (!input.ok) return { ok: false, error: input.error };

  const { data, error } = await supabase.from("categories").update({ name: input.data.name }).eq("id", id.data).select("slug").maybeSingle();
  if (error) return { ok: false, error: error.code === "23505" ? "Une catégorie porte déjà ce nom." : `Renommage impossible : ${error.message}` };
  if (!data) return { ok: false, error: "Cette catégorie n'existe plus (supprimée entre-temps ?). Rechargez la page." };
  refreshPages(data.slug);
  return { ok: true, message: "Catégorie renommée." };
}

/**
 * Quoi : enregistre le texte de présentation d'un rayon (affiché sur sa page, vue par Google). Texte vide = non rédigé.
 * Input : _previous — état précédent (useActionState) ; formData — id (catégorie) et seoIntro (1200 caractères maximum).
 * Output : { ok: true, message } ou { ok: false, error } (texte trop long, identifiant invalide, catégorie introuvable).
 * Effets de bord : vérifie l'administrateur ; met à jour seo_intro (journalisé) ; rafraîchit l'accueil et la page du rayon.
 */
export async function saveCategorySeoIntroAction(_previous: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const input = parseCategoryIntroForm(formData);
  if (!input.ok) return { ok: false, error: input.error };

  const { data, error } = await supabase.from("categories").update({ seo_intro: input.data.seoIntro }).eq("id", input.data.id).select("slug").maybeSingle();
  if (error) return { ok: false, error: `Enregistrement du texte impossible : ${error.message}` };
  if (!data) return { ok: false, error: "Cette catégorie n'existe plus (supprimée entre-temps ?). Rechargez la page." };
  refreshPages(data.slug);
  return { ok: true, message: input.data.seoIntro === null ? "Texte effacé : la page du rayon reste invisible pour Google." : "Texte enregistré." };
}

/**
 * Quoi : monte ou descend une catégorie d'un cran (échange sa position avec sa voisine).
 * Input : formData — id et direction (« up » / « down »).
 * Output : aucun. Effets de bord : vérifie l'administrateur ; met à jour deux lignes ; rafraîchit les pages.
 *   Sans effet si la catégorie est déjà en première ou dernière position. Lève une Error si une écriture échoue.
 */
export async function moveCategoryAction(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const id = idSchema.parse(formData.get("id"));
  const direction = z.enum(["up", "down"]).parse(formData.get("direction"));

  const { data: rows, error: readError } = await supabase.from("categories").select("id, position").order("position", { ascending: true });
  if (readError) throw new Error(`Lecture des catégories impossible : ${readError.message}`);
  const ordered = rows ?? [];
  const index = ordered.findIndex((row) => row.id === id);
  const neighbourIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || neighbourIndex < 0 || neighbourIndex >= ordered.length) return;

  // Les positions sont renumérotées 0..n-1 : un échange reste correct même si elles avaient des trous ou des doublons.
  const reordered = [...ordered];
  [reordered[index], reordered[neighbourIndex]] = [reordered[neighbourIndex]!, reordered[index]!];
  for (const [position, row] of reordered.entries()) {
    const { error } = await supabase.from("categories").update({ position }).eq("id", row.id);
    if (error) throw new Error(`Réordonnancement impossible : ${error.message}`);
  }
  refreshPages();
}

/**
 * Quoi : supprime une catégorie ; ses produits restent visibles dans « Tout » (sans catégorie).
 * Input : formData — id. Output : aucun.
 * Effets de bord : vérifie l'administrateur ; supprime la ligne (journalisée) ; rafraîchit les pages. Lève une Error si l'écriture échoue.
 */
export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const id = idSchema.parse(formData.get("id"));
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(`Suppression de la catégorie impossible : ${error.message}`);
  refreshPages();
}
