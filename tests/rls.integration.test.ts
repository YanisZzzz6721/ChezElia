import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const { NEXT_PUBLIC_SUPABASE_URL: URL_, NEXT_PUBLIC_SUPABASE_ANON_KEY: ANON, SUPABASE_SERVICE_ROLE_KEY: SERVICE } = process.env;
if (!URL_ || !ANON || !SERVICE) {
  throw new Error("Variables requises : NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (Supabase local).");
}

const options = { auth: { persistSession: false, autoRefreshToken: false } };
const service = createClient(URL_, SERVICE, options);
const anon = createClient(URL_, ANON, options);

const PASSWORD = "mot-de-passe-de-test-long-1";
const stamp = Date.now();
const adminEmail = `rls-admin-${stamp}@test.local`;
const strangerEmail = `rls-stranger-${stamp}@test.local`;
const createdProductIds: string[] = [];
const createdUserIds: string[] = [];
let admin: SupabaseClient;
let stranger: SupabaseClient;
let visibleId = "";
let hiddenId = "";
let trashedId = "";

async function signIn(email: string): Promise<SupabaseClient> {
  const client = createClient(URL_!, ANON!, options);
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`Connexion de test impossible (${email}) : ${error.message}`);
  return client;
}

beforeAll(async () => {
  for (const [email, appMetadata] of [[adminEmail, { role: "admin" }], [strangerEmail, {}]] as const) {
    const { data, error } = await service.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true, app_metadata: appMetadata });
    if (error) throw new Error(`Création de l'utilisateur de test échouée : ${error.message}`);
    createdUserIds.push(data.user.id);
  }
  admin = await signIn(adminEmail);
  stranger = await signIn(strangerEmail);

  const rows = [
    { title: "TEST visible", visible: true, deleted_at: null },
    { title: "TEST masqué", visible: false, deleted_at: null },
    { title: "TEST corbeille", visible: true, deleted_at: new Date().toISOString() },
  ];
  const { data, error } = await service.from("products").insert(rows).select("id, title");
  if (error) throw new Error(`Préparation des données de test échouée : ${error.message}`);
  for (const row of data) createdProductIds.push(row.id);
  visibleId = data.find((r) => r.title === "TEST visible")!.id;
  hiddenId = data.find((r) => r.title === "TEST masqué")!.id;
  trashedId = data.find((r) => r.title === "TEST corbeille")!.id;
});

afterAll(async () => {
  await service.from("products").delete().in("id", createdProductIds);
  await service.from("products").delete().like("title", "TEST%");
  for (const id of createdUserIds) await service.auth.admin.deleteUser(id);
});

describe("lecture publique (anonyme)", () => {
  it("ne voit que les produits visibles et hors corbeille", async () => {
    const { data, error } = await anon.from("products").select("id").in("id", createdProductIds);
    expect(error).toBeNull();
    expect(data?.map((r) => r.id)).toEqual([visibleId]);
  });

  it("peut lire catégories, horaires et réglages", async () => {
    for (const table of ["categories", "opening_hours", "site_settings"]) {
      const { error } = await anon.from(table).select("*").limit(1);
      expect(error, table).toBeNull();
    }
  });

  it("ne peut pas lire le journal des modifications", async () => {
    const { data, error } = await anon.from("audit_log").select("*").limit(1);
    expect(error !== null || (data ?? []).length === 0).toBe(true);
  });
});

describe("écriture refusée à un anonyme (test réel, par requête directe)", () => {
  it("refuse l'insertion, la modification et la suppression de produits", async () => {
    expect((await anon.from("products").insert({ title: "TEST pirate" })).error).not.toBeNull();
    const update = await anon.from("products").update({ title: "TEST piraté" }).eq("id", visibleId).select();
    expect(update.error !== null || (update.data ?? []).length === 0).toBe(true);
    const del = await anon.from("products").delete().eq("id", visibleId).select();
    expect(del.error !== null || (del.data ?? []).length === 0).toBe(true);
    const { data } = await service.from("products").select("title").eq("id", visibleId).single();
    expect(data?.title).toBe("TEST visible");
  });

  it("refuse l'écriture des catégories, horaires et réglages", async () => {
    expect((await anon.from("categories").insert({ name: "TEST pirate", position: 99 })).error).not.toBeNull();
    const hours = await anon.from("opening_hours").update({ is_closed: true }).eq("day_index", 0).select();
    expect(hours.error !== null || (hours.data ?? []).length === 0).toBe(true);
    expect((await anon.from("site_settings").upsert({ key: "lead", value: "piraté" })).error).not.toBeNull();
  });

  it("refuse l'envoi de fichiers dans le stockage", async () => {
    const { error } = await anon.storage.from("photos").upload(`products/${crypto.randomUUID()}.webp`, new Uint8Array([1, 2, 3]), { contentType: "image/webp" });
    expect(error).not.toBeNull();
  });
});

