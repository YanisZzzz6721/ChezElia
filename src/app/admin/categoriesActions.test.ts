import { beforeEach, describe, expect, it, vi } from "vitest";

/** Une opération reçue par la fausse base : table, verbe, données envoyées et filtres « eq ». */
interface RecordedCall {
  table: string;
  verb: "select" | "insert" | "update" | "delete";
  payload?: unknown;
  filters: [string, unknown][];
}
type Reply = { data: unknown; error: { message: string; code?: string } | null };

const recordedCalls: RecordedCall[] = [];
let nextReplies: Reply[] = [];

/** Requête chaînable qui s'enregistre puis répond avec la prochaine réponse programmée. */
class FakeQuery implements PromiseLike<Reply> {
  private readonly call: RecordedCall;
  constructor(table: string) {
    this.call = { table, verb: "select", filters: [] };
    recordedCalls.push(this.call);
  }
  select = () => this;
  order = () => this;
  limit = () => this;
  maybeSingle = () => this;
  insert = (payload: unknown) => this.setVerb("insert", payload);
  update = (payload: unknown) => this.setVerb("update", payload);
  delete = () => this.setVerb("delete");
  eq = (column: string, value: unknown) => {
    this.call.filters.push([column, value]);
    return this;
  };
  then<Result1 = Reply, Result2 = never>(onfulfilled?: (value: Reply) => Result1 | PromiseLike<Result1>, onrejected?: (reason: unknown) => Result2 | PromiseLike<Result2>) {
    const reply = nextReplies.shift() ?? { data: [], error: null };
    return Promise.resolve(reply).then(onfulfilled, onrejected);
  }
  private setVerb(verb: RecordedCall["verb"], payload?: unknown) {
    this.call.verb = verb;
    this.call.payload = payload;
    return this;
  }
}

const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath: (...args: unknown[]) => revalidatePath(...args) }));
vi.mock("@/lib/admin/auth", () => ({ requireAdmin: async () => ({ supabase: { from: (table: string) => new FakeQuery(table) } }) }));

const { createCategoryAction, deleteCategoryAction, renameCategoryAction, saveCategorySeoIntroAction } = await import("./_actions/categories");

const ID_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function buildForm(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [name, value] of Object.entries(fields)) formData.set(name, value);
  return formData;
}

beforeEach(() => {
  recordedCalls.length = 0;
  nextReplies = [];
  revalidatePath.mockClear();
});

