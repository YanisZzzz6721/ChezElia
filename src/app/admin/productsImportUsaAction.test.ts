import { beforeEach, describe, expect, it, vi } from "vitest";

/** Une opération reçue par la fausse base. */
interface RecordedCall {
  table: string;
  verb: "select" | "insert" | "update";
  payload?: unknown;
  filters: [string, unknown][];
}
type Reply = { data: unknown; error: { message: string } | null };

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
  single = () => this;
  insert = (payload: unknown) => this.setVerb("insert", payload);
  update = (payload: unknown) => this.setVerb("update", payload);
  eq = (column: string, value: unknown) => {
    this.call.filters.push([column, value]);
    return this;
  };
  then<Result1 = Reply, Result2 = never>(onfulfilled?: (value: Reply) => Result1 | PromiseLike<Result1>, onrejected?: (reason: unknown) => Result2 | PromiseLike<Result2>) {
    const reply = nextReplies.shift() ?? { data: null, error: null };
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
vi.mock("next/navigation", () => ({
  redirect: (target: string) => {
    throw new Error(`REDIRECT:${target}`);
  },
}));
vi.mock("@/lib/admin/auth", () => ({ requireAdmin: async () => ({ supabase: { from: (table: string) => new FakeQuery(table) } }) }));

const { saveProductAction } = await import("./_actions/products");

const PRODUCT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

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

describe("saveProductAction : case « Import USA »", () => {
  it("crée un produit marqué Import USA et rafraîchit l'accueil, les rayons et la page des produits américains", async () => {
    await expect(saveProductAction(null, buildForm({ title: "Takis", price: "", visible: "on", isUsImport: "on" }))).rejects.toThrow("REDIRECT:/admin/produits?flash=created");
    expect(recordedCalls[0]).toMatchObject({ table: "products", verb: "insert", payload: { title: "Takis", is_us_import: true, visible: true, price_cents: null } });
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/rayons", "layout");
    expect(revalidatePath).toHaveBeenCalledWith("/produits-americains");
  });

  it("décocher la case enregistre faux (et non « inchangé ») à la modification", async () => {
    nextReplies = [{ data: { photo_path: null }, error: null }];
    await expect(saveProductAction(null, buildForm({ id: PRODUCT_ID, title: "Takis", price: "2,50", visible: "on" }))).rejects.toThrow("REDIRECT:/admin/produits?flash=updated");
    const update = recordedCalls.find((call) => call.verb === "update");
    expect(update).toMatchObject({ filters: [["id", PRODUCT_ID]], payload: { is_us_import: false, price_cents: 250 } });
  });

  it("n'écrit rien et ne rafraîchit rien quand la saisie est invalide", async () => {
    const result = await saveProductAction(null, buildForm({ title: " ", price: "", isUsImport: "on" }));
    expect(result).toMatchObject({ ok: false });
    expect(recordedCalls).toHaveLength(0);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