describe("utilisateur connecté sans rôle admin", () => {
  it("n'a aucun droit d'écriture ni de lecture des produits masqués", async () => {
    expect((await stranger.from("products").insert({ title: "TEST étranger" })).error).not.toBeNull();
    const { data } = await stranger.from("products").select("id").in("id", createdProductIds);
    expect(data?.map((r) => r.id)).toEqual([visibleId]);
    const update = await stranger.from("products").update({ title: "TEST x" }).eq("id", visibleId).select();
    expect(update.error !== null || (update.data ?? []).length === 0).toBe(true);
  });

  it("ne peut pas se donner le rôle admin (app_metadata non modifiable par l'utilisateur)", async () => {
    await stranger.auth.updateUser({ data: { role: "admin" } });
    expect((await stranger.from("products").insert({ title: "TEST escalade" })).error).not.toBeNull();
  });
});

describe("administrateur", () => {
  it("voit tout, y compris masqués et corbeille", async () => {
    const { data } = await admin.from("products").select("id").in("id", createdProductIds);
    expect(new Set(data?.map((r) => r.id))).toEqual(new Set([visibleId, hiddenId, trashedId]));
  });

  it("peut écrire, et la modification est journalisée avec son identifiant", async () => {
    const { error } = await admin.from("products").update({ price_cents: 250 }).eq("id", visibleId);
    expect(error).toBeNull();
    const { data } = await service.from("audit_log").select("action, user_id, new_value").eq("row_id", visibleId).eq("action", "UPDATE");
    expect(data?.length).toBeGreaterThan(0);
    expect(data?.[0]?.user_id).toBe(createdUserIds[0]);
    expect((data?.[0]?.new_value as { price_cents: number }).price_cents).toBe(250);
  });

  it("distingue prix absent (NULL) et prix nul (0) en base, et refuse un prix négatif", async () => {
    expect((await admin.from("products").update({ price_cents: 0 }).eq("id", visibleId)).error).toBeNull();
    expect((await admin.from("products").update({ price_cents: null }).eq("id", visibleId)).error).toBeNull();
    const { data } = await admin.from("products").select("price_cents").eq("id", visibleId).single();
    expect(data?.price_cents).toBeNull();
    expect((await admin.from("products").update({ price_cents: -1 }).eq("id", visibleId)).error).not.toBeNull();
  });

  it("accepte une valeur de réglage absente (NULL) : pas de téléphone, pas de photo d'accueil", async () => {
    expect((await admin.from("site_settings").upsert({ key: "phone_number", value: null }, { onConflict: "key" })).error).toBeNull();
    const { data } = await admin.from("site_settings").select("value").eq("key", "phone_number").single();
    expect(data?.value).toBeNull();
  });

  it("refuse un réglage hors liste blanche et une heure invalide", async () => {
    expect((await admin.from("site_settings").insert({ key: "evil", value: "x" })).error).not.toBeNull();
    expect((await admin.from("opening_hours").update({ opens_at: "25h99" }).eq("day_index", 0)).error).not.toBeNull();
  });

  it("peut envoyer une image WebP mais pas un autre type de fichier", async () => {
    const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
    const okPath = `products/${crypto.randomUUID()}.webp`;
    const ok = await admin.storage.from("photos").upload(okPath, webp, { contentType: "image/webp" });
    expect(ok.error).toBeNull();
    const bad = await admin.storage.from("photos").upload(`products/${crypto.randomUUID()}.exe`, new Uint8Array([0x4d, 0x5a]), { contentType: "application/x-msdownload" });
    expect(bad.error).not.toBeNull();
    const removed = await admin.storage.from("photos").remove([okPath]);
    expect(removed.error).toBeNull();
    expect(removed.data).toHaveLength(1); // 0 = suppression silencieusement refusée par la RLS
  });
});

