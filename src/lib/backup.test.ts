import { describe, expect, it } from "vitest";
import { BACKUP_VERSION, buildBackup, parseBackup, type BackupData } from "./backup";

const CAT = "11111111-1111-4111-8111-111111111111";
const PRODUCT = "22222222-2222-4222-8222-222222222222";
const PHOTO = "products/33333333-3333-4333-8333-333333333333.webp";

const data: BackupData = {
  categories: [{ id: CAT, name: "Boissons", position: 0 }],
  products: [
    { id: PRODUCT, category_id: CAT, title: "Fanta", description: null, price_cents: null, photo_path: PHOTO, photo_width: 800, photo_height: 600, visible: true, deleted_at: null },
  ],
  settings: [{ key: "tag", value: "Ouvert tard" }],
  hours: [{ day_index: 0, is_closed: false, opens_at: "15h30", closes_at: "00h30" }],
};

describe("sauvegarde : aller-retour", () => {
  it("restitue exactement les données exportées, prix absent compris", () => {
    const text = JSON.stringify(buildBackup(data, new Date("2026-11-11T10:00:00Z")));
    const result = parseBackup(text);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.products[0]?.price_cents).toBeNull();
      expect({ ...result.data, version: undefined, exportedAt: undefined }).toMatchObject(data);
      expect(result.data.version).toBe(BACKUP_VERSION);
    }
  });

  it("accepte une base vide (aucun produit)", () => {
    const empty = { categories: [], products: [], settings: [], hours: [] };
    expect(parseBackup(JSON.stringify(buildBackup(empty, new Date())))).toMatchObject({ ok: true });
  });
});

describe("parseBackup : fichiers invalides", () => {
  const valid = () => JSON.parse(JSON.stringify(buildBackup(data, new Date()))) as Record<string, any>;

  it("rejette un texte qui n'est pas du JSON", () => {
    expect(parseBackup("pas du json")).toMatchObject({ ok: false, error: expect.stringMatching(/JSON/) });
    expect(parseBackup("")).toMatchObject({ ok: false });
  });

  it("rejette une mauvaise version ou un champ manquant", () => {
    expect(parseBackup(JSON.stringify({ ...valid(), version: 99 }))).toMatchObject({ ok: false });
    const missing = valid();
    delete missing.products;
    expect(parseBackup(JSON.stringify(missing))).toMatchObject({ ok: false });
  });

  it("rejette un prix négatif ou non entier", () => {
    const negative = valid();
    negative.products[0].price_cents = -5;
    expect(parseBackup(JSON.stringify(negative))).toMatchObject({ ok: false });
    const decimal = valid();
    decimal.products[0].price_cents = 2.5;
    expect(parseBackup(JSON.stringify(decimal))).toMatchObject({ ok: false });
  });

  it("rejette un chemin de photo qui sort du dossier prévu (traversée de chemin)", () => {
    for (const evil of ["../secret.webp", "products/../../x.webp", "/etc/passwd", "products/x.exe", "https://evil.test/a.webp"]) {
      const bad = valid();
      bad.products[0].photo_path = evil;
      expect(parseBackup(JSON.stringify(bad))).toMatchObject({ ok: false });
    }
  });

  it("rejette un produit rattaché à une catégorie absente de la sauvegarde", () => {
    const orphan = valid();
    orphan.products[0].category_id = "44444444-4444-4444-8444-444444444444";
    expect(parseBackup(JSON.stringify(orphan))).toMatchObject({ ok: false, error: expect.stringMatching(/catégorie/i) });
  });

  it("rejette une valeur de réglage invalide (chemin de photo truqué, texte vide, téléphone trop long)", () => {
    const evilHero = valid();
    evilHero.settings = [{ key: "hero_photo", value: { path: "../../etc/passwd", width: 10, height: 10 } }];
    expect(parseBackup(JSON.stringify(evilHero))).toMatchObject({ ok: false });
    const emptyTag = valid();
    emptyTag.settings = [{ key: "tag", value: "" }];
    expect(parseBackup(JSON.stringify(emptyTag))).toMatchObject({ ok: false });
    const longPhone = valid();
    longPhone.settings = [{ key: "phone_number", value: "0".repeat(31) }];
    expect(parseBackup(JSON.stringify(longPhone))).toMatchObject({ ok: false });
  });

  it("accepte les réglages absents (null) pour téléphone et photo d'accueil", () => {
    const nulls = valid();
    nulls.settings = [{ key: "phone_number", value: null }, { key: "hero_photo", value: null }];
    expect(parseBackup(JSON.stringify(nulls))).toMatchObject({ ok: true });
  });

  it("rejette un réglage hors liste blanche et des doublons d'identifiant", () => {
    const badSetting = valid();
    badSetting.settings[0].key = "evil";
    expect(parseBackup(JSON.stringify(badSetting))).toMatchObject({ ok: false });
    const duplicate = valid();
    duplicate.products.push(duplicate.products[0]);
    expect(parseBackup(JSON.stringify(duplicate))).toMatchObject({ ok: false, error: expect.stringMatching(/doublon/i) });
  });
});
