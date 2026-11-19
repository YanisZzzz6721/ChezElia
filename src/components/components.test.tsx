import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Product } from "@/content/products";
import type { FaqItem } from "@/content/faq";
import type { ServiceItem } from "@/content/services";
import { SITE } from "@/content/site";
import type { SocialLink } from "@/content/social";
import { CallButton } from "./CallButton";
import { FaqSection } from "./FaqSection";
import { FindUsSection } from "./FindUsSection";
import { Hero } from "./Hero";
import { ProductCard } from "./ProductCard";
import { ServicesSection } from "./ServicesSection";
import { SiteFooter } from "./SiteFooter";
import { SocialIconRow } from "./SocialIconRow";

const baseProduct: Product = { id: "x", title: "Produit test", categoryId: null, priceInCents: null, isUsImport: false };

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

const sampleServices: ServiceItem[] = [
  { id: "s1", title: "Premier service", body: "Texte du premier", highlight: "2,50 €", icon: "sandwich", visible: true },
  { id: "s2", title: "Second service", body: "Texte du second", highlight: null, icon: "vinted", visible: true },
];

const sampleSocialLinks: SocialLink[] = [
  { network: "instagram", label: "Instagram", url: "https://www.instagram.com/compte-test/" },
  { network: "tiktok", label: "TikTok", url: "https://www.tiktok.com/@compte-test" },
  { network: "snapchat", label: "Snapchat", url: "https://www.snapchat.com/add/compte-test" },
];

describe("ServicesSection", () => {
  it("n'affiche rien tant qu'aucun service n'est publié", () => {
    expect(renderToStaticMarkup(<ServicesSection services={[]} />)).toBe("");
  });

  it("affiche une carte par service, dans l'ordre reçu, avec le texte venu de la base", () => {
    const html = renderToStaticMarkup(<ServicesSection services={sampleServices} />);
    expect(html.match(/<li /g)).toHaveLength(2);
    expect(html.indexOf("Premier service")).toBeLessThan(html.indexOf("Second service"));
    expect(html).toContain("Texte du premier");
    expect(html).toContain('aria-labelledby="services-title"');
  });

  it("affiche la mention « 2,50 € » seulement quand highlight est renseigné", () => {
    const html = renderToStaticMarkup(<ServicesSection services={sampleServices} />);
    expect(html.match(/f-srv__hl/g)).toHaveLength(1);
    expect(html).toContain("2,50 €");
    expect(renderToStaticMarkup(<ServicesSection services={[sampleServices[1] as ServiceItem]} />)).not.toContain("f-srv__hl");
  });

  it("masque toutes les icônes aux lecteurs d'écran (décoratives)", () => {
    const html = renderToStaticMarkup(<ServicesSection services={sampleServices} />);
    expect(html.match(/<svg /g)).toHaveLength(2);
    expect(html.match(/<svg [^>]*aria-hidden="true"/g)).toHaveLength(2);
  });

  it("échappe le HTML saisi dans l'administration (jamais interprété)", () => {
    const hostile: ServiceItem[] = [{ id: "x", title: "<script>t</script>", body: "<img src=x onerror=alert(1)>", highlight: "<b>1</b>", icon: "parcel", visible: true }];
    const html = renderToStaticMarkup(<ServicesSection services={hostile} />);
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<b>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("SocialIconRow", () => {
  it("n'affiche rien sans réseau", () => {
    expect(renderToStaticMarkup(<SocialIconRow links={[]} />)).toBe("");
  });

  it("affiche un lien sûr par réseau : nouvel onglet, rel, nom accessible porté par le lien", () => {
    const html = renderToStaticMarkup(<SocialIconRow links={sampleSocialLinks} />);
    expect(html.match(/<a /g)).toHaveLength(3);
    expect(html.match(/target="_blank"/g)).toHaveLength(3);
    expect(html.match(/rel="noopener noreferrer"/g)).toHaveLength(3);
    expect(html).toContain('aria-label="Instagram (nouvel onglet)"');
    expect(html).toContain('href="https://www.tiktok.com/@compte-test"');
    expect(html).toContain('aria-label="Nos réseaux sociaux"');
  });

  it("masque les logos aux lecteurs d'écran (le lien porte le nom)", () => {
    const html = renderToStaticMarkup(<SocialIconRow links={sampleSocialLinks} />);
    expect(html.match(/<svg [^>]*aria-hidden="true"/g)).toHaveLength(3);
  });
});

describe("SiteFooter", () => {
  it("affiche les réseaux avec des liens sûrs quand il y en a", () => {
    const html = renderToStaticMarkup(<SiteFooter socialLinks={sampleSocialLinks} />);
    expect(html).toContain("s-foot__social");
    expect(html.match(/rel="noopener noreferrer"/g)).toHaveLength(3);
    expect(html).toContain("Snapchat");
  });

  it("n'affiche aucune ligne de réseaux sans réseau", () => {
    expect(renderToStaticMarkup(<SiteFooter socialLinks={[]} />)).not.toContain("s-foot__social");
    expect(renderToStaticMarkup(<SiteFooter />)).not.toContain("s-foot__social");
  });

  it.each([[sampleSocialLinks], [[]]])("garde toujours les liens légaux obligatoires", (links) => {
    const html = renderToStaticMarkup(<SiteFooter socialLinks={links} />);
    expect(html).toContain('href="/mentions-legales"');
    expect(html).toContain("Mentions légales");
    expect(html).toContain('href="/confidentialite"');
    expect(html).toContain("Politique de confidentialité");
  });

  it("garde le séparateur collé au premier lien légal (jamais seul en fin de ligne)", () => {
    const html = renderToStaticMarkup(<SiteFooter />);
    expect(html).toMatch(/Mentions légales<\/a><span class="s-foot__sep" aria-hidden="true">·<\/span><\/span>/);
  });
});

describe("Hero", () => {
  const heroProps = { tag: "Accroche", lead: "Texte", phoneNumber: null, photo: null } as const;

  it("affiche la rangée de réseaux sous l'adresse quand il y en a", () => {
    const html = renderToStaticMarkup(<Hero {...heroProps} socialLinks={sampleSocialLinks} />);
    expect(html).toContain('aria-label="Nos réseaux sociaux"');
    expect(html.match(/b-social__a/g)).toHaveLength(3);
  });

  it("n'affiche aucune rangée de réseaux sans réseau", () => {
    expect(renderToStaticMarkup(<Hero {...heroProps} socialLinks={[]} />)).not.toContain("b-social");
    expect(renderToStaticMarkup(<Hero {...heroProps} />)).not.toContain("b-social");
  });
});
