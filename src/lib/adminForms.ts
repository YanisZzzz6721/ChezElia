import { z } from "zod";
import { CATEGORY_SEO_INTRO_MAX_LENGTH } from "@/content/products";
import { FAQ_ANSWER_MAX_LENGTH, FAQ_QUESTION_MAX_LENGTH } from "@/content/faq";
import { SERVICE_BODY_MAX_LENGTH, SERVICE_HIGHLIGHT_MAX_LENGTH, SERVICE_ICONS, SERVICE_TITLE_MAX_LENGTH, type ServiceIconName } from "@/content/services";
import { SOCIAL_NETWORKS, parseSocialUrl, type SocialNetworkName } from "@/content/social";
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
  /** Produit importé des États-Unis (case « Import USA »). */
  isUsImport: boolean;
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
 * Input : formData — champs title, categoryId, description, price, visible et isUsImport (cases cochées = « on »).
 * Output : { ok: true, data } avec titre nettoyé, catégorie (null si aucune), description (null si vide),
 *   prix en centimes (null si champ vide = « Prix à confirmer »), visibilité et « Import USA » ; sinon { ok: false, error } lisible.
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
      isUsImport: formData.get("isUsImport") === "on",
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

export interface CategoryIntroInput {
  id: string;
  /** null = texte non rédigé (la page du rayon reste invisible pour Google). */
  seoIntro: string | null;
}

const categoryIntroSchema = z.object({
  id: z.string().uuid("Identifiant de catégorie invalide."),
  seoIntro: z.string().trim().max(CATEGORY_SEO_INTRO_MAX_LENGTH, `Le texte de présentation est trop long (${CATEGORY_SEO_INTRO_MAX_LENGTH} caractères maximum).`),
});

/**
 * Quoi : lit et valide le texte de présentation d'un rayon (page Google).
 * Input : formData — champs id (catégorie) et seoIntro (les retours à la ligne sont conservés).
 * Output : { ok: true, data: { id, seoIntro } } avec le texte nettoyé (null si vide ou blanc) ; sinon { ok: false, error } lisible.
 * Effets de bord : aucun (fonction pure).
 */
