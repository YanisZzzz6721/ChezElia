import { beforeEach, describe, expect, it, vi } from "vitest";

/** Une lecture reçue par la fausse base : table, filtres posés et colonnes demandées. */
interface RecordedRead {
  table: string;
  filters: [string, unknown][];
}
type Reply = { data: unknown; error: { message: string } | null };

const recordedReads: RecordedRead[] = [];
let nextReplies: Reply[] = [];
const clientCreated = vi.fn();

/** Requête chaînable qui enregistre ses filtres puis répond avec la prochaine réponse programmée. */
class FakeRead implements PromiseLike<Reply> {
  private readonly read: RecordedRead;
  constructor(table: string) {
    this.read = { table, filters: [] };
    recordedReads.push(this.read);
  }
  select = () => this;
  order = () => this;
  maybeSingle = () => this;
  eq = (column: string, value: unknown) => this.filter(column, value);
  is = (column: string, value: unknown) => this.filter(column, value);
  then<Result1 = Reply, Result2 = never>(onfulfilled?: (value: Reply) => Result1 | PromiseLike<Result1>, onrejected?: (reason: unknown) => Result2 | PromiseLike<Result2>) {
    return Promise.resolve(nextReplies.shift() ?? { data: [], error: null }).then(onfulfilled, onrejected);
  }
  private filter(column: string, value: unknown) {
    this.read.filters.push([column, value]);
    return this;
  }
}

vi.mock("@/lib/supabase/publicClient", () => ({
  createPublicClient: () => {
    clientCreated();
    return { from: (table: string) => new FakeRead(table), storage: { from: () => ({ getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.test/${path}` } }) }) } };
  },
}));

const { fetchCategoryPageData, fetchUsImportProducts } = await import("./siteQueries");

const categoryRow = { id: "cat-1", name: "Épicerie", position: 1, slug: "epicerie", seo_intro: "Notre rayon." };
const productRow = {
  id: "p1", category_id: "cat-1", title: "Takis", description: null, price_cents: null, photo_path: "products/a.webp", photo_width: 10, photo_height: 20,
  visible: true, deleted_at: null, is_us_import: true,
};

beforeEach(() => {
  recordedReads.length = 0;
  nextReplies = [];
  clientCreated.mockClear();
});

describe("fetchCategoryPageData", () => {
  it("renvoie la catégorie (slug, texte) et ses produits visibles, avec prix absent conservé", async () => {
    nextReplies = [{ data: categoryRow, error: null }, { data: [productRow], error: null }];
    const page = await fetchCategoryPageData("epicerie");
    expect(page?.category).toEqual({ id: "cat-1", label: "Épicerie", slug: "epicerie", seoIntro: "Notre rayon." });
    expect(page?.products).toEqual([{ id: "p1", title: "Takis", categoryId: "cat-1", priceInCents: null, isUsImport: true, photo: { url: "https://cdn.test/products/a.webp", width: 10, height: 20 } }]);
    expect(recordedReads[0]).toMatchObject({ table: "categories", filters: [["slug", "epicerie"]] });
    expect(recordedReads[1]).toMatchObject({ table: "products", filters: [["category_id", "cat-1"], ["visible", true], ["deleted_at", null]] });
  });

  it("renvoie null pour un slug inconnu, sans lire les produits", async () => {
    nextReplies = [{ data: null, error: null }];
    expect(await fetchCategoryPageData("inconnu")).toBeNull();
    expect(recordedReads).toHaveLength(1);
  });

  it("renvoie null pour un slug invalide (donnée externe) sans aucune lecture", async () => {
    for (const slug of ["", "Epicerie", "a b", "../x", "a--b", "-a", "a".repeat(5000), "x'; drop table categories;--"]) {
      expect(await fetchCategoryPageData(slug), JSON.stringify(slug)).toBeNull();
    }
    expect(clientCreated).not.toHaveBeenCalled();
    expect(recordedReads).toHaveLength(0);
  });

  it("garde seoIntro à null quand le texte n'est pas rédigé, et accepte un rayon sans produit", async () => {
    nextReplies = [{ data: { ...categoryRow, seo_intro: null }, error: null }, { data: [], error: null }];
    const page = await fetchCategoryPageData("epicerie");
    expect(page?.category.seoIntro).toBeNull();
    expect(page?.products).toEqual([]);
  });

  it("lève une erreur explicite si une lecture échoue (jamais un 404 trompeur)", async () => {
    nextReplies = [{ data: null, error: { message: "boum" } }];
    await expect(fetchCategoryPageData("epicerie")).rejects.toThrow("Lecture de la catégorie « epicerie » impossible : boum");
    nextReplies = [{ data: categoryRow, error: null }, { data: null, error: { message: "panne" } }];
    await expect(fetchCategoryPageData("epicerie")).rejects.toThrow("Lecture de « products » impossible : panne");
  });
});

describe("fetchUsImportProducts", () => {
  it("ne demande que les produits importés, visibles et hors corbeille", async () => {
    nextReplies = [{ data: [productRow], error: null }];
    const products = await fetchUsImportProducts();
    expect(products.map((product) => product.id)).toEqual(["p1"]);
    expect(recordedReads[0]).toMatchObject({ table: "products", filters: [["is_us_import", true], ["visible", true], ["deleted_at", null]] });
  });

  it("renvoie une liste vide s'il n'y en a aucun, et lève une erreur explicite si la lecture échoue", async () => {
    nextReplies = [{ data: [], error: null }];
    expect(await fetchUsImportProducts()).toEqual([]);
    nextReplies = [{ data: null, error: { message: "boum" } }];
    await expect(fetchUsImportProducts()).rejects.toThrow("Lecture de « products » impossible : boum");
  });
});
