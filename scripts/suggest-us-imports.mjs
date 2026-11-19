// PROPOSE (sans rien écrire) les produits probablement importés des États-Unis, d'après leur titre.
// Le propriétaire valide ensuite, produit par produit, avec la case « Import USA » de l'administration.
//
// Les marques reconnues sont listées EN TÊTE de src/lib/usImportSuggestions.ts (US_IMPORT_BRANDS) : liste indicative
// (marques citées par les propriétaires + quelques marques américaines connues, marquées « à vérifier »).
// Les boissons alcoolisées ne sont jamais proposées. Les produits à la corbeille et ceux déjà cochés sont ignorés.
//
// LECTURE SEULE : le script n'exécute que des requêtes « select ». Il ne modifie rien en base.
//
// Usage (base LOCALE, depuis le terminal) — au choix :
//   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... ADMIN_EMAIL=... ADMIN_PASSWORD=... \
//   node --experimental-strip-types scripts/suggest-us-imports.mjs
// ou, pour voir aussi les produits masqués sans compte administrateur (clé de service du Supabase LOCAL, saisie au terminal) :
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node --experimental-strip-types scripts/suggest-us-imports.mjs
import { createClient } from "@supabase/supabase-js";
import { suggestUsImports } from "../src/lib/usImportSuggestions.ts";

const PAGE_SIZE = 1000;
const MAX_PRODUCTS = 20_000;
const CONFIDENCE_LABELS = { "owner-list": "marque du propriétaire", "to-check": "à vérifier" };

function fail(message) {
  console.error(`Erreur : ${message}`);
  process.exit(1);
}

/**
 * Quoi : ouvre une connexion en lecture : clé de service (si fournie) ou compte administrateur.
 * Input : variables d'environnement (voir l'usage en tête de fichier).
 * Output : un client Supabase prêt à lire les produits, masqués compris.
 * Effets de bord : connexion réseau (connexion du compte administrateur le cas échéant) ; termine le programme avec un message si la configuration est incomplète ou la connexion refusée.
 */
async function openReadClient() {
  const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey, SUPABASE_SERVICE_ROLE_KEY: serviceKey, ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  if (!url) fail("variable NEXT_PUBLIC_SUPABASE_URL requise.");
  if (serviceKey) return createClient(url, serviceKey, options);
  if (!anonKey || !email || !password) fail("fournissez SUPABASE_SERVICE_ROLE_KEY, ou NEXT_PUBLIC_SUPABASE_ANON_KEY + ADMIN_EMAIL + ADMIN_PASSWORD.");
  const client = createClient(url, anonKey, options);
  const { data: session, error } = await client.auth.signInWithPassword({ email, password });
  if (error) fail(`connexion impossible (${error.message}).`);
  if (session.user.app_metadata?.role !== "admin") fail("ce compte n'a pas le rôle admin.");
  return client;
}

/**
 * Quoi : lit tous les produits non supprimés (titre, visibilité, case « Import USA »), page par page.
 * Input : client — client Supabase en lecture.
 * Output : la liste des produits.
 * Effets de bord : lectures Supabase (select uniquement). Termine le programme avec un message si une lecture échoue ou si la base dépasse MAX_PRODUCTS.
 */
async function readAllProducts(client) {
  const products = [];
  for (let from = 0; from < MAX_PRODUCTS; from += PAGE_SIZE) {
    const { data, error } = await client
      .from("products")
      .select("id, title, visible, is_us_import")
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) fail(`lecture des produits impossible (${error.message}).`);
    products.push(...data);
    if (data.length < PAGE_SIZE) return products;
  }
  return fail(`plus de ${MAX_PRODUCTS} produits : lecture interrompue.`);
}

/**
 * Quoi : affiche le rapport de proposition.
 * Input : products — produits lus ; report — résultat de suggestUsImports.
 * Output : aucun.
 * Effets de bord : écrit sur la sortie standard.
 */
function printReport(products, report) {
  console.log(`${products.length} produit(s) lu(s) — ${report.suggestions.length} proposition(s) « Import USA ».`);
  console.log(`(${report.alreadyMarkedCount} déjà coché(s), ${report.excludedAlcoholCount} alcool(s) écarté(s).) Rien n'a été modifié.\n`);
  for (const suggestion of report.suggestions) {
    const state = suggestion.visible ? "visible" : "masqué";
    console.log(`- ${suggestion.title}  [${state} · ${suggestion.brandName} · ${CONFIDENCE_LABELS[suggestion.confidence]}]`);
  }
  if (report.suggestions.length > 0) console.log("\nÀ valider dans l'administration : Produits > Modifier > case « Import USA ».");
}

const client = await openReadClient();
const products = await readAllProducts(client);
printReport(products, suggestUsImports(products));
