import { describe, expect, it } from "vitest";
import {
  META_DESCRIPTION_MAX_LENGTH,
  buildBreadcrumbJsonLd,
  buildShelfIntroParagraphs,
  buildRayonBreadcrumb,
  buildRayonsBreadcrumb,
  buildUsImportBreadcrumb,
  US_IMPORT_INTRO,
  US_IMPORT_LABEL,
  buildNeutralShelfSentence,
  buildPageMetadata,
  buildPageRobots,
  buildRayonsDescription,
  buildShelfDescription,
  buildShelfTitle,
  splitIntoParagraphs,
} from "./shelfSeo";

describe("buildShelfTitle", () => {
  it("donne « <Nom> à Strasbourg | Chez Elia »", () => {
    expect(buildShelfTitle("Confiserie")).toBe("Confiserie à Strasbourg | Chez Elia");
  });
});

describe("buildShelfDescription", () => {
  it("décrit le rayon, le nombre de produits et l'heure de fermeture la plus tardive (01h30 = 24 h 90 min)", () => {
    expect(buildShelfDescription("Confiserie", 12, 24 * 60 + 90)).toBe(
      "Confiserie chez Chez Elia, épicerie de nuit au 4 rue Sédillot à Strasbourg : 12 produits. Ouvert jusqu'à 1h30.",
    );
  });

  it("omet l'heure quand elle est inconnue", () => {
    expect(buildShelfDescription("Boissons", 8, null)).toBe("Boissons chez Chez Elia, épicerie de nuit au 4 rue Sédillot à Strasbourg : 8 produits.");
  });

  it("met « produit » au singulier pour 1 et omet le compte pour 0", () => {
    expect(buildShelfDescription("Hygiène", 1, null)).toContain(": 1 produit.");
    expect(buildShelfDescription("Hygiène", 0, null)).toBe("Hygiène chez Chez Elia, épicerie de nuit au 4 rue Sédillot à Strasbourg.");
  });

  it("reste sous 155 caractères, même avec un nom de rayon très long (tronqué avec « … »)", () => {
    const longName = "Produits du monde entier et spécialités rares ".repeat(6).trim();
    const description = buildShelfDescription(longName, 120, 24 * 60 + 90);
    expect(META_DESCRIPTION_MAX_LENGTH).toBe(155);
    expect(description.length).toBeLessThanOrEqual(155);
    expect(description).toContain("…");
    expect(description).toContain("4 rue Sédillot à Strasbourg");
  });

  it("rejette un nombre de produits négatif ou non entier", () => {
    expect(() => buildShelfDescription("X", -1, null)).toThrow(/produits/);
    expect(() => buildShelfDescription("X", 1.5, null)).toThrow(/produits/);
  });
});

describe("buildRayonsDescription", () => {
  it("liste les noms des rayons sans rien inventer", () => {
    expect(buildRayonsDescription(["Boissons", "Confiserie"])).toBe("Les rayons de Chez Elia, épicerie de nuit au 4 rue Sédillot à Strasbourg : Boissons, Confiserie.");
  });

  it("sans rayon, garde la phrase de base et reste sous 155 caractères avec beaucoup de rayons", () => {
    expect(buildRayonsDescription([])).toBe("Les rayons de Chez Elia, épicerie de nuit au 4 rue Sédillot à Strasbourg.");
    const many = Array.from({ length: 40 }, (_, index) => `Rayon numéro ${index}`);
    expect(buildRayonsDescription(many).length).toBeLessThanOrEqual(155);
  });
});

describe("buildNeutralShelfSentence", () => {
  it("est la phrase neutre et vraie de l'énoncé", () => {
    expect(buildNeutralShelfSentence("Confiserie")).toBe("Tous les produits du rayon Confiserie disponibles chez Chez Elia, 4 rue Sédillot à Strasbourg.");
  });
});

describe("splitIntoParagraphs", () => {
  it("coupe sur les lignes vides, garde les retours à la ligne simples et ignore les blocs vides", () => {
    expect(splitIntoParagraphs("Un\nDeux\n\n\n  \nTrois\r\n\r\nQuatre")).toEqual(["Un\nDeux", "Trois", "Quatre"]);
  });

  it("renvoie une liste vide pour un texte vide ou blanc", () => {
    expect(splitIntoParagraphs("")).toEqual([]);
    expect(splitIntoParagraphs("  \n \n")).toEqual([]);
  });
});