export function parseCategoryIntroForm(formData: FormData): ParseResult<CategoryIntroInput> {
  const parsed = categoryIntroSchema.safeParse({ id: readText(formData, "id"), seoIntro: readText(formData, "seoIntro") });
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  return { ok: true, data: { id: parsed.data.id, seoIntro: parsed.data.seoIntro === "" ? null : parsed.data.seoIntro } };
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

export interface QuickEditInput {
  id: string;
  title: string;
  /** null = « Prix à confirmer ». */
  priceCents: number | null;
}

const quickEditSchema = z.object({
  id: z.string().uuid("Identifiant de produit invalide."),
  title: z.string().trim().min(1, "Le titre du produit est obligatoire.").max(200, "Le titre est trop long (200 caractères maximum)."),
});

/**
 * Quoi : lit et valide la modification rapide (titre + prix) d'une ligne de la liste.
 * Input : formData — champs id, title, price.
 * Output : { ok: true, data } (prix en centimes, null si vide) ou { ok: false, error } lisible.
 * Effets de bord : aucun (fonction pure).
 */
export function parseQuickEditForm(formData: FormData): ParseResult<QuickEditInput> {
  const text = quickEditSchema.safeParse({ id: readText(formData, "id"), title: readText(formData, "title") });
  if (!text.success) return { ok: false, error: firstIssue(text.error) };
  return attempt(() => ({ ok: true, data: { ...text.data, priceCents: parsePriceInput(readText(formData, "price")) } }));
}

export interface FaqInput {
  question: string;
  answer: string;
}

const faqSchema = z.object({
  question: z.string().trim().min(1, "La question est obligatoire.").max(FAQ_QUESTION_MAX_LENGTH, `La question est trop longue (${FAQ_QUESTION_MAX_LENGTH} caractères maximum).`),
  answer: z.string().trim().min(1, "La réponse est obligatoire.").max(FAQ_ANSWER_MAX_LENGTH, `La réponse est trop longue (${FAQ_ANSWER_MAX_LENGTH} caractères maximum).`),
});

/**
 * Quoi : lit et valide une question fréquente et sa réponse.
 * Input : formData — champs question et answer (les retours à la ligne de la réponse sont conservés).
 * Output : { ok: true, data: { question, answer } } nettoyés, sinon { ok: false, error } lisible.
 * Effets de bord : aucun (fonction pure).
 */
export function parseFaqForm(formData: FormData): ParseResult<FaqInput> {
  const parsed = faqSchema.safeParse({ question: readText(formData, "question"), answer: readText(formData, "answer") });
  return parsed.success ? { ok: true, data: parsed.data } : { ok: false, error: firstIssue(parsed.error) };
}

/**
 * Quoi : lit et valide la modification d'une question existante.
 * Input : formData — champs id, question et answer.
 * Output : { ok: true, data: { id, question, answer } } ou { ok: false, error } lisible.
 * Effets de bord : aucun (fonction pure).
 */
export function parseFaqEditForm(formData: FormData): ParseResult<FaqInput & { id: string }> {
  const id = z.string().uuid("Identifiant de question invalide.").safeParse(readText(formData, "id"));
  if (!id.success) return { ok: false, error: firstIssue(id.error) };
  const faq = parseFaqForm(formData);
  return faq.ok ? { ok: true, data: { id: id.data, ...faq.data } } : faq;
}

export interface ServiceInput {
  title: string;
  body: string;
  /** null = aucune mention mise en avant. */
  highlight: string | null;
  icon: ServiceIconName;
  visible: boolean;
}

const serviceSchema = z.object({
  title: z.string().trim().min(1, "Le titre du service est obligatoire.").max(SERVICE_TITLE_MAX_LENGTH, `Le titre est trop long (${SERVICE_TITLE_MAX_LENGTH} caractères maximum).`),
  body: z.string().trim().min(1, "Le texte du service est obligatoire.").max(SERVICE_BODY_MAX_LENGTH, `Le texte est trop long (${SERVICE_BODY_MAX_LENGTH} caractères maximum).`),
  highlight: z.string().trim().max(SERVICE_HIGHLIGHT_MAX_LENGTH, `La mention est trop longue (${SERVICE_HIGHLIGHT_MAX_LENGTH} caractères maximum).`),
  icon: z.enum(SERVICE_ICONS.map((icon) => icon.name) as [ServiceIconName, ...ServiceIconName[]], { error: "Choisissez une icône dans la liste." }),
});

/**
 * Quoi : lit et valide un service (carte de la section « Nos services »).
 * Input : formData — champs title, body, highlight (facultatif), icon (« sandwich », « parcel » ou « vinted ») et visible (case cochée = « on »).
 * Output : { ok: true, data } avec textes nettoyés, mention null si vide et visibilité ; sinon { ok: false, error } lisible.
 * Effets de bord : aucun (fonction pure).
 */
export function parseServiceForm(formData: FormData): ParseResult<ServiceInput> {
  const parsed = serviceSchema.safeParse({
    title: readText(formData, "title"),
    body: readText(formData, "body"),
    highlight: readText(formData, "highlight"),
    icon: readText(formData, "icon"),
  });
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { highlight, ...rest } = parsed.data;
  return { ok: true, data: { ...rest, highlight: highlight === "" ? null : highlight, visible: formData.get("visible") === "on" } };
}

/**
 * Quoi : lit et valide la modification d'un service existant.
 * Input : formData — champs id, title, body, highlight, icon et visible.
 * Output : { ok: true, data: { id, ...service } } ou { ok: false, error } lisible.
 * Effets de bord : aucun (fonction pure).
 */
export function parseServiceEditForm(formData: FormData): ParseResult<ServiceInput & { id: string }> {
  const id = z.string().uuid("Identifiant de service invalide.").safeParse(readText(formData, "id"));
  if (!id.success) return { ok: false, error: firstIssue(id.error) };
  const service = parseServiceForm(formData);
  return service.ok ? { ok: true, data: { id: id.data, ...service.data } } : service;
}

/** Adresses des réseaux sociaux : null = réseau masqué. */
export type SocialSettingsInput = Record<SocialNetworkName, string | null>;

/**
 * Quoi : lit et valide les adresses des réseaux sociaux.
 * Input : formData — champs instagram, tiktok, snapchat (adresse https complète, ou vide pour masquer le réseau).
 * Output : { ok: true, data } avec les trois adresses normalisées (null si vide) ; sinon { ok: false, error } nommant le réseau fautif.
 * Effets de bord : aucun (fonction pure).
 */
export function parseSocialSettingsForm(formData: FormData): ParseResult<SocialSettingsInput> {
  const data: SocialSettingsInput = { instagram: null, tiktok: null, snapchat: null };
  for (const { name } of SOCIAL_NETWORKS) {
    const parsed = parseSocialUrl(name, readText(formData, name));
    if (!parsed.ok) return { ok: false, error: parsed.error };
    data[name] = parsed.data;
  }
  return { ok: true, data };
}
