// Crée (ou met à jour) le compte administrateur commun de Chez Elia.
// Usage (depuis le terminal, jamais dans le navigateur) :
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/create-admin.mjs
// La clé service_role donne tous les droits : ne la mettez jamais dans le dépôt ni dans .env.local de l'application.
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
const MIN_PASSWORD_LENGTH = 12;

function fail(message) {
  console.error(`Erreur : ${message}`);
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  fail("variables SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL et ADMIN_PASSWORD requises.");
}
if (ADMIN_PASSWORD.length < MIN_PASSWORD_LENGTH) fail(`le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.`);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const attributes = { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, email_confirm: true, app_metadata: { role: "admin" } };

const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (listError) fail(`lecture des utilisateurs impossible (${listError.message}).`);
const existing = list.users.find((user) => user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());

const { error } = existing
  ? await supabase.auth.admin.updateUserById(existing.id, attributes)
  : await supabase.auth.admin.createUser(attributes);
if (error) fail(`${existing ? "mise à jour" : "création"} impossible (${error.message}).`);
console.log(`Compte administrateur ${existing ? "mis à jour" : "créé"} : ${ADMIN_EMAIL}`);
