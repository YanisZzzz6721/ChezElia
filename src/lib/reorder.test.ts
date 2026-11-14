import { describe, expect, it } from "vitest";
import { moveItem } from "./reorder";

describe("moveItem", () => {
  const ids = ["a", "b", "c"];

  it("monte un élément d'un cran", () => {
    expect(moveItem(ids, "b", "up")).toEqual(["b", "a", "c"]);
  });

  it("descend un élément d'un cran", () => {
    expect(moveItem(ids, "b", "down")).toEqual(["a", "c", "b"]);
  });

  it("ne change rien en première position vers le haut ni en dernière vers le bas", () => {
    expect(moveItem(ids, "a", "up")).toEqual(ids);
    expect(moveItem(ids, "c", "down")).toEqual(ids);
  });

  it("ne change rien pour un identifiant inconnu et ne modifie pas la liste d'origine", () => {
    expect(moveItem(ids, "z", "up")).toEqual(ids);
    moveItem(ids, "b", "up");
    expect(ids).toEqual(["a", "b", "c"]);
  });

  it("gère une liste vide ou d'un seul élément", () => {
    expect(moveItem([], "a", "down")).toEqual([]);
    expect(moveItem(["a"], "a", "up")).toEqual(["a"]);
  });
});