describe("buildPageRobots", () => {
  it("garde le site fermé (ni index ni follow) tant que l'indexation globale est fermée, même pour une page indexable", () => {
    expect(buildPageRobots(false, true)).toEqual({ index: false, follow: false });
  });

  it("autorise l'indexation d'une page indexable quand le site est ouvert", () => {
    expect(buildPageRobots(true, true)).toEqual({ index: true, follow: true });
  });

  it("une page mince n'est pas indexée mais ses liens sont suivis", () => {
    expect(buildPageRobots(true, false)).toEqual({ index: false, follow: true });
  });
});

describe("buildPageMetadata", () => {
  const input = { title: "Confiserie à Strasbourg | Chez Elia", description: "Description.", path: "/rayons/confiserie", globalIndexing: true, pageIndexable: true };

  it("pose title, description, adresse canonique relative, Open Graph et Twitter", () => {
    const metadata = buildPageMetadata(input);
    expect(metadata.title).toBe(input.title);
    expect(metadata.description).toBe("Description.");
    expect(metadata.alternates).toEqual({ canonical: "/rayons/confiserie" });
    expect(metadata.openGraph).toMatchObject({ title: input.title, description: "Description.", type: "website", locale: "fr_FR", siteName: "Chez Elia" });
    expect(metadata.twitter).toMatchObject({ title: input.title, description: "Description." });
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });

  it("applique la règle de robots", () => {
    expect(buildPageMetadata({ ...input, pageIndexable: false }).robots).toEqual({ index: false, follow: true });
    expect(buildPageMetadata({ ...input, globalIndexing: false }).robots).toEqual({ index: false, follow: false });
  });

  it("rejette un chemin qui n'est pas interne", () => {
    expect(() => buildPageMetadata({ ...input, path: "//evil.example" })).toThrow(/Chemin invalide/);
  });
});

describe("buildBreadcrumbJsonLd", () => {
  const items = [
    { label: "Accueil", path: "/" },
    { label: "Rayons", path: "/rayons" },
    { label: "Confiserie", path: "/rayons/confiserie" },
  ];

  it("construit un BreadcrumbList de 3 niveaux avec des adresses absolues", () => {
    expect(buildBreadcrumbJsonLd(items, "https://chez-elia.fr")).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: "https://chez-elia.fr/" },
        { "@type": "ListItem", position: 2, name: "Rayons", item: "https://chez-elia.fr/rayons" },
        { "@type": "ListItem", position: 3, name: "Confiserie", item: "https://chez-elia.fr/rayons/confiserie" },
      ],
    });
  });

  it("est omis (null) si l'adresse du site est inconnue : rien n'est inventé", () => {
    expect(buildBreadcrumbJsonLd(items, null)).toBeNull();
  });

  it("rejette un fil d'Ariane vide", () => {
    expect(() => buildBreadcrumbJsonLd([], "https://chez-elia.fr")).toThrow(/vide/);
  });
});

describe("buildShelfIntroParagraphs", () => {
  it("reprend le texte des propriétaires paragraphe par paragraphe", () => {
    expect(buildShelfIntroParagraphs("Premier.\n\nSecond.", "Confiserie")).toEqual(["Premier.", "Second."]);
  });

  it.each([[null], [""], ["  \n\n "]])("retombe sur la phrase neutre et vraie quand le texte est absent ou blanc (%j)", (seoIntro) => {
    expect(buildShelfIntroParagraphs(seoIntro, "Confiserie")).toEqual([buildNeutralShelfSentence("Confiserie")]);
  });
});

describe("fils d'Ariane des pages", () => {
  it("rayon : Accueil › Rayons › <Nom>", () => {
    expect(buildRayonBreadcrumb("Confiserie", "confiserie")).toEqual([
      { label: "Accueil", path: "/" },
      { label: "Rayons", path: "/rayons" },
      { label: "Confiserie", path: "/rayons/confiserie" },
    ]);
  });

  it("liste des rayons : Accueil › Rayons", () => {
    expect(buildRayonsBreadcrumb()).toEqual([{ label: "Accueil", path: "/" }, { label: "Rayons", path: "/rayons" }]);
  });

  it("produits américains : Accueil › Produits américains", () => {
    expect(buildUsImportBreadcrumb()).toEqual([{ label: "Accueil", path: "/" }, { label: "Produits américains", path: "/produits-americains" }]);
  });
});

describe("textes de la page des produits américains", () => {
  it("est neutre et vrai", () => {
    expect(US_IMPORT_LABEL).toBe("Produits américains");
    expect(US_IMPORT_INTRO).toBe("Les produits importés des États-Unis disponibles chez Chez Elia, 4 rue Sédillot à Strasbourg.");
  });
});
