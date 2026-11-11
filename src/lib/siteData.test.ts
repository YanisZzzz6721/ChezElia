import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  mapCategoryRows,
  mapHoursRows,
  mapProductRow,
  mapSettingRows,
  type HoursRow,
  type ProductRow,
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
