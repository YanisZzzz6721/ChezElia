// Applique des noms de produits lus sur les emballages aux fiches « À nommer · … » importées par import-photos.mjs.
// SÛR : ne modifie QUE les fiches dont le titre commence encore par « À nommer · ». Jamais le prix, la description
// ni la visibilité. Une fiche déjà renommée à la main n'est pas touchée. Relançable sans risque.
//
// Format du fichier (TSV, une ligne par photo) :
//   dossier <TAB> nom-du-fichier-sans-extension <TAB> titre <TAB> ok|verifier [<TAB> cat=Épicerie]
// « verifier » ajoute « (à vérifier) » au titre ; « cat=… » range la fiche dans cette catégorie (créée si besoin).
//
// Usage :
//   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... ADMIN_EMAIL=... ADMIN_PASSWORD=... \
//   node scripts/apply-titles.mjs <fichier.tsv> [--dry-run]
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";

const FOLDER_TO_CATEGORY = new Map([["Boisson", "Boissons"], ["Confiserie", "Confiserie"]]);
const TITLE_PREFIX = "À nommer · ";
const REVIEW_SUFFIX = " (à vérifier)";

function fail(message) {
  console.error(`Erreur : ${message}`);
  process.exit(1);
}

const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey, ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
const tsvPath = process.argv[2];
const isDryRun = process.argv.includes("--dry-run");
if (!url || !anonKey || !email || !password) fail("variables NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, ADMIN_EMAIL et ADMIN_PASSWORD requises.");
if (!tsvPath) fail("indiquez le fichier TSV des titres.");

/** Lit le TSV et valide chaque ligne (4 colonnes minimum, dossier connu, titre non vide, statut connu). */
async function readRows() {
  const text = await readFile(tsvPath, "utf8");
  return text.split("\n").filter((line) => line.trim() !== "").map((line, index) => {
    const [folder, file, title, status, extra] = line.split("\t");
    if (!FOLDER_TO_CATEGORY.has(folder)) fail(`ligne ${index + 1} : dossier inconnu « ${folder} ».`);
    if (!file || !title || title.trim() === "") fail(`ligne ${index + 1} : nom de fichier ou titre vide.`);
    if (status !== "ok" && status !== "verifier") fail(`ligne ${index + 1} : statut « ${status} » (attendu ok ou verifier).`);
    if (title.length > 180) fail(`ligne ${index + 1} : titre trop long (180 caractères maximum).`);
    const category = extra?.startsWith("cat=") ? extra.slice(4).trim() : null;
    return { folder, file, title: title.trim(), status, category };
  });
}

const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: session, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
if (loginError) fail(`connexion impossible (${loginError.message}).`);
if (session.user.app_metadata?.role !== "admin") fail("ce compte n'a pas le rôle admin.");

const rows = await readRows();
const { data: categories, error: categoriesError } = await supabase.from("categories").select("id, name, position");
if (categoriesError) fail(`lecture des catégories impossible (${categoriesError.message}).`);
const categoryIdByName = new Map(categories.map((c) => [c.name.trim().toLowerCase(), c.id]));
let nextPosition = categories.length;

/** Renvoie l'identifiant de la catégorie du nom donné, en la créant au besoin (sauf en simulation). */
async function ensureCategory(name) {
  const known = categoryIdByName.get(name.toLowerCase());
  if (known) return known;
  if (isDryRun) return null;
  const { data, error } = await supabase.from("categories").insert({ name, position: nextPosition++ }).select("id").single();
  if (error) fail(`création de la catégorie « ${name} » impossible (${error.message}).`);
  categoryIdByName.set(name.toLowerCase(), data.id);
  return data.id;
}

const { data: pending, error: pendingError } = await supabase.from("products").select("id, title").like("title", `${TITLE_PREFIX}%`);
if (pendingError) fail(`lecture des fiches impossible (${pendingError.message}).`);
const idByProvisionalTitle = new Map(pending.map((p) => [p.title, p.id]));

const totals = { renamed: 0, missing: 0, failed: [] };
for (const row of rows) {
  const provisional = `${TITLE_PREFIX}${FOLDER_TO_CATEGORY.get(row.folder)} · ${row.file}`;
  const productId = idByProvisionalTitle.get(provisional);
  if (!productId) { totals.missing++; continue; }
  const newTitle = row.status === "verifier" ? `${row.title}${REVIEW_SUFFIX}` : row.title;
  if (isDryRun) { totals.renamed++; continue; }
  const update = { title: newTitle };
  if (row.category) update.category_id = await ensureCategory(row.category);
  const { error } = await supabase.from("products").update(update).eq("id", productId).like("title", `${TITLE_PREFIX}%`);
  if (error) totals.failed.push(`${provisional} — ${error.message}`);
  else totals.renamed++;
}
console.log(`${isDryRun ? "(simulation) " : ""}Terminé : ${totals.renamed} fiche(s) renommée(s), ${totals.missing} ignorée(s) (déjà renommées ou absentes), ${totals.failed.length} en erreur.`);
for (const line of totals.failed) console.log(`  ✗ ${line}`);
process.exit(totals.failed.length > 0 ? 2 : 0);
