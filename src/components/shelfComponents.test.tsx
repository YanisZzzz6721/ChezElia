import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Category, Product } from "@/content/products";
import { SITE } from "@/content/site";
import type { SocialLink } from "@/content/social";
import { ALCOHOL_NOTICE } from "@/lib/catalogue";
import { Breadcrumb } from "./Breadcrumb";
import { Catalogue } from "./Catalogue";
import { CatalogueLinks } from "./CatalogueLinks";
import { JsonLdScript } from "./JsonLdScript";
import { RayonsList } from "./RayonsList";
import { ShelfPage } from "./ShelfPage";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { StoreAccessBlock } from "./StoreAccessBlock";

const product = (id: string, overrides: Partial<Product> = {}): Product => ({ id, title: `Produit ${id}`, categoryId: "c1", priceInCents: null, isUsImport: false, ...overrides });
const rayon = (overrides: Partial<Category> = {}): Category => ({ id: "c1", label: "Confiserie", slug: "confiserie", seoIntro: null, ...overrides });
const socialLinks: SocialLink[] = [{ network: "instagram", label: "Instagram", url: "https://www.instagram.com/compte-test/" }];
const breadcrumb = [
  { label: "Accueil", path: "/" },
  { label: "Rayons", path: "/rayons" },
  { label: "Confiserie", path: "/rayons/confiserie" },
];

describe("SiteHeader", () => {
  it("variante accueil : ancres de la page (rendu historique du hero)", () => {
    const html = renderToStaticMarkup(<SiteHeader />);
    expect(html).toContain('href="#catalogue"');
    expect(html).toContain('href="#horaires"');
    expect(html).toContain('href="#top"');
  });

  it("variante page secondaire : liens vers les sections de l'accueil et logo vers l'accueil", () => {
    const html = renderToStaticMarkup(<SiteHeader variant="inner" />);
    expect(html).toContain('href="/#catalogue"');
    expect(html).toContain('href="/#horaires"');
    expect(html).toContain('href="/"');
    expect(html).not.toContain('href="#top"');
    expect(html).toContain("Venir au magasin");
  });
});

describe("Breadcrumb", () => {
  it("affiche « Accueil › Rayons › Confiserie » : étapes précédentes en liens, page courante en texte", () => {
    const html = renderToStaticMarkup(<Breadcrumb items={breadcrumb} />);
    expect(html).toContain('aria-label="Fil d&#x27;Ariane"');
    expect(html).toContain('<a href="/">Accueil</a>');
    expect(html).toContain('<a href="/rayons">Rayons</a>');
    expect(html).not.toContain('href="/rayons/confiserie"');
    expect(html).toContain('<span aria-current="page">Confiserie</span>');
    expect(html.match(/<li/g)).toHaveLength(3);
  });

  it("échappe le nom d'un rayon", () => {
    const html = renderToStaticMarkup(<Breadcrumb items={[{ label: "<script>x</script>", path: "/" }]} />);
    expect(html).not.toContain("<script>");
  });
});

describe("JsonLdScript", () => {
  it("neutralise « < » pour qu'aucune donnée ne ferme la balise", () => {
    const html = renderToStaticMarkup(<JsonLdScript data={{ name: "</script><img>" }} />);
    expect(html.match(/<\/script>/g)).toHaveLength(1);
    expect(html).toContain("application/ld+json");
  });
});

describe("StoreAccessBlock", () => {
  it("affiche l'adresse, l'itinéraire sûr et le lien vers les horaires de l'accueil", () => {
    const html = renderToStaticMarkup(<StoreAccessBlock />);
    expect(html).toContain(SITE.address);
    expect(html).toContain(`href="${SITE.directionsUrl.replaceAll("&", "&amp;")}"`);
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('href="/#horaires"');
  });
});

describe("CatalogueLinks", () => {
  it("n'affiche rien pour « Tout » sans produit américain", () => {
    expect(renderToStaticMarkup(<CatalogueLinks rayon={null} showUsImportLink={false} />)).toBe("");
  });

  it("affiche « Voir le rayon X » vers /rayons/<slug> pour le rayon sélectionné", () => {
    const html = renderToStaticMarkup(<CatalogueLinks rayon={rayon()} showUsImportLink={false} />);
    expect(html).toContain('href="/rayons/confiserie"');
    expect(html).toContain("Voir le rayon Confiserie");
    expect(html).not.toContain("Produits américains");
  });

  it("affiche « Produits américains » seulement quand il y a des produits américains", () => {
    const html = renderToStaticMarkup(<CatalogueLinks rayon={null} showUsImportLink />);
    expect(html).toContain('href="/produits-americains"');
    expect(html).toContain("Produits américains");
    expect(html).not.toContain("Voir le rayon");
  });

  it("affiche les deux liens quand les deux conditions sont remplies et échappe le nom du rayon", () => {
    const html = renderToStaticMarkup(<CatalogueLinks rayon={rayon({ label: "<b>X</b>" })} showUsImportLink />);
    expect(html.match(/<a /g)).toHaveLength(2);
    expect(html).not.toContain("<b>");
  });
});

