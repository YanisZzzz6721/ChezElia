import { describe, expect, it } from "vitest";
import { parseCategoryForm, parseHoursForm, parseProductForm, parseSettingsForm } from "./adminForms";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}
const UUID = "11111111-1111-4111-8111-111111111111";

describe("parseProductForm", () => {
  it("accepte un produit sans prix (Prix à confirmer) ni catégorie", () => {
    const result = parseProductForm(form({ title: "  Fanta  ", categoryId: "", description: "", price: "" }));
    expect(result).toEqual({ ok: true, data: { title: "Fanta", categoryId: null, description: null, priceCents: null, visible: false } });
  });

  it("distingue prix 0 et prix absent, et lit la visibilité cochée", () => {
    const result = parseProductForm(form({ title: "Offert", categoryId: UUID, description: "Gratuit", price: "0", visible: "on" }));
    expect(result).toMatchObject({ ok: true, data: { priceCents: 0, visible: true, categoryId: UUID, description: "Gratuit" } });
  });

  it("rejette un titre vide, trop long, un prix invalide et une catégorie non valide", () => {
    expect(parseProductForm(form({ title: "   ", price: "" }))).toMatchObject({ ok: false, error: expect.stringMatching(/titre/i) });
    expect(parseProductForm(form({ title: "x".repeat(201), price: "" }))).toMatchObject({ ok: false, error: expect.stringMatching(/titre/i) });
    expect(parseProductForm(form({ title: "A", price: "abc" }))).toMatchObject({ ok: false, error: expect.stringMatching(/Prix invalide/) });
    expect(parseProductForm(form({ title: "A", price: "", categoryId: "pas-un-uuid" }))).toMatchObject({ ok: false, error: expect.stringMatching(/catégorie/i) });
    expect(parseProductForm(form({ title: "A", price: "", description: "d".repeat(501) }))).toMatchObject({ ok: false, error: expect.stringMatching(/description/i) });
  });

  it("rejette un formulaire sans titre du tout", () => {
    expect(parseProductForm(new FormData())).toMatchObject({ ok: false });
  });
});

describe("parseCategoryForm", () => {
  it("nettoie le nom", () => {
    expect(parseCategoryForm(form({ name: "  Boissons " }))).toEqual({ ok: true, data: { name: "Boissons" } });
  });

  it("rejette un nom vide ou trop long", () => {
    expect(parseCategoryForm(form({ name: "  " }))).toMatchObject({ ok: false });
    expect(parseCategoryForm(form({ name: "x".repeat(61) }))).toMatchObject({ ok: false });
  });
});

describe("parseSettingsForm", () => {
  it("accepte des textes valides et un téléphone vide (null)", () => {
    const result = parseSettingsForm(form({ tag: "Ouvert tard", lead: "Bienvenue", phone: "" }));
    expect(result).toEqual({ ok: true, data: { tag: "Ouvert tard", lead: "Bienvenue", phoneNumber: null } });
  });

  it("normalise le téléphone", () => {
    expect(parseSettingsForm(form({ tag: "T", lead: "L", phone: "0388123456" }))).toMatchObject({ ok: true, data: { phoneNumber: "03 88 12 34 56" } });
  });

  it("rejette textes vides, trop longs et téléphone invalide", () => {
    expect(parseSettingsForm(form({ tag: "", lead: "L", phone: "" }))).toMatchObject({ ok: false });
    expect(parseSettingsForm(form({ tag: "T", lead: "l".repeat(301), phone: "" }))).toMatchObject({ ok: false });
    expect(parseSettingsForm(form({ tag: "T", lead: "L", phone: "12" }))).toMatchObject({ ok: false, error: expect.stringMatching(/Numéro invalide/) });
  });
});

describe("parseHoursForm", () => {
  function week(overrides: Record<string, string> = {}): FormData {
    const fields: Record<string, string> = {};
    for (let day = 0; day < 6; day++) {
      fields[`opens_${day}`] = "15h30";
      fields[`closes_${day}`] = "00h30";
    }
    fields["closed_6"] = "on";
    return form({ ...fields, ...overrides });
  }

  it("lit une semaine complète (dimanche fermé)", () => {
    const result = parseHoursForm(week());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(7);
      expect(result.data[0]).toEqual({ day_index: 0, is_closed: false, opens_at: "15h30", closes_at: "00h30" });
      expect(result.data[6]).toEqual({ day_index: 6, is_closed: true, opens_at: null, closes_at: null });
    }
  });

  it("ignore les heures saisies d'un jour coché fermé", () => {
    const result = parseHoursForm(week({ closed_0: "on", opens_0: "n'importe quoi" }));
    expect(result.ok && result.data[0]).toEqual({ day_index: 0, is_closed: true, opens_at: null, closes_at: null });
  });

  it("rejette une heure invalide ou manquante en nommant le jour", () => {
    expect(parseHoursForm(week({ opens_2: "25h00" }))).toMatchObject({ ok: false, error: expect.stringContaining("Mercredi") });
    expect(parseHoursForm(week({ closes_3: "" }))).toMatchObject({ ok: false, error: expect.stringContaining("Jeudi") });
    expect(parseHoursForm(week({ opens_0: "15:30" }))).toMatchObject({ ok: false, error: expect.stringContaining("Lundi") });
  });
});
