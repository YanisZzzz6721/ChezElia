// Range dans la catégorie « Alcools » et AFFICHE les fiches d'alcool d'un fichier TSV de titres (colonne « alcool »),
// une seule fiche par titre. À n'utiliser qu'une fois la licence de vente confirmée par le commerçant.
// Ne touche ni au titre, ni au prix, ni à la description. Relançable sans risque.
//
// Usage :
//   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... ADMIN_EMAIL=... ADMIN_PASSWORD=... \
//   node scripts/show-alcohol.mjs <fichier.tsv> [--dry-run]
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";

const CATEGORY_NAME = "Alcools";

function fail(message) {
  console.error(`Erreur : ${message}`);
  process.exit(1);
}

const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey, ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
const tsvPath = process.argv[2];
const isDryRun = process.argv.includes("--dry-run");
if (!url || !anonKey || !email || !password) fail("variables NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, ADMIN_EMAIL et ADMIN_PASSWORD requises.");
if (!tsvPath) fail("indiquez le fichier TSV des titres.");

/** Titres d'alcool du fichier (colonne 5 = « alcool »), dédoublonnés. */
async function readAlcoholTitles() {
  const text = await readFile(tsvPath, "utf8");
  const titles = new Set();
  for (const line of text.split("\n").filter((l) => l.trim() !== "")) {
    const [, , title, , extra] = line.split("\t");
    if (title && extra === "alcool") titles.add(title.trim());
  }
  return titles;
}

const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: session, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
if (loginError) fail(`connexion impossible (${loginError.message}).`);
if (session.user.app_metadata?.role !== "admin") fail("ce compte n'a pas le rôle admin.");

const alcoholTitles = await readAlcoholTitles();
const { data: categories, error: categoriesError } = await supabase.from("categories").select("id, name");
if (categoriesError) fail(`lecture des catégories impossible (${categoriesError.message}).`);
let categoryId = categories.find((c) => c.name.trim().toLowerCase() === CATEGORY_NAME.toLowerCase())?.id ?? null;
if (!categoryId && !isDryRun) {
  const { data, error } = await supabase.from("categories").insert({ name: CATEGORY_NAME, position: categories.length }).select("id").single();
  if (error) fail(`création de la catégorie « ${CATEGORY_NAME} » impossible (${error.message}).`);
  categoryId = data.id;
}

const { data: products, error } = await supabase.from("products").select("id, title, visible, category_id, created_at").is("deleted_at", null).order("created_at", { ascending: true }).range(0, 4999);
if (error) fail(`lecture des fiches impossible (${error.message}).`);
const seen = new Set();
const idsToUpdate = [];
for (const product of products) {
  if (!alcoholTitles.has(product.title) || seen.has(product.title)) continue;
  seen.add(product.title);
  if (!product.visible || product.category_id !== categoryId) idsToUpdate.push(product.id);
}
console.log(`${alcoholTitles.size} titre(s) d'alcool dans le fichier ; ${idsToUpdate.length} fiche(s) à ranger dans « ${CATEGORY_NAME} » et à afficher${isDryRun ? " (simulation)" : ""}.`);
if (!isDryRun && idsToUpdate.length > 0) {
  for (let start = 0; start < idsToUpdate.length; start += 100) {
    const { error: updateError } = await supabase.from("products").update({ category_id: categoryId, visible: true }).in("id", idsToUpdate.slice(start, start + 100));
    if (updateError) fail(`mise à jour impossible (${updateError.message}).`);
  }
  console.log("Terminé : fiches d'alcool affichées.");
}