describe("SiteFooter : ligne « Nos rayons »", () => {
  const rayons = [rayon(), rayon({ id: "c2", label: "Boissons", slug: "boissons" })];

  it("liste un lien par rayon non vide, dans l'ordre reçu", () => {
    const html = renderToStaticMarkup(<SiteFooter rayons={rayons} />);
    expect(html).toContain("Nos rayons");
    expect(html).toContain('href="/rayons/confiserie"');
    expect(html).toContain('href="/rayons/boissons"');
    expect(html.indexOf("Confiserie")).toBeLessThan(html.indexOf("Boissons"));
  });

  it("n'affiche aucune ligne sans rayon et garde les liens légaux", () => {
    for (const html of [renderToStaticMarkup(<SiteFooter />), renderToStaticMarkup(<SiteFooter rayons={[]} />)]) {
      expect(html).not.toContain("Nos rayons");
      expect(html).toContain('href="/mentions-legales"');
    }
  });

  it("échappe le nom d'un rayon", () => {
    expect(renderToStaticMarkup(<SiteFooter rayons={[rayon({ label: "<script>x</script>" })]} />)).not.toContain("<script>");
  });
});

describe("RayonsList", () => {
  it("affiche un lien par rayon avec son nombre de produits", () => {
    const html = renderToStaticMarkup(<RayonsList rayons={[rayon()]} products={[product("a"), product("b")]} />);
    expect(html).toContain('href="/rayons/confiserie"');
    expect(html).toContain("Confiserie");
    expect(html).toContain("2 produits");
  });

  it("met « produit » au singulier pour 1", () => {
    expect(renderToStaticMarkup(<RayonsList rayons={[rayon()]} products={[product("a")]} />)).toContain("1 produit<");
  });

  it("affiche un message prévu quand il n'y a aucun rayon", () => {
    const html = renderToStaticMarkup(<RayonsList rayons={[]} products={[]} />);
    expect(html).toContain("b-empty");
    expect(html).not.toContain("<a ");
  });
});

describe("ShelfPage", () => {
  const baseProps = { breadcrumb, headingStart: "Confiserie", introParagraphs: ["Premier paragraphe.", "Second\nparagraphe."], healthNotice: null, products: [product("a"), product("b", { priceInCents: 250 })], socialLinks, rayons: [rayon()] };

  it("affiche un seul H1 « <Nom> à Strasbourg », le fil d'Ariane, l'introduction, les fiches, l'accès et le pied de page", () => {
    const html = renderToStaticMarkup(<ShelfPage {...baseProps} />);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*>Confiserie <span>à Strasbourg<\/span><\/h1>/);
    expect(html).toContain("Fil d&#x27;Ariane");
    expect(html).toContain("Premier paragraphe.");
    expect(html).toContain("Second\nparagraphe.");
    expect(html.match(/class="b-card"/g)).toHaveLength(2);
    expect(html).toContain("Prix à confirmer");
    expect(html).toContain("Photo à venir");
    expect(html).toContain('href="/#horaires"');
    expect(html).toContain("Instagram");
    expect(html).toContain("<main");
  });

  it("n'affiche la mention de santé que si elle est fournie, avant la grille", () => {
    expect(renderToStaticMarkup(<ShelfPage {...baseProps} />)).not.toContain(ALCOHOL_NOTICE);
    const html = renderToStaticMarkup(<ShelfPage {...baseProps} healthNotice={ALCOHOL_NOTICE} />);
    expect(html).toContain(ALCOHOL_NOTICE);
    expect(html.indexOf(ALCOHOL_NOTICE)).toBeLessThan(html.indexOf("b-grid"));
  });

  it("affiche un message prévu (et aucune grille vide) quand le rayon n'a aucun produit", () => {
    const html = renderToStaticMarkup(<ShelfPage {...baseProps} products={[]} />);
    expect(html).toContain("b-empty");
    expect(html).not.toContain("b-grid");
  });

  it("échappe le HTML des textes venus de la base", () => {
    const html = renderToStaticMarkup(<ShelfPage {...baseProps} headingStart="<script>x</script>" introParagraphs={["<img src=x onerror=alert(1)>"]} products={[product("z", { title: "<b>t</b>" })]} />);
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<b>t");
  });
});

describe("Catalogue : lien « Produits américains »", () => {
  const categories = [rayon(), rayon({ id: "alc", label: "Alcools", slug: "alcools" })];

  it("apparaît dès qu'un produit américain visible (hors alcool) existe", () => {
    const html = renderToStaticMarkup(<Catalogue categories={categories} products={[product("a", { isUsImport: true })]} />);
    expect(html).toContain('href="/produits-americains"');
    expect(html).not.toContain("Voir le rayon");
  });

  it("n'apparaît pas sans produit américain, ni si le seul produit américain est un alcool", () => {
    expect(renderToStaticMarkup(<Catalogue categories={categories} products={[product("a")]} />)).not.toContain("/produits-americains");
    expect(renderToStaticMarkup(<Catalogue categories={categories} products={[product("a", { isUsImport: true, categoryId: "alc" })]} />)).not.toContain("/produits-americains");
  });
});
