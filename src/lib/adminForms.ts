import { z } from "zod";
import { parsePriceInput } from "./priceInput";
import { normalizePhoneInput } from "./phone";
import { DAY_NAMES } from "./siteData";

export type ParseResult<Data> = { ok: true; data: Data } | { ok: false; error: string };

export interface ProductInput {
  title: string;
  categoryId: string | null;
  description: string | null;
  /** null = « Prix à confirmer ». */
  priceCents: number | null;
  visible: boolean;
}

export interface SettingsInput {
  tag: string;
  lead: string;
  phoneNumber: string | null;
}

export interface HoursInput {
  day_index: number;
  is_closed: boolean;
  opens_at: string | null;
  closes_at: string | null;
}

const TIME_PATTERN = /^([01]\d|2[0-3])h[0-5]\d$/;

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/** Premier message d'erreur lisible d'une validation zod. */
function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Valeur invalide.";
}

/** Exécute un parseur qui peut lever une Error (prix, téléphone) et la convertit en résultat d'erreur lisible. */
function attempt<Data>(parse: () => ParseResult<Data>): ParseResult<Data> {
  try {
    return parse();
  } catch (error) {
    if (error instanceof Error) return { ok: false, error: error.message };
    throw error;
  }
}

const productTextSchema = z.object({
  title: z.string().trim().min(1, "Le titre du produit est obligatoire.").max(200, "Le titre est trop long (200 caractères maximum)."),
  description: z.string().trim().max(500, "La description est trop longue (500 caractères maximum)."),
  categoryId: z.union([z.literal(""), z.string().uuid("La catégorie choisie n'est pas valide.")]),
});

/**
 * Quoi : lit et valide le formulaire d'un produit.
 * Input : formData — champs title, categoryId, description, price, visible (case cochée = « on »).
 * Output : { ok: true, data } avec titre nettoyé, catégorie (null si aucune), description (null si vide),
 *   prix en centimes (null si champ vide = « Prix à confirmer ») et visibilité ; sinon { ok: false, error } lisible.
 * Effets de bord : aucun (fonction pure).
 */
export function parseProductForm(formData: FormData): ParseResult<ProductInput> {
  const text = productTextSchema.safeParse({
    title: readText(formData, "title"),
    description: readText(formData, "description"),
    categoryId: readText(formData, "categoryId"),
  });
  if (!text.success) return { ok: false, error: firstIssue(text.error) };

  return attempt(() => ({
    ok: true,
    data: {
      title: text.data.title,
      categoryId: text.data.categoryId === "" ? null : text.data.categoryId,
      description: text.data.description === "" ? null : text.data.description,
      priceCents: parsePriceInput(readText(formData, "price")),
      visible: formData.get("visible") === "on",
    },
  }));
}

const categoryNameSchema = z.string().trim().min(1, "Le nom de la catégorie est obligatoire.").max(60, "Le nom est trop long (60 caractères maximum).");

/**
 * Quoi : lit et valide le nom d'une catégorie.
 * Input : formData — champ name.
 * Output : { ok: true, data: { name } } nettoyé, sinon { ok: false, error }.
 * Effets de bord : aucun (fonction pure).
 */
export function parseCategoryForm(formData: FormData): ParseResult<{ name: string }> {
  const name = categoryNameSchema.safeParse(readText(formData, "name"));
  return name.success ? { ok: true, data: { name: name.data } } : { ok: false, error: firstIssue(name.error) };
}

const settingsTextSchema = z.object({
  tag: z.string().trim().min(1, "Le petit texte d'accroche est obligatoire.").max(60, "Le petit texte d'accroche est trop long (60 caractères maximum)."),
  lead: z.string().trim().min(1, "Le paragraphe d'accueil est obligatoire.").max(300, "Le paragraphe d'accueil est trop long (300 caractères maximum)."),
});

/**
 * Quoi : lit et valide les textes du site et le téléphone.
 * Input : formData — champs tag, lead, phone.
 * Output : { ok: true, data } (téléphone normalisé, null si vide) ou { ok: false, error } lisible.
 * Effets de bord : aucun (fonction pure).
 */
export function parseSettingsForm(formData: FormData): ParseResult<SettingsInput> {
  const text = settingsTextSchema.safeParse({ tag: readText(formData, "tag"), lead: readText(formData, "lead") });
  if (!text.success) return { ok: false, error: firstIssue(text.error) };
  return attempt(() => ({ ok: true, data: { ...text.data, phoneNumber: normalizePhoneInput(readText(formData, "phone")) } }));
}

/**
 * Quoi : lit et valide les horaires des 7 jours.
 * Input : formData — pour chaque jour i (0 = lundi) : closed_i (case cochée), opens_i, closes_i au format « 15h30 ».
 * Output : { ok: true, data } avec 7 lignes (heures ignorées pour un jour fermé) ou { ok: false, error } nommant le jour fautif.
 * Effets de bord : aucun (fonction pure).
 */
export function parseHoursForm(formData: FormData): ParseResult<HoursInput[]> {
  const days: HoursInput[] = [];
  for (const [index, dayName] of DAY_NAMES.entries()) {
    if (formData.get(`closed_${index}`) === "on") {
      days.push({ day_index: index, is_closed: true, opens_at: null, closes_at: null });
      continue;
    }
    const opensAt = readText(formData, `opens_${index}`).trim();
    const closesAt = readText(formData, `closes_${index}`).trim();
    if (!TIME_PATTERN.test(opensAt) || !TIME_PATTERN.test(closesAt)) {
      return { ok: false, error: `${dayName} : saisissez des heures au format 15h30 (ou cochez « Fermé »).` };
    }
    days.push({ day_index: index, is_closed: false, opens_at: opensAt, closes_at: closesAt });
  }
  return { ok: true, data: days };
}
