import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Product } from "@/content/products";
import type { FaqItem } from "@/content/faq";
import { SITE } from "@/content/site";
import { CallButton } from "./CallButton";
import { FaqSection } from "./FaqSection";
import { FindUsSection } from "./FindUsSection";
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

describe("FaqSection", () => {
  const items: FaqItem[] = [
    { id: "1", question: "Première ?", answer: "Réponse 1" },
    { id: "2", question: "Seconde ?", answer: "Ligne A\nLigne B" },
  ];

  it("n'affiche rien du tout tant qu'aucune question n'est saisie", () => {
    expect(renderToStaticMarkup(<FaqSection items={[]} />)).toBe("");
  });

  it("affiche chaque question et sa réponse, dans l'ordre reçu, dans des blocs dépliables", () => {
    const html = renderToStaticMarkup(<FaqSection items={items} />);
    expect(html.match(/<details/g)).toHaveLength(2);
    expect(html.indexOf("Première ?")).toBeLessThan(html.indexOf("Seconde ?"));
    expect(html).toContain("Réponse 1");
    expect(html).toContain("Questions");
  });

  it("échappe le HTML saisi par les propriétaires (jamais interprété)", () => {
    const hostile: FaqItem[] = [{ id: "x", question: "<img src=x onerror=alert(1)>", answer: "<script>alert(1)</script>" }];
    const html = renderToStaticMarkup(<FaqSection items={hostile} />);
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("FindUsSection", () => {
  it("affiche l'adresse du magasin et un lien d'itinéraire sûr", () => {
    const html = renderToStaticMarkup(<FindUsSection phoneNumber={null} />);
    expect(html).toContain(SITE.address);
    // Dans un attribut HTML, « & » est encodé en « &amp; » : c'est la forme attendue du lien.
    expect(html).toContain(`href="${SITE.directionsUrl.replaceAll("&", "&amp;")}"`);
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("n'invente aucun numéro : bouton Appeler désactivé sans numéro public, lien tel: avec", () => {
    expect(renderToStaticMarkup(<FindUsSection phoneNumber={null} />)).toContain("numéro à venir");
    expect(renderToStaticMarkup(<FindUsSection phoneNumber="03 88 12 34 56" />)).toContain('href="tel:+33388123456"');
  });
});