describe("createCategoryAction : adresse (slug) de la page du rayon", () => {
  it("fabrique le slug depuis le nom et le range en dernière position", async () => {
    nextReplies = [{ data: [{ position: 3, slug: "boissons" }], error: null }, { data: null, error: null }];
    const result = await createCategoryAction(null, buildForm({ name: "Épicerie" }));
    expect(result).toMatchObject({ ok: true });
    expect(recordedCalls[1]).toMatchObject({ table: "categories", verb: "insert", payload: { name: "Épicerie", position: 4, slug: "epicerie" } });
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/rayons/epicerie");
    expect(revalidatePath).toHaveBeenCalledWith("/rayons", "layout");
  });

  it("ajoute un suffixe quand le slug est déjà pris par un autre rayon", async () => {
    nextReplies = [{ data: [{ position: 0, slug: "boissons" }, { position: 1, slug: "boissons-2" }], error: null }, { data: null, error: null }];
    await createCategoryAction(null, buildForm({ name: "Boissons !" }));
    expect(recordedCalls[1]?.payload).toMatchObject({ slug: "boissons-3" });
  });

  it("commence à la position 0 quand il n'y a aucune catégorie", async () => {
    nextReplies = [{ data: [], error: null }, { data: null, error: null }];
    await createCategoryAction(null, buildForm({ name: "Snacks" }));
    expect(recordedCalls[1]?.payload).toMatchObject({ position: 0, slug: "snacks" });
  });

  it("refuse un nom sans lettre ni chiffre (emoji) avec un message clair, sans rien écrire", async () => {
    nextReplies = [{ data: [], error: null }];
    const result = await createCategoryAction(null, buildForm({ name: "🍕" }));
    expect(result).toEqual({ ok: false, error: expect.stringContaining("lettre ou un chiffre") });
    expect(recordedCalls.filter((call) => call.verb === "insert")).toHaveLength(0);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("refuse un nom vide sans toucher à la base", async () => {
    expect(await createCategoryAction(null, buildForm({ name: "  " }))).toMatchObject({ ok: false });
    expect(recordedCalls).toHaveLength(0);
  });

  it("distingue un nom déjà utilisé d'un slug déjà utilisé (course entre deux créations)", async () => {
    nextReplies = [{ data: [], error: null }, { data: null, error: { code: "23505", message: 'duplicate key value violates unique constraint "categories_name_unique"' } }];
    expect(await createCategoryAction(null, buildForm({ name: "Snacks" }))).toEqual({ ok: false, error: "Une catégorie porte déjà ce nom." });
    nextReplies = [{ data: [], error: null }, { data: null, error: { code: "23505", message: 'duplicate key value violates unique constraint "categories_slug_unique"' } }];
    expect(await createCategoryAction(null, buildForm({ name: "Snacks" }))).toEqual({ ok: false, error: expect.stringContaining("Réessayez") });
  });

  it("remonte l'erreur de lecture avec son contexte", async () => {
    nextReplies = [{ data: null, error: { message: "boum" } }];
    expect(await createCategoryAction(null, buildForm({ name: "Snacks" }))).toEqual({ ok: false, error: "Lecture des catégories impossible : boum" });
  });
});

describe("renameCategoryAction : le slug ne change jamais", () => {
  it("n'envoie que le nom (jamais le slug) et rafraîchit la page du rayon", async () => {
    nextReplies = [{ data: { slug: "epicerie" }, error: null }];
    const result = await renameCategoryAction(null, buildForm({ id: ID_A, name: "Épicerie fine" }));
    expect(result).toEqual({ ok: true, message: "Catégorie renommée." });
    expect(recordedCalls[0]).toMatchObject({ verb: "update", payload: { name: "Épicerie fine" }, filters: [["id", ID_A]] });
    expect(recordedCalls[0]?.payload).not.toHaveProperty("slug");
    expect(revalidatePath).toHaveBeenCalledWith("/rayons/epicerie");
  });

  it("signale une catégorie supprimée entre-temps", async () => {
    nextReplies = [{ data: null, error: null }];
    expect(await renameCategoryAction(null, buildForm({ id: ID_A, name: "X" }))).toEqual({ ok: false, error: expect.stringContaining("n'existe plus") });
  });
});

describe("saveCategorySeoIntroAction", () => {
  it("enregistre le texte, vide = null, et rafraîchit l'accueil et la page du rayon", async () => {
    nextReplies = [{ data: { slug: "boissons" }, error: null }];
    const result = await saveCategorySeoIntroAction(null, buildForm({ id: ID_A, seoIntro: "  Notre rayon boissons.  " }));
    expect(result).toMatchObject({ ok: true });
    expect(recordedCalls[0]).toMatchObject({ table: "categories", verb: "update", payload: { seo_intro: "Notre rayon boissons." }, filters: [["id", ID_A]] });
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/rayons/boissons");

    nextReplies = [{ data: { slug: "boissons" }, error: null }];
    await saveCategorySeoIntroAction(null, buildForm({ id: ID_A, seoIntro: "   " }));
    expect(recordedCalls[1]?.payload).toEqual({ seo_intro: null });
  });

  it("refuse un texte trop long ou un identifiant invalide sans toucher à la base", async () => {
    expect(await saveCategorySeoIntroAction(null, buildForm({ id: ID_A, seoIntro: "a".repeat(1201) }))).toMatchObject({ ok: false, error: expect.stringContaining("1200") });
    expect(await saveCategorySeoIntroAction(null, buildForm({ id: "1 OR 1=1", seoIntro: "x" }))).toMatchObject({ ok: false });
    expect(recordedCalls).toHaveLength(0);
  });

  it("remonte l'erreur de la base et signale une catégorie introuvable", async () => {
    nextReplies = [{ data: null, error: { message: "refusé" } }];
    expect(await saveCategorySeoIntroAction(null, buildForm({ id: ID_A, seoIntro: "x" }))).toEqual({ ok: false, error: "Enregistrement du texte impossible : refusé" });
    nextReplies = [{ data: null, error: null }];
    expect(await saveCategorySeoIntroAction(null, buildForm({ id: ID_A, seoIntro: "x" }))).toEqual({ ok: false, error: expect.stringContaining("n'existe plus") });
  });
});

describe("deleteCategoryAction", () => {
  it("supprime puis rafraîchit toutes les pages de rayon", async () => {
    await deleteCategoryAction(buildForm({ id: ID_A }));
    expect(recordedCalls[0]).toMatchObject({ table: "categories", verb: "delete", filters: [["id", ID_A]] });
    expect(revalidatePath).toHaveBeenCalledWith("/rayons", "layout");
  });
});