describe("questions fréquentes (faq_items)", () => {
  const createdFaqIds: string[] = [];

  afterAll(async () => {
    await service.from("faq_items").delete().like("question", "TEST%");
  });

  it("anonyme : lecture autorisée, écriture refusée", async () => {
    const { data: inserted, error: insertError } = await admin.from("faq_items").insert({ question: "TEST lisible ?", answer: "Oui.", position: 999 }).select("id").single();
    expect(insertError).toBeNull();
    createdFaqIds.push(inserted!.id);

    const { data, error } = await anon.from("faq_items").select("id").eq("id", inserted!.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);

    expect((await anon.from("faq_items").insert({ question: "TEST pirate ?", answer: "x", position: 0 })).error).not.toBeNull();
    const update = await anon.from("faq_items").update({ answer: "piraté" }).eq("id", inserted!.id).select();
    expect(update.error !== null || (update.data ?? []).length === 0).toBe(true);
    const del = await anon.from("faq_items").delete().eq("id", inserted!.id).select();
    expect(del.error !== null || (del.data ?? []).length === 0).toBe(true);
    const { data: still } = await service.from("faq_items").select("answer").eq("id", inserted!.id).single();
    expect(still?.answer).toBe("Oui.");
  });

  it("utilisateur connecté sans rôle admin : aucune écriture", async () => {
    expect((await stranger.from("faq_items").insert({ question: "TEST étranger ?", answer: "x", position: 0 })).error).not.toBeNull();
    const update = await stranger.from("faq_items").update({ answer: "piraté" }).eq("id", createdFaqIds[0]!).select();
    expect(update.error !== null || (update.data ?? []).length === 0).toBe(true);
  });

  it("refuse une question vide ou trop longue, et journalise la modification de l'administrateur", async () => {
    expect((await admin.from("faq_items").insert({ question: "   ", answer: "x", position: 0 })).error).not.toBeNull();
    expect((await admin.from("faq_items").insert({ question: "TEST long", answer: "a".repeat(1001), position: 0 })).error).not.toBeNull();
    expect((await admin.from("faq_items").update({ answer: "Oui, modifié." }).eq("id", createdFaqIds[0]!)).error).toBeNull();
    const { data } = await service.from("audit_log").select("user_id").eq("table_name", "faq_items").eq("row_id", createdFaqIds[0]!).eq("action", "UPDATE");
    expect(data?.[0]?.user_id).toBe(createdUserIds[0]);
  });
});

describe("services (services)", () => {
  let visibleServiceId = "";
  let hiddenServiceId = "";

  beforeAll(async () => {
    const rows = [
      { title: "TEST service visible", body: "Texte.", icon: "sandwich", position: 900, visible: true },
      { title: "TEST service masqué", body: "Texte.", icon: "parcel", position: 901, visible: false },
    ];
    const { data, error } = await admin.from("services").insert(rows).select("id, title");
    if (error) throw new Error(`Préparation des services de test échouée : ${error.message}`);
    visibleServiceId = data.find((r) => r.title === "TEST service visible")!.id;
    hiddenServiceId = data.find((r) => r.title === "TEST service masqué")!.id;
  });

  afterAll(async () => {
    await service.from("services").delete().like("title", "TEST%");
  });

  it("anonyme : lit les services visibles mais PAS les masqués", async () => {
    const { data, error } = await anon.from("services").select("id").in("id", [visibleServiceId, hiddenServiceId]);
    expect(error).toBeNull();
    expect(data?.map((r) => r.id)).toEqual([visibleServiceId]);
  });

  it("utilisateur connecté sans rôle admin : lit les services visibles (pas les masqués), n'écrit rien", async () => {
    const { data } = await stranger.from("services").select("id").in("id", [visibleServiceId, hiddenServiceId]);
    expect(data?.map((r) => r.id)).toEqual([visibleServiceId]);
    const newService = { title: "TEST étranger", body: "x", icon: "sandwich", position: 0 };
    expect((await stranger.from("services").insert(newService)).error).not.toBeNull();
    const update = await stranger.from("services").update({ body: "piraté" }).eq("id", visibleServiceId).select();
    expect(update.error !== null || (update.data ?? []).length === 0).toBe(true);
    const del = await stranger.from("services").delete().eq("id", visibleServiceId).select();
    expect(del.error !== null || (del.data ?? []).length === 0).toBe(true);
  });

  it("anonyme : aucune écriture (ajout, modification, suppression)", async () => {
    expect((await anon.from("services").insert({ title: "TEST pirate", body: "x", icon: "sandwich", position: 0 })).error).not.toBeNull();
    const update = await anon.from("services").update({ body: "piraté" }).eq("id", visibleServiceId).select();
    expect(update.error !== null || (update.data ?? []).length === 0).toBe(true);
    const del = await anon.from("services").delete().eq("id", visibleServiceId).select();
    expect(del.error !== null || (del.data ?? []).length === 0).toBe(true);
    const { data: still } = await service.from("services").select("body").eq("id", visibleServiceId).single();
    expect(still?.body).toBe("Texte.");
  });

  it("administrateur : voit tout, y compris les masqués, et peut modifier ; la modification est journalisée", async () => {
    const { data } = await admin.from("services").select("id").in("id", [visibleServiceId, hiddenServiceId]);
    expect(new Set(data?.map((r) => r.id))).toEqual(new Set([visibleServiceId, hiddenServiceId]));
    expect((await admin.from("services").update({ highlight: "2,50 €" }).eq("id", visibleServiceId)).error).toBeNull();
    const { data: audit } = await service.from("audit_log").select("user_id").eq("table_name", "services").eq("row_id", visibleServiceId).eq("action", "UPDATE");
    expect(audit?.[0]?.user_id).toBe(createdUserIds[0]);
  });

  it("administrateur : peut supprimer un service", async () => {
    const { data: created } = await admin.from("services").insert({ title: "TEST à supprimer", body: "x", icon: "vinted", position: 902 }).select("id").single();
    const del = await admin.from("services").delete().eq("id", created!.id).select();
    expect(del.error).toBeNull();
    expect(del.data).toHaveLength(1);
  });

  it("la base refuse un titre vide, un texte vide, une mention vide ou trop longue, une icône inconnue", async () => {
    const valid = { title: "TEST contrainte", body: "Texte.", icon: "sandwich", position: 903 };
    expect((await admin.from("services").insert({ ...valid, title: "   " })).error).not.toBeNull();
    expect((await admin.from("services").insert({ ...valid, title: "t".repeat(61) })).error).not.toBeNull();
    expect((await admin.from("services").insert({ ...valid, body: "" })).error).not.toBeNull();
    expect((await admin.from("services").insert({ ...valid, body: "b".repeat(301) })).error).not.toBeNull();
    expect((await admin.from("services").insert({ ...valid, highlight: "  " })).error).not.toBeNull();
    expect((await admin.from("services").insert({ ...valid, highlight: "h".repeat(31) })).error).not.toBeNull();
    expect((await admin.from("services").insert({ ...valid, icon: "rocket" })).error).not.toBeNull();
    // Le titre commence par « TEST » (60 caractères au total) : le nettoyage `like("TEST%")` de afterAll supprime ainsi cette ligne.
    const maxValues = { ...valid, title: `TEST${"t".repeat(56)}`, body: "b".repeat(300), highlight: "h".repeat(30) };
    expect((await admin.from("services").insert(maxValues)).error).toBeNull();
  });
});

