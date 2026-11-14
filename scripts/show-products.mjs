// Affiche sur le site (visible = true) les fiches « sûres » d'un fichier TSV de titres, UNE seule fois par titre.
// Sont exclues : les produits d'alcool (colonne « alcool ») et ceux marqués « verifier » (titre incertain).
// Ne touche jamais au prix, au titre ni à la description. Relançable sans risque.
//
// Usage :
//   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... ADMIN_EMAIL=... ADMIN_PASSWORD=... \
//   node scripts/show-products.mjs <fichier.tsv> [--dry-run]
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";

function fail(message) {
  console.error(`Erreur : ${message}`);
  process.exit(1);
}

const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey, ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
const tsvPath = process.argv[2];
const isDryRun = process.argv.includes("--dry-run");
if (!url || !anonKey || !email || !password) fail("variables NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, ADMIN_EMAIL et ADMIN_PASSWORD requises.");
if (!tsvPath) fail("indiquez le fichier TSV des titres.");

/** Titres à afficher : lignes « ok » sans « alcool », dédoublonnées, dans l'ordre du fichier. */
async function readSafeTitles() {
  const text = await readFile(tsvPath, "utf8");
  const titles = new Set();
  for (const line of text.split("\n").filter((l) => l.trim() !== "")) {
    const [, , title, status, extra] = line.split("\t");
    if (!title) continue;
    if (status !== "ok") continue;
    if (extra === "alcool") continue;
    titles.add(title.trim());
  }
  return titles;
}

const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: session, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
if (loginError) fail(`connexion impossible (${loginError.message}).`);
if (session.user.app_metadata?.role !== "admin") fail("ce compte n'a pas le rôle admin.");

const safeTitles = await readSafeTitles();
const { data: products, error } = await supabase.from("products").select("id, title, visible, created_at").is("deleted_at", null).order("created_at", { ascending: true }).range(0, 4999);
if (error) fail(`lecture des fiches impossible (${error.message}).`);

// Une seule fiche par titre (la plus ancienne) : les photos en double du même produit ne sont pas répétées sur le site.
const idsToShow = [];
const seen = new Set();
for (const product of products) {
  if (!safeTitles.has(product.title) || seen.has(product.title)) continue;
  seen.add(product.title);
  if (!product.visible) idsToShow.push(product.id);
}
console.log(`${safeTitles.size} titre(s) sûr(s) dans le fichier ; ${idsToShow.length} fiche(s) à afficher${isDryRun ? " (simulation)" : ""}.`);
if (!isDryRun && idsToShow.length > 0) {
  for (let start = 0; start < idsToShow.length; start += 100) {
    const { error: updateError } = await supabase.from("products").update({ visible: true }).in("id", idsToShow.slice(start, start + 100));
    if (updateError) fail(`affichage impossible (${updateError.message}).`);
  }
  console.log("Terminé : fiches affichées.");
}
