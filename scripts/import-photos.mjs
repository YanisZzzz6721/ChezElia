// Importe des photos locales dans le catalogue : UNE FICHE MASQUÉE par photo (titre provisoire, « Prix à confirmer »).
// Rien n'est inventé : titres, prix et descriptions sont à saisir ensuite dans l'admin, puis la fiche est affichée.
//
// Usage (depuis le terminal) :
//   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... ADMIN_EMAIL=... ADMIN_PASSWORD=... \
//   node --experimental-strip-types scripts/import-photos.mjs <dossier-parent> [--dry-run]
//
// <dossier-parent> contient un sous-dossier par catégorie : « Boisson » → catégorie « Boissons »,
// « Confiserie » → « Confiserie ». Le script agit avec les droits de l'administrateur (aucune clé secrète).
// Relançable sans risque : une photo déjà importée (même nom de fichier) est ignorée.
import { createClient } from "@supabase/supabase-js";
import { readdir, readFile } from "node:fs/promises";
import { extname, join, parse } from "node:path";
import { processPhoto, PhotoError } from "../src/lib/photo.ts";

const CATEGORY_BY_FOLDER = new Map([["boisson", "Boissons"], ["boissons", "Boissons"], ["confiserie", "Confiserie"], ["confiseries", "Confiserie"]]);
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const TITLE_PREFIX = "À nommer · ";
const CONCURRENCY = 4;

function fail(message) {
  console.error(`Erreur : ${message}`);
  process.exit(1);
}

const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey, ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
const parentFolder = process.argv[2];
const isDryRun = process.argv.includes("--dry-run");
if (!url || !anonKey || !email || !password) fail("variables NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, ADMIN_EMAIL et ADMIN_PASSWORD requises.");
if (!parentFolder) fail("indiquez le dossier parent des photos (contenant Boisson/ et Confiserie/).");

/** Liste les photos d'un dossier (hors fichiers cachés), triées par nom. */
async function listImages(folder) {
  const entries = await readdir(folder, { withFileTypes: true });
  return entries.filter((e) => e.isFile() && !e.name.startsWith(".") && IMAGE_EXTENSIONS.has(extname(e.name).toLowerCase())).map((e) => e.name).sort();
}

const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: session, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
if (loginError) fail(`connexion impossible (${loginError.message}).`);
if (session.user.app_metadata?.role !== "admin") fail("ce compte n'a pas le rôle admin.");

/** Récupère (ou crée) la catégorie du nom donné ; renvoie son identifiant. */
async function ensureCategory(name) {
  const { data: existing, error } = await supabase.from("categories").select("id, name");
  if (error) fail(`lecture des catégories impossible (${error.message}).`);
  const found = existing.find((c) => c.name.trim().toLowerCase() === name.toLowerCase());
  if (found) return found.id;
  if (isDryRun) return null;
  const position = existing.length;
  const { data, error: insertError } = await supabase.from("categories").insert({ name, position }).select("id").single();
  if (insertError) fail(`création de la catégorie « ${name} » impossible (${insertError.message}).`);
  return data.id;
}

/** Importe une photo : conversion WebP, envoi, création de la fiche masquée. Renvoie « imported », « skipped » ou « failed: raison ». */
async function importOne(folder, fileName, categoryId, knownTitles) {
  const title = `${TITLE_PREFIX}${parse(fileName).name}`;
  if (knownTitles.has(title)) return "skipped";
  if (isDryRun) return "imported";
  let uploadedPath = null;
  try {
    const photo = await processPhoto(new Uint8Array(await readFile(join(folder, fileName))));
    uploadedPath = `products/${crypto.randomUUID()}.webp`;
    const { error: uploadError } = await supabase.storage.from("photos").upload(uploadedPath, photo.bytes, { contentType: "image/webp", upsert: false });
    if (uploadError) throw new Error(`envoi : ${uploadError.message}`);
    const { error: insertError } = await supabase.from("products").insert({
      title, category_id: categoryId, price_cents: null, description: null, visible: false,
      photo_path: uploadedPath, photo_width: photo.width, photo_height: photo.height,
    });
    if (insertError) throw new Error(`fiche : ${insertError.message}`);
    knownTitles.add(title);
    return "imported";
  } catch (error) {
    if (uploadedPath) await supabase.storage.from("photos").remove([uploadedPath]);
    const reason = error instanceof PhotoError || error instanceof Error ? error.message : "erreur inconnue";
    return `failed: ${fileName} — ${reason}`;
  }
}

const { data: titleRows, error: titlesError } = await supabase.from("products").select("title").like("title", `${TITLE_PREFIX}%`);
if (titlesError) fail(`lecture des fiches existantes impossible (${titlesError.message}).`);
const knownTitles = new Set(titleRows.map((row) => row.title));

const totals = { imported: 0, skipped: 0, failed: [] };
const folders = (await readdir(parentFolder, { withFileTypes: true })).filter((e) => e.isDirectory());
for (const folderEntry of folders) {
  const categoryName = CATEGORY_BY_FOLDER.get(folderEntry.name.toLowerCase());
  if (!categoryName) { console.log(`Dossier ignoré (catégorie inconnue) : ${folderEntry.name}`); continue; }
  const folder = join(parentFolder, folderEntry.name);
  const files = await listImages(folder);
  const categoryId = await ensureCategory(categoryName);
  console.log(`${folderEntry.name} → « ${categoryName} » : ${files.length} photo(s)${isDryRun ? " (simulation)" : ""}`);

  let next = 0;
  async function worker() {
    while (next < files.length) {
      const fileName = files[next++];
      const result = await importOne(folder, fileName, categoryId, knownTitles);
      if (result === "imported") totals.imported++;
      else if (result === "skipped") totals.skipped++;
      else totals.failed.push(result.slice("failed: ".length));
      if ((totals.imported + totals.skipped + totals.failed.length) % 20 === 0) console.log(`  … ${totals.imported + totals.skipped + totals.failed.length} traitées`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
}
console.log(`\nTerminé : ${totals.imported} importée(s), ${totals.skipped} déjà présente(s), ${totals.failed.length} refusée(s).`);
for (const line of totals.failed) console.log(`  ✗ ${line}`);
process.exit(totals.failed.length > 0 ? 2 : 0);
