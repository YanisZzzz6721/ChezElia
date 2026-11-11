import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Product } from "@/content/products";
import { CallButton } from "./CallButton";
import { ProductCard } from "./ProductCard";

const baseProduct: Product = { id: "x", title: "Produit test", categoryId: null, priceInCents: null };

describe("CallButton", () => {
  it("affiche un bouton désactivé « numéro à venir » tant qu'aucun numéro n'est fourni", () => {
    const html = renderToStaticMarkup(<CallButton phoneNumber={null} showIcon />);
    expect(html).toContain("disabled");
    expect(html).toContain("numéro à venir");
    expect(html).not.toContain("tel:");
  });

  it("affiche un vrai lien tel: au format international quand le numéro est fourni", () => {
    const html = renderToStaticMarkup(<CallButton phoneNumber="03 88 12 34 56" showIcon />);
    expect(html).toContain('href="tel:+33388123456"');
    expect(html).not.toContain("disabled");
  });

  it("n'affiche pas l'icône quand showIcon est faux", () => {
    expect(renderToStaticMarkup(<CallButton phoneNumber={null} showIcon={false} />)).not.toContain("<svg");
  });
});

describe("ProductCard", () => {
  it("affiche « Prix à confirmer » et « Photo à venir » pour un produit sans prix ni photo", () => {
    const html = renderToStaticMarkup(<ProductCard product={baseProduct} />);
    expect(html).toContain("Prix à confirmer");
    expect(html).toContain("Photo à venir");
    expect(html).toContain("b-price--tbd");
  });

  it("affiche un vrai prix nul « 0,00 € » (≠ prix absent)", () => {
    const html = renderToStaticMarkup(<ProductCard product={{ ...baseProduct, priceInCents: 0 }} />);
    expect(html).toContain("0,00");
    expect(html).not.toContain("Prix à confirmer");
  });

  it("affiche la description seulement si elle existe", () => {
    expect(renderToStaticMarkup(<ProductCard product={baseProduct} />)).not.toContain("b-card__desc");
    expect(renderToStaticMarkup(<ProductCard product={{ ...baseProduct, description: "Canette" }} />)).toContain("Canette");
  });

  it("échappe le HTML d'un titre", () => {
    const html = renderToStaticMarkup(<ProductCard product={{ ...baseProduct, title: "<script>x</script>" }} />);
    expect(html).not.toContain("<script>");
  });

  it("refuse un prix négatif avec une erreur explicite", () => {
    expect(() => renderToStaticMarkup(<ProductCard product={{ ...baseProduct, priceInCents: -5 }} />)).toThrow(/négatif/);
  });
});