describe("réseaux sociaux (site_settings)", () => {
  const socialKeys = ["social_instagram", "social_tiktok", "social_snapchat"];
  let previousRows: { key: string; value: unknown }[] = [];

  beforeAll(async () => {
    const { data } = await service.from("site_settings").select("key, value").in("key", socialKeys);
    previousRows = data ?? [];
  });

  afterAll(async () => {
    await service.from("site_settings").delete().in("key", socialKeys);
    if (previousRows.length > 0) await service.from("site_settings").insert(previousRows);
  });

  it("l'administrateur peut enregistrer une adresse valide et la vider (null)", async () => {
    const save = (key: string, value: string | null) => admin.from("site_settings").upsert({ key, value }, { onConflict: "key" });
    expect((await save("social_instagram", "https://www.instagram.com/chez.elia/")).error).toBeNull();
    expect((await save("social_tiktok", "https://www.tiktok.com/@chez.elia")).error).toBeNull();
    expect((await save("social_snapchat", "https://www.snapchat.com/add/chezelia")).error).toBeNull();
    expect((await save("social_instagram", null)).error).toBeNull();
    const { data } = await anon.from("site_settings").select("value").eq("key", "social_tiktok").single();
    expect(data?.value).toBe("https://www.tiktok.com/@chez.elia");
  });

  it("la base refuse javascript:, http:, un autre domaine, un domaine piège et une valeur qui n'est pas un texte", async () => {
    const save = (key: string, value: unknown) => admin.from("site_settings").upsert({ key, value }, { onConflict: "key" });
    expect((await save("social_instagram", "javascript:alert(1)")).error).not.toBeNull();
    expect((await save("social_instagram", "http://www.instagram.com/x")).error).not.toBeNull();
    expect((await save("social_instagram", "https://www.tiktok.com/@x")).error).not.toBeNull();
    expect((await save("social_instagram", "https://instagram.com.evil.fr/x")).error).not.toBeNull();
    expect((await save("social_instagram", "https://user:pass@www.instagram.com/x")).error).not.toBeNull();
    expect((await save("social_instagram", 42)).error).not.toBeNull();
  });

  it("les quatre clés d'origine restent acceptées, une clé inconnue reste refusée", async () => {
    expect((await admin.from("site_settings").upsert({ key: "phone_number", value: null }, { onConflict: "key" })).error).toBeNull();
    expect((await admin.from("site_settings").insert({ key: "social_facebook", value: "https://www.facebook.com/x" })).error).not.toBeNull();
  });

  it("un utilisateur sans rôle admin ne peut pas modifier une adresse sociale", async () => {
    const update = await stranger.from("site_settings").upsert({ key: "social_instagram", value: "https://www.instagram.com/pirate/" }, { onConflict: "key" });
    expect(update.error).not.toBeNull();
  });
});
