import { describe, expect, it } from "vitest";
import {
  parseCategoryForm,
  parseCategoryIntroForm,
  parseFaqEditForm,
  parseFaqForm,
  parseHoursForm,
  parseProductForm,
  parseQuickEditForm,
  parseServiceEditForm,
  parseServiceForm,
  parseSettingsForm,
  parseSocialSettingsForm,
} from "./adminForms";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}
const UUID = "11111111-1111-4111-8111-111111111111";

describe("parseProductForm", () => {
  it("accepte un produit sans prix (Prix à confirmer) ni catégorie", () => {
    const result = parseProductForm(form({ title: "  Fanta  ", categoryId: "", description: "", price: "" }));
    expect(result).toEqual({ ok: true, data: { title: "Fanta", categoryId: null, description: null, priceCents: null, visible: false, isUsImport: false } });
  });

  it("lit la case « Import USA » (cochée = vrai, absente = faux)", () => {
    expect(parseProductForm(form({ title: "Takis", price: "", isUsImport: "on" }))).toMatchObject({ ok: true, data: { isUsImport: true } });
    expect(parseProductForm(form({ title: "Takis", price: "" }))).toMatchObject({ ok: true, data: { isUsImport: false } });
    expect(parseProductForm(form({ title: "Takis", price: "", isUsImport: "oui" }))).toMatchObject({ ok: true, data: { isUsImport: false } });
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

describe("parseCategoryIntroForm", () => {
  it("accepte un texte et le nettoie", () => {
    expect(parseCategoryIntroForm(form({ id: UUID, seoIntro: "  Un rayon.\nDeux phrases.  " }))).toEqual({ ok: true, data: { id: UUID, seoIntro: "Un rayon.\nDeux phrases." } });
  });

  it("un texte vide ou blanc devient null (page du rayon invisible pour Google)", () => {
    expect(parseCategoryIntroForm(form({ id: UUID, seoIntro: "" }))).toEqual({ ok: true, data: { id: UUID, seoIntro: null } });
    expect(parseCategoryIntroForm(form({ id: UUID, seoIntro: "   \n  " }))).toEqual({ ok: true, data: { id: UUID, seoIntro: null } });
    expect(parseCategoryIntroForm(form({ id: UUID }))).toEqual({ ok: true, data: { id: UUID, seoIntro: null } });
  });

  it("accepte exactement 1200 caractères et refuse 1201", () => {
    expect(parseCategoryIntroForm(form({ id: UUID, seoIntro: "a".repeat(1200) }))).toMatchObject({ ok: true });
    expect(parseCategoryIntroForm(form({ id: UUID, seoIntro: "a".repeat(1201) }))).toMatchObject({ ok: false, error: expect.stringMatching(/1200/) });
  });

  it("refuse un identifiant de catégorie invalide ou absent", () => {
    expect(parseCategoryIntroForm(form({ id: "pas-un-uuid", seoIntro: "x" }))).toMatchObject({ ok: false, error: expect.stringMatching(/catégorie/i) });
    expect(parseCategoryIntroForm(new FormData())).toMatchObject({ ok: false });
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

describe("parseQuickEditForm", () => {
  it("accepte un titre et un prix, et garde le prix vide = « Prix à confirmer »", () => {
    expect(parseQuickEditForm(form({ id: UUID, title: " Fanta Orange ", price: "1,5" }))).toEqual({
      ok: true, data: { id: UUID, title: "Fanta Orange", priceCents: 150 },
    });
    expect(parseQuickEditForm(form({ id: UUID, title: "Fanta", price: "" }))).toEqual({ ok: true, data: { id: UUID, title: "Fanta", priceCents: null } });
  });

  it("distingue le prix 0 du prix absent", () => {
    expect(parseQuickEditForm(form({ id: UUID, title: "Offert", price: "0" }))).toMatchObject({ ok: true, data: { priceCents: 0 } });
  });

  it("rejette un identifiant invalide, un titre vide ou un prix invalide", () => {
    expect(parseQuickEditForm(form({ id: "x", title: "A", price: "" }))).toMatchObject({ ok: false, error: expect.stringMatching(/identifiant/i) });
    expect(parseQuickEditForm(form({ id: UUID, title: "  ", price: "" }))).toMatchObject({ ok: false, error: expect.stringMatching(/titre/i) });
    expect(parseQuickEditForm(form({ id: UUID, title: "A", price: "abc" }))).toMatchObject({ ok: false, error: expect.stringMatching(/Prix invalide/) });
  });
});

describe("parseFaqForm", () => {
  it("nettoie la question et conserve les retours à la ligne de la réponse", () => {
    const result = parseFaqForm(form({ question: "  Êtes-vous ouverts le dimanche ? ", answer: "  Ligne 1\nLigne 2  " }));
    expect(result).toEqual({ ok: true, data: { question: "Êtes-vous ouverts le dimanche ?", answer: "Ligne 1\nLigne 2" } });
  });

  it("rejette une question ou une réponse vide (espaces seuls compris)", () => {
    expect(parseFaqForm(form({ question: "  ", answer: "Oui" }))).toMatchObject({ ok: false, error: expect.stringMatching(/question/i) });
    expect(parseFaqForm(form({ question: "Q ?", answer: " \n " }))).toMatchObject({ ok: false, error: expect.stringMatching(/réponse/i) });
  });

  it("rejette une question de plus de 200 caractères et une réponse de plus de 1000, accepte les limites exactes", () => {
    expect(parseFaqForm(form({ question: "q".repeat(201), answer: "Oui" }))).toMatchObject({ ok: false });
    expect(parseFaqForm(form({ question: "Q", answer: "a".repeat(1001) }))).toMatchObject({ ok: false });
    expect(parseFaqForm(form({ question: "q".repeat(200), answer: "a".repeat(1000) }))).toMatchObject({ ok: true });
  });

  it("traite un champ absent comme vide (requête forgée)", () => {
    expect(parseFaqForm(new FormData())).toMatchObject({ ok: false });
  });
});

describe("parseFaqEditForm", () => {
  it("exige un identifiant valide en plus des champs", () => {
    expect(parseFaqEditForm(form({ id: UUID, question: "Q ?", answer: "R" }))).toEqual({ ok: true, data: { id: UUID, question: "Q ?", answer: "R" } });
    expect(parseFaqEditForm(form({ id: "pas-un-uuid", question: "Q ?", answer: "R" }))).toMatchObject({ ok: false });
    expect(parseFaqEditForm(form({ question: "Q ?", answer: "R" }))).toMatchObject({ ok: false });
  });
});

describe("parseServiceForm", () => {
  const valid = { title: "  Sandwichs frais ", body: " Des sandwichs. ", highlight: " 2,50 € ", icon: "sandwich", visible: "on" };

  it("nettoie les champs et lit la visibilité cochée", () => {
    expect(parseServiceForm(form(valid))).toEqual({
      ok: true,
      data: { title: "Sandwichs frais", body: "Des sandwichs.", highlight: "2,50 €", icon: "sandwich", visible: true },
    });
  });

  it("mention vide ou en espaces : null ; case décochée : masqué", () => {
    expect(parseServiceForm(form({ ...valid, highlight: "  ", visible: "" }))).toMatchObject({ ok: true, data: { highlight: null, visible: false } });
    const withoutHighlight = form({ title: "T", body: "B", icon: "parcel" });
    expect(parseServiceForm(withoutHighlight)).toMatchObject({ ok: true, data: { highlight: null, visible: false } });
  });

  it("titre : 0 (ou espaces) refusé, 1 et 60 acceptés, 61 refusé", () => {
    expect(parseServiceForm(form({ ...valid, title: "" }))).toMatchObject({ ok: false, error: expect.stringMatching(/titre/i) });
    expect(parseServiceForm(form({ ...valid, title: "   " }))).toMatchObject({ ok: false });
    expect(parseServiceForm(form({ ...valid, title: "t" }))).toMatchObject({ ok: true });
    expect(parseServiceForm(form({ ...valid, title: "t".repeat(60) }))).toMatchObject({ ok: true });
    expect(parseServiceForm(form({ ...valid, title: "t".repeat(61) }))).toMatchObject({ ok: false, error: expect.stringMatching(/60/) });
  });

  it("texte : 0 refusé, 1 et 300 acceptés, 301 refusé", () => {
    expect(parseServiceForm(form({ ...valid, body: "" }))).toMatchObject({ ok: false, error: expect.stringMatching(/texte/i) });
    expect(parseServiceForm(form({ ...valid, body: "b" }))).toMatchObject({ ok: true });
    expect(parseServiceForm(form({ ...valid, body: "b".repeat(300) }))).toMatchObject({ ok: true });
    expect(parseServiceForm(form({ ...valid, body: "b".repeat(301) }))).toMatchObject({ ok: false, error: expect.stringMatching(/300/) });
  });

  it("mention : 1 et 30 acceptés, 31 refusé", () => {
    expect(parseServiceForm(form({ ...valid, highlight: "h" }))).toMatchObject({ ok: true });
    expect(parseServiceForm(form({ ...valid, highlight: "h".repeat(30) }))).toMatchObject({ ok: true });
    expect(parseServiceForm(form({ ...valid, highlight: "h".repeat(31) }))).toMatchObject({ ok: false, error: expect.stringMatching(/30/) });
  });

  it("refuse une icône inconnue ou absente", () => {
    expect(parseServiceForm(form({ ...valid, icon: "rocket" }))).toMatchObject({ ok: false, error: expect.stringMatching(/icône/i) });
    expect(parseServiceForm(form({ title: "T", body: "B" }))).toMatchObject({ ok: false });
  });

  it("refuse un formulaire vide", () => {
    expect(parseServiceForm(new FormData())).toMatchObject({ ok: false });
  });
});

describe("parseServiceEditForm", () => {
  it("ajoute l'identifiant validé", () => {
    const fields = { id: UUID, title: "T", body: "B", highlight: "", icon: "vinted", visible: "on" };
    expect(parseServiceEditForm(form(fields))).toEqual({ ok: true, data: { id: UUID, title: "T", body: "B", highlight: null, icon: "vinted", visible: true } });
  });

  it("refuse un identifiant invalide ou absent", () => {
    const fields = { title: "T", body: "B", highlight: "", icon: "vinted" };
    expect(parseServiceEditForm(form({ ...fields, id: "pas-un-uuid" }))).toMatchObject({ ok: false, error: expect.stringMatching(/identifiant/i) });
    expect(parseServiceEditForm(form(fields))).toMatchObject({ ok: false });
  });
});

describe("parseSocialSettingsForm", () => {
  it("lit les trois adresses, normalisées ; les champs vides valent null", () => {
    const result = parseSocialSettingsForm(form({ instagram: " https://www.instagram.com/x/ ", tiktok: "", snapchat: "https://www.snapchat.com/add/x" }));
    expect(result).toEqual({ ok: true, data: { instagram: "https://www.instagram.com/x/", tiktok: null, snapchat: "https://www.snapchat.com/add/x" } });
  });

  it("accepte un formulaire entièrement vide (tous les réseaux masqués)", () => {
    expect(parseSocialSettingsForm(new FormData())).toEqual({ ok: true, data: { instagram: null, tiktok: null, snapchat: null } });
  });

  it("refuse une adresse invalide en nommant le réseau fautif", () => {
    expect(parseSocialSettingsForm(form({ tiktok: "javascript:alert(1)" }))).toMatchObject({ ok: false, error: expect.stringMatching(/TikTok/) });
    expect(parseSocialSettingsForm(form({ instagram: "https://instagram.com.evil.fr/x" }))).toMatchObject({ ok: false, error: expect.stringMatching(/Instagram/) });
  });
});
