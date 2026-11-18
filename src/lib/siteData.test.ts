import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SETTINGS,
  mapCategoryRows,
  mapFaqRows,
  mapHoursRows,
  mapProductRow,
  mapServiceRows,
  mapSettingRows,
  mapSocialLinks,
  type HoursRow,
  type ProductRow,
  type ServiceRow,
} from "./siteData";

const toUrl = (path: string) => `https://cdn.test/${path}`;
const baseRow: ProductRow = {
  id: "p1", category_id: null, title: "Fanta", description: null, price_cents: null,
  photo_path: null, photo_width: null, photo_height: null, visible: true, deleted_at: null,
};

describe("mapProductRow", () => {
  it("garde un prix absent à null et un prix nul à 0", () => {
    expect(mapProductRow(baseRow, toUrl).priceInCents).toBeNull();
    expect(mapProductRow({ ...baseRow, price_cents: 0 }, toUrl).priceInCents).toBe(0);
  });

  it("n'expose pas de photo ni de description quand elles sont absentes", () => {
    const product = mapProductRow(baseRow, toUrl);
    expect(product).not.toHaveProperty("photo");
    expect(product).not.toHaveProperty("description");
  });

  it("construit l'URL publique de la photo avec ses dimensions", () => {
    const product = mapProductRow({ ...baseRow, photo_path: "products/a.webp", photo_width: 800, photo_height: 600 }, toUrl);
    expect(product.photo).toEqual({ url: "https://cdn.test/products/a.webp", width: 800, height: 600 });
  });
});

describe("mapCategoryRows", () => {
  it("trie par position", () => {
    const rows = [{ id: "b", name: "B", position: 2 }, { id: "a", name: "A", position: 1 }];
    expect(mapCategoryRows(rows).map((c) => c.id)).toEqual(["a", "b"]);
  });

  it("accepte une liste vide", () => {
    expect(mapCategoryRows([])).toEqual([]);
  });
});

