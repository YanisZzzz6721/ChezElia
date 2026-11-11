import { z } from "zod";

export const BACKUP_VERSION = 1;

/** Dossier + nom généré côté serveur : empêche toute traversée de chemin à la restauration. */
const PHOTO_PATH_PATTERN = /^(products|site)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/;
const TIME_PATTERN = /^([01]\d|2[0-3])h[0-5]\d$/;

const categorySchema = z.object({ id: z.string().uuid(), name: z.string().trim().min(1).max(60), position: z.number().int() });
const productSchema = z
  .object({
    id: z.string().uuid(),
    category_id: z.string().uuid().nullable(),
    title: z.string().trim().min(1).max(200),
    description: z.string().max(500).nullable(),
    price_cents: z.number().int().min(0).max(999_999).nullable(),
    photo_path: z.string().regex(PHOTO_PATH_PATTERN).nullable(),
    photo_width: z.number().int().positive().nullable(),
    photo_height: z.number().int().positive().nullable(),
    visible: z.boolean(),
    deleted_at: z.string().nullable(),
  })
  .refine((p) => (p.photo_path === null) === (p.photo_width === null) && (p.photo_path === null) === (p.photo_height === null), {
    message: "photo : chemin et dimensions vont ensemble",
  });
const settingSchema = z.discriminatedUnion("key", [
  z.object({ key: z.literal("tag"), value: z.string().trim().min(1).max(60) }),
  z.object({ key: z.literal("lead"), value: z.string().trim().min(1).max(300) }),
  z.object({ key: z.literal("phone_number"), value: z.string().min(1).max(30).nullable() }),
  z.object({
    key: z.literal("hero_photo"),
    value: z.object({ path: z.string().regex(PHOTO_PATH_PATTERN), width: z.number().int().positive(), height: z.number().int().positive() }).nullable(),
  }),
]);
const hoursSchema = z
  .object({
    day_index: z.number().int().min(0).max(6),
    is_closed: z.boolean(),
    opens_at: z.string().regex(TIME_PATTERN).nullable(),
    closes_at: z.string().regex(TIME_PATTERN).nullable(),
  })
  .refine((h) => h.is_closed || (h.opens_at !== null && h.closes_at !== null), { message: "un jour ouvert a besoin de ses deux heures" });

const backupSchema = z.object({
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string(),
  categories: z.array(categorySchema),
  products: z.array(productSchema),
  settings: z.array(settingSchema),
  hours: z.array(hoursSchema),
});

export type BackupFile = z.infer<typeof backupSchema>;
export type BackupData = Omit<BackupFile, "version" | "exportedAt">;

/**
 * Quoi : assemble le fichier de sauvegarde (JSON) à partir des données lues en base.
 * Input : data — catégories, produits (corbeille comprise), réglages, horaires ; now — date d'export.
 * Output : l'objet sauvegarde, versionné et daté.
 * Effets de bord : aucun (fonction pure). Les photos elles-mêmes restent dans le stockage : seuls leurs chemins sont sauvegardés.
 */
export function buildBackup(data: BackupData, now: Date): BackupFile {
  return { version: BACKUP_VERSION, exportedAt: now.toISOString(), ...data };
}

/** Détecte les doublons d'identifiants et les produits rattachés à une catégorie absente. */
function findConsistencyProblem(file: BackupFile): string | null {
  const categoryIds = new Set(file.categories.map((c) => c.id));
  if (categoryIds.size !== file.categories.length) return "Sauvegarde invalide : doublon d'identifiant de catégorie.";
  if (new Set(file.products.map((p) => p.id)).size !== file.products.length) return "Sauvegarde invalide : doublon d'identifiant de produit.";
  if (new Set(file.hours.map((h) => h.day_index)).size !== file.hours.length) return "Sauvegarde invalide : doublon de jour dans les horaires.";
  const orphan = file.products.find((p) => p.category_id !== null && !categoryIds.has(p.category_id));
  if (orphan) return `Sauvegarde invalide : le produit « ${orphan.title} » référence une catégorie absente du fichier.`;
  return null;
}

/**
 * Quoi : lit et valide un fichier de sauvegarde avant toute restauration.
 * Input : text — contenu du fichier envoyé.
 * Output : { ok: true, data } si le fichier est conforme, sinon { ok: false, error } lisible (rien n'est écrit).
 * Effets de bord : aucun (fonction pure).
 */
export function parseBackup(text: string): { ok: true; data: BackupFile } | { ok: false; error: string } {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "Ce fichier n'est pas une sauvegarde valide (JSON illisible)." };
  }
  const parsed = backupSchema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: `Sauvegarde invalide : ${issue?.path.join(".") || "structure"} — ${issue?.message ?? "valeur incorrecte"}.` };
  }
  const problem = findConsistencyProblem(parsed.data);
  return problem ? { ok: false, error: problem } : { ok: true, data: parsed.data };
}
