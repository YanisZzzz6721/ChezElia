import { describe, expect, it } from "vitest";
import type { Category, Product } from "@/content/products";
import {
  MIN_PRODUCTS_FOR_INDEXING,
  isCategoryPageIndexable,
  isUsImportPageIndexable,
  listIndexableCategories,
  listProductsOfCategory,
  listPublicUsImportProducts,
} from "./shelfPages";

const category = (overrides: Partial<Category> = {}): Category => ({ id: "c1", label: "Confiserie", slug: "confiserie", seoIntro: "Un texte.", ...overrides });
const product = (id: string, overrides: Partial<Product> = {}): Product => ({ id, title: `Produit ${id}`, categoryId: "c1", priceInCents: null, isUsImport: false, ...overrides });
const makeProducts = (count: number, overrides: Partial<Product> = {}): Product[] => Array.from({ length: count }, (_, index) => product(`p${index}`, overrides));

describe("isCategoryPageIndexable", () => {
  it("exige au moins 6 produits visibles ET un texte de présentation", () => {
    expect(MIN_PRODUCTS_FOR_INDEXING).toBe(6);
    expect(isCategoryPageIndexable(category(), makeProducts(6))).toBe(true);
    expect(isCategoryPageIndexable(category(), makeProducts(5))).toBe(false);
    expect(isCategoryPageIndexable(category(), [])).toBe(false);
  });

  it.each([[null], [""], ["   \n\n  "]])("refuse un texte absent ou vide (%j), même avec beaucoup de produits", (seoIntro) => {
    expect(isCategoryPageIndexable(category({ seoIntro }), makeProducts(30))).toBe(false);
  });
});

describe("isUsImportPageIndexable", () => {
  it("n'exige que 6 produits (pas de texte de présentation)", () => {
    expect(isUsImportPageIndexable(makeProducts(6))).toBe(true);
    expect(isUsImportPageIndexable(makeProducts(5))).toBe(false);
  });
});

describe("listProductsOfCategory", () => {
  it("ne garde que les produits du rayon, dans l'ordre reçu", () => {
    const products = [product("a"), product("b", { categoryId: "c2" }), product("c", { categoryId: null }), product("d")];
    expect(listProductsOfCategory(products, "c1").map((item) => item.id)).toEqual(["a", "d"]);
  });
});

describe("listIndexableCategories", () => {
  it("ne garde que les rayons avec texte ET au moins 6 produits", () => {
    const categories = [
      category({ id: "c1" }),
      category({ id: "c2", slug: "boissons", label: "Boissons", seoIntro: null }),
      category({ id: "c3", slug: "hygiene", label: "Hygiène" }),
    ];
    const products = [...makeProducts(6, { categoryId: "c1" }), ...makeProducts(9, { categoryId: "c2" }).map((p) => ({ ...p, id: `b${p.id}` })), ...makeProducts(2, { categoryId: "c3" }).map((p) => ({ ...p, id: `h${p.id}` }))];
    expect(listIndexableCategories(categories, products).map((item) => item.slug)).toEqual(["confiserie"]);
  });
});

describe("listPublicUsImportProducts", () => {
  const alcohol = category({ id: "alc", label: "Alcools", slug: "alcools" });
  const sweets = category();

  it("ne garde que les produits Import USA", () => {
    const products = [product("a", { isUsImport: true }), product("b")];
    expect(listPublicUsImportProducts(products, [sweets]).map((item) => item.id)).toEqual(["a"]);
  });

  it("exclut TOUJOURS un produit Import USA de la catégorie alcool", () => {
    const products = [product("a", { isUsImport: true, categoryId: "alc" }), product("b", { isUsImport: true })];
    expect(listPublicUsImportProducts(products, [alcohol, sweets]).map((item) => item.id)).toEqual(["b"]);
  });

  it("exclut aussi les variantes de nom (« Boissons alcoolisées », accents, casse)", () => {
    const variant = category({ id: "v", label: "BOISSONS ALCOOLISÉES", slug: "boissons-alcoolisees" });
    expect(listPublicUsImportProducts([product("a", { isUsImport: true, categoryId: "v" })], [variant])).toEqual([]);
  });

  it("garde un produit sans catégorie ou de catégorie inconnue (jamais de l'alcool)", () => {
    const products = [product("a", { isUsImport: true, categoryId: null }), product("b", { isUsImport: true, categoryId: "inconnue" })];
    expect(listPublicUsImportProducts(products, [alcohol])).toHaveLength(2);
  });
});