describe("mapHoursRows", () => {
  const week: HoursRow[] = [0, 1, 2, 3, 4, 5].map((day_index) => ({ day_index, is_closed: false, opens_at: "15h30", closes_at: "00h30" }));
  week.push({ day_index: 6, is_closed: true, opens_at: null, closes_at: null });

  it("renvoie les 7 jours dans l'ordre, même si les lignes arrivent mélangées", () => {
    const days = mapHoursRows([...week].reverse());
    expect(days.map((d) => d.day)).toEqual(["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]);
    expect(days[6]).toEqual({ day: "Dimanche", isClosed: true });
  });

  it("rejette un jour manquant ou en double", () => {
    expect(() => mapHoursRows(week.slice(0, 6))).toThrow(/Dimanche/);
    expect(() => mapHoursRows([...week, week[0] as HoursRow])).toThrow(/Lundi/);
  });

  it("rejette un jour ouvert sans heures", () => {
    const broken = week.map((r) => (r.day_index === 2 ? { ...r, closes_at: null } : r));
    expect(() => mapHoursRows(broken)).toThrow(/Mercredi/);
  });
});

describe("mapSettingRows", () => {
  it("renvoie les valeurs par défaut sans ligne", () => {
    expect(mapSettingRows([])).toEqual(DEFAULT_SETTINGS);
  });

  it("applique les valeurs stockées", () => {
    const settings = mapSettingRows([
      { key: "tag", value: "Nouveau" },
      { key: "phone_number", value: "03 88 12 34 56" },
      { key: "hero_photo", value: { path: "site/a.webp", width: 900, height: 1200 } },
    ]);
    expect(settings).toMatchObject({ tag: "Nouveau", phoneNumber: "03 88 12 34 56", heroPhoto: { path: "site/a.webp" } });
  });

  it("rejette une clé inconnue et une valeur invalide", () => {
    expect(() => mapSettingRows([{ key: "evil", value: 1 }])).toThrow(/inconnu/);
    expect(() => mapSettingRows([{ key: "tag", value: "" }])).toThrow(/tag/);
    expect(() => mapSettingRows([{ key: "hero_photo", value: { path: "" } }])).toThrow(/hero_photo/);
  });
});

describe("mapFaqRows", () => {
  it("trie par position et ne garde que question et réponse utiles à l'affichage", () => {
    const rows = [
      { id: "b", question: "Deuxième ?", answer: "R2", position: 1 },
      { id: "a", question: "Première ?", answer: "R1", position: 0 },
    ];
    expect(mapFaqRows(rows)).toEqual([
      { id: "a", question: "Première ?", answer: "R1" },
      { id: "b", question: "Deuxième ?", answer: "R2" },
    ]);
  });

  it("accepte une liste vide (la section n'est alors pas affichée)", () => {
    expect(mapFaqRows([])).toEqual([]);
  });
});

const serviceRow = (overrides: Partial<ServiceRow> = {}): ServiceRow => ({
  id: "s1", title: "Sandwichs frais", body: "Des sandwichs.", highlight: "2,50 €", icon: "sandwich", position: 0, visible: true, ...overrides,
});

describe("mapServiceRows", () => {
  it("trie par position et renvoie les champs utiles à l'affichage", () => {
    const rows = [serviceRow({ id: "b", title: "Vinted", icon: "vinted", highlight: null, position: 1 }), serviceRow({ id: "a", position: 0 })];
    expect(mapServiceRows(rows)).toEqual([
      { id: "a", title: "Sandwichs frais", body: "Des sandwichs.", highlight: "2,50 €", icon: "sandwich", visible: true },
      { id: "b", title: "Vinted", body: "Des sandwichs.", highlight: null, icon: "vinted", visible: true },
    ]);
  });

  it("accepte une liste vide (la section n'est alors pas affichée)", () => {
    expect(mapServiceRows([])).toEqual([]);
  });

  it("ignore les lignes invalides en les signalant avec leur identifiant, sans toucher aux bonnes", () => {
    const reportInvalidRow = vi.fn();
    const rows = [
      serviceRow({ id: "ok", position: 2 }),
      serviceRow({ id: "bad-icon", icon: "rocket", position: 0 }),
      serviceRow({ id: "bad-title", title: "  ", position: 1 }),
      serviceRow({ id: "bad-highlight", highlight: "x".repeat(31), position: 3 }),
      serviceRow({ id: "bad-body", body: "x".repeat(301), position: 4 }),
    ];
    expect(mapServiceRows(rows, reportInvalidRow).map((s) => s.id)).toEqual(["ok"]);
    expect(reportInvalidRow.mock.calls.map(([row]) => row.id)).toEqual(["bad-icon", "bad-title", "bad-highlight", "bad-body"]);
    expect(reportInvalidRow.mock.calls[0]?.[1]).toEqual(expect.any(String));
  });

  it("signale par défaut avec console.error (jamais en silence)", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(mapServiceRows([serviceRow({ id: "bad", icon: "rocket" })])).toEqual([]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("bad"));
    spy.mockRestore();
  });

  it("accepte les valeurs aux bornes (titre 60, texte 300, mention 30)", () => {
    const row = serviceRow({ title: "t".repeat(60), body: "b".repeat(300), highlight: "h".repeat(30) });
    expect(mapServiceRows([row])).toHaveLength(1);
  });
});

describe("mapSocialLinks", () => {
  it("renvoie les réseaux valides dans l'ordre Instagram, TikTok, Snapchat", () => {
    const rows = [
      { key: "social_snapchat", value: "https://www.snapchat.com/add/x" },
      { key: "social_instagram", value: "https://www.instagram.com/x/" },
    ];
    expect(mapSocialLinks(rows)).toEqual([
      { network: "instagram", label: "Instagram", url: "https://www.instagram.com/x/" },
      { network: "snapchat", label: "Snapchat", url: "https://www.snapchat.com/add/x" },
    ]);
  });

  it("ignore les valeurs absentes (null) sans rien signaler", () => {
    const reportInvalid = vi.fn();
    expect(mapSocialLinks([{ key: "social_tiktok", value: null }], reportInvalid)).toEqual([]);
    expect(reportInvalid).not.toHaveBeenCalled();
  });

  it("ignore et signale une valeur invalide en base (mauvais domaine, javascript:, pas un texte)", () => {
    const reportInvalid = vi.fn();
    const rows = [
      { key: "social_instagram", value: "javascript:alert(1)" },
      { key: "social_tiktok", value: "https://instagram.com.evil.fr/x" },
      { key: "social_snapchat", value: 42 },
    ];
    expect(mapSocialLinks(rows, reportInvalid)).toEqual([]);
    expect(reportInvalid).toHaveBeenCalledTimes(3);
    expect(reportInvalid.mock.calls[0]?.[0]).toBe("social_instagram");
  });

  it("n'examine que les clés de réseaux sociaux", () => {
    expect(mapSocialLinks([{ key: "tag", value: "Bonjour" }])).toEqual([]);
  });
});

describe("mapSettingRows et réseaux sociaux", () => {
  it("laisse passer les clés de réseaux sociaux (traitées par mapSocialLinks) sans modifier les réglages", () => {
    expect(mapSettingRows([{ key: "social_instagram", value: "https://www.instagram.com/x/" }])).toEqual(DEFAULT_SETTINGS);
  });
});
