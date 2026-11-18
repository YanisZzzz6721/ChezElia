import { beforeEach, describe, expect, it, vi } from "vitest";

/** Une opération reçue par la fausse base : table, verbe, données envoyées et filtres « eq ». */
interface RecordedCall {
  table: string;
  verb: "select" | "insert" | "update" | "delete" | "upsert";
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
  order = () => this;
  limit = () => this;
  insert = (payload: unknown) => this.setVerb("insert", payload);
  update = (payload: unknown) => this.setVerb("update", payload);
  upsert = (payload: unknown) => this.setVerb("upsert", payload);
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

const { createServiceAction, deleteServiceAction, moveServiceAction, updateServiceAction } = await import("./_actions/services");
const { saveSocialLinksAction } = await import("./_actions/site");

const ID_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ID_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ID_C = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

function buildForm(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [name, value] of Object.entries(fields)) formData.set(name, value);
  return formData;
}

const validService = { title: "Sandwichs", body: "Préparés sur place.", highlight: "", icon: "sandwich", visible: "on" };

beforeEach(() => {
  recordedCalls.length = 0;
  nextReplies = [];
  revalidatePath.mockClear();
});

describe("createServiceAction", () => {
  it("refuse une saisie invalide sans toucher à la base", async () => {
    const result = await createServiceAction(null, buildForm({ ...validService, title: "  " }));
    expect(result).toEqual({ ok: false, error: expect.stringContaining("titre") });
    expect(recordedCalls).toHaveLength(0);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("place le nouveau service après le dernier (position max + 1), mention vide = null", async () => {
    nextReplies = [{ data: [{ position: 4 }], error: null }, { data: null, error: null }];
    const result = await createServiceAction(null, buildForm(validService));
    expect(result).toMatchObject({ ok: true });
    expect(recordedCalls[1]).toMatchObject({ table: "services", verb: "insert", payload: { title: "Sandwichs", highlight: null, icon: "sandwich", visible: true, position: 5 } });
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/services");
  });

  it("commence à la position 0 quand la liste est vide, et enregistre un service masqué si la case est décochée", async () => {
    nextReplies = [{ data: [], error: null }, { data: null, error: null }];
    const { visible: _omitted, ...unchecked } = validService;
    const result = await createServiceAction(null, buildForm(unchecked));
    expect(result).toMatchObject({ ok: true, message: expect.stringContaining("masqué") });
    expect(recordedCalls[1]?.payload).toMatchObject({ position: 0, visible: false });
  });

  it("remonte l'erreur de lecture et celle d'écriture avec leur contexte", async () => {
    nextReplies = [{ data: null, error: { message: "boum" } }];
    expect(await createServiceAction(null, buildForm(validService))).toEqual({ ok: false, error: "Lecture des services impossible : boum" });
    nextReplies = [{ data: [], error: null }, { data: null, error: { message: "refusé" } }];
    expect(await createServiceAction(null, buildForm(validService))).toEqual({ ok: false, error: "Ajout impossible : refusé" });
  });
});

describe("updateServiceAction", () => {
  it("met à jour les champs (sans l'identifiant) pour le bon service", async () => {
    nextReplies = [{ data: [{ id: ID_A }], error: null }];
    const result = await updateServiceAction(null, buildForm({ ...validService, id: ID_A, highlight: "2,50 €" }));
    expect(result).toEqual({ ok: true, message: "Service enregistré." });
    expect(recordedCalls[0]).toMatchObject({ verb: "update", filters: [["id", ID_A]], payload: { highlight: "2,50 €", visible: true } });
    expect(recordedCalls[0]?.payload).not.toHaveProperty("id");
  });

  it("signale un service supprimé entre-temps (aucune ligne modifiée)", async () => {
    nextReplies = [{ data: [], error: null }];
    const result = await updateServiceAction(null, buildForm({ ...validService, id: ID_A }));
    expect(result).toEqual({ ok: false, error: expect.stringContaining("n'existe plus") });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("refuse un identifiant qui n'est pas un UUID sans toucher à la base", async () => {
    const result = await updateServiceAction(null, buildForm({ ...validService, id: "1 OR 1=1" }));
    expect(result).toMatchObject({ ok: false });
    expect(recordedCalls).toHaveLength(0);
  });
});

describe("moveServiceAction", () => {
  const readOrder = () => ({ data: [{ id: ID_A }, { id: ID_B }, { id: ID_C }], error: null });

  it("descend un service et renumérote toutes les positions 0..n-1", async () => {
    nextReplies = [readOrder()];
    await moveServiceAction(buildForm({ id: ID_A, direction: "down" }));
    const updates = recordedCalls.filter((call) => call.verb === "update");
    expect(updates.map((call) => [call.filters[0]?.[1], call.payload])).toEqual([
      [ID_B, { position: 0 }],
      [ID_A, { position: 1 }],
      [ID_C, { position: 2 }],
    ]);
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("ne fait rien quand le service est déjà en bout de liste", async () => {
    nextReplies = [readOrder()];
    await moveServiceAction(buildForm({ id: ID_A, direction: "up" }));
    expect(recordedCalls.filter((call) => call.verb === "update")).toHaveLength(0);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejette une direction ou un identifiant invalide", async () => {
    await expect(moveServiceAction(buildForm({ id: ID_A, direction: "sideways" }))).rejects.toThrow();
    await expect(moveServiceAction(buildForm({ id: "nope", direction: "up" }))).rejects.toThrow("Identifiant de service invalide.");
    expect(recordedCalls).toHaveLength(0);
  });

  it("lève une erreur explicite si une écriture échoue", async () => {
    nextReplies = [readOrder(), { data: null, error: { message: "panne" } }];
    await expect(moveServiceAction(buildForm({ id: ID_C, direction: "up" }))).rejects.toThrow("Réordonnancement impossible : panne");
  });
});

describe("deleteServiceAction", () => {
  it("supprime le service demandé puis rafraîchit les pages", async () => {
    await deleteServiceAction(buildForm({ id: ID_B }));
    expect(recordedCalls[0]).toMatchObject({ table: "services", verb: "delete", filters: [["id", ID_B]] });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/services");
  });

  it("lève une erreur explicite si la suppression échoue, et rejette un identifiant invalide", async () => {
    nextReplies = [{ data: null, error: { message: "interdit" } }];
    await expect(deleteServiceAction(buildForm({ id: ID_B }))).rejects.toThrow("Suppression du service impossible : interdit");
    await expect(deleteServiceAction(buildForm({ id: "" }))).rejects.toThrow();
  });
});

describe("saveSocialLinksAction", () => {
  it("enregistre les trois clés ; un champ vide devient null (réseau masqué)", async () => {
    nextReplies = [{ data: null, error: null }];
    const result = await saveSocialLinksAction(null, buildForm({ instagram: " https://www.instagram.com/compte/ ", tiktok: "", snapchat: "" }));
    expect(result).toEqual({ ok: true, message: "Réseaux sociaux enregistrés." });
    expect(recordedCalls[0]).toMatchObject({
      table: "site_settings",
      verb: "upsert",
      payload: [
        { key: "social_instagram", value: "https://www.instagram.com/compte/" },
        { key: "social_tiktok", value: null },
        { key: "social_snapchat", value: null },
      ],
    });
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/site");
  });

  it("refuse une adresse d'un autre site ou en javascript:, en nommant le réseau, sans rien écrire", async () => {
    for (const bad of ["https://instagram.com.pirate.example/x", "javascript:alert(1)", "http://www.instagram.com/x"]) {
      const result = await saveSocialLinksAction(null, buildForm({ instagram: bad, tiktok: "", snapchat: "" }));
      expect(result).toEqual({ ok: false, error: expect.stringContaining("Instagram") });
    }
    expect(recordedCalls).toHaveLength(0);
  });

  it("remonte l'erreur de la base", async () => {
    nextReplies = [{ data: null, error: { message: "refusé" } }];
    const result = await saveSocialLinksAction(null, buildForm({ instagram: "", tiktok: "", snapchat: "" }));
    expect(result).toEqual({ ok: false, error: "Enregistrement des réseaux sociaux impossible : refusé" });
  });
});
