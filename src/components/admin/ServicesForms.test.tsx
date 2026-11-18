import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SERVICE_BODY_MAX_LENGTH, SERVICE_HIGHLIGHT_MAX_LENGTH, SERVICE_ICONS, SERVICE_TITLE_MAX_LENGTH, type ServiceItem } from "@/content/services";
import { SOCIAL_NETWORKS, SOCIAL_URL_MAX_LENGTH } from "@/content/social";
import { CreateServiceForm, EditServiceForm } from "./ServicesForms";
import { SocialLinksForm } from "./SiteForms";

const service: ServiceItem = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Titre <b>test</b>",
  body: "Texte du service",
  highlight: "2,50 €",
  icon: "parcel",
  visible: false,
};

describe("CreateServiceForm", () => {
  const html = renderToStaticMarkup(<CreateServiceForm />);

  it("propose chaque icône par son libellé français, valeur = nom technique", () => {
    for (const { name, label } of SERVICE_ICONS) expect(html).toMatch(new RegExp(`<option value="${name}"( selected="")?>${label}</option>`));
  });

  it("aligne les longueurs maximales des champs sur celles de la base", () => {
    expect(html).toContain(`maxLength="${SERVICE_TITLE_MAX_LENGTH}"`);
    expect(html).toContain(`maxLength="${SERVICE_BODY_MAX_LENGTH}"`);
    expect(html).toContain(`maxLength="${SERVICE_HIGHLIGHT_MAX_LENGTH}"`);
  });

  it("sélectionne l'icône « sandwich » par défaut", () => {
    expect(html).toContain('<option value="sandwich" selected="">Sandwich</option>');
  });

  it("coche « Visible sur le site » par défaut et laisse la mention facultative", () => {
    expect(html).toMatch(/<input type="checkbox" name="visible" checked=""/);
    expect(html).toContain("Visible sur le site");
    expect(html).not.toMatch(/name="highlight"[^>]*required/);
  });
});

describe("EditServiceForm", () => {
  const html = renderToStaticMarkup(<EditServiceForm service={service} />);

  it("transmet l'identifiant et préremplit les valeurs", () => {
    expect(html).toContain(`name="id" value="${service.id}"`);
    expect(html).toContain('value="2,50 €"');
    expect(html).toContain("Texte du service");
    expect(html).toContain('<option value="parcel" selected="">Colis</option>');
  });

  it("échappe le HTML du titre", () => {
    expect(html).not.toContain("<b>test</b>");
    expect(html).toContain("&lt;b&gt;test&lt;/b&gt;");
  });

  it("ne coche pas « Visible » pour un service masqué", () => {
    expect(html).not.toMatch(/name="visible" checked/);
  });

  it("laisse la mention vide quand le service n'en a pas", () => {
    const withoutHighlight = renderToStaticMarkup(<EditServiceForm service={{ ...service, highlight: null }} />);
    expect(withoutHighlight).toMatch(/name="highlight" value=""/);
  });
});

describe("SocialLinksForm", () => {
  const html = renderToStaticMarkup(<SocialLinksForm urls={{ instagram: "https://www.instagram.com/compte/", tiktok: null, snapchat: null }} />);

  it("affiche un champ par réseau, dans l'ordre Instagram, TikTok, Snapchat, nommé comme le lit parseSocialSettingsForm", () => {
    const positions = SOCIAL_NETWORKS.map(({ name }) => html.indexOf(`name="${name}"`));
    expect(positions.every((position) => position > -1)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("préremplit l'adresse enregistrée et montre un exemple dans les champs vides", () => {
    expect(html).toContain('value="https://www.instagram.com/compte/"');
    expect(html).toContain('placeholder="https://www.tiktok.com/@votre-compte"');
    expect(html).toContain('placeholder="https://www.snapchat.com/add/votre-compte"');
  });

  it("explique qu'un champ vide masque le réseau et borne la longueur", () => {
    expect(html).toContain("Laissez vide pour ne pas afficher le réseau");
    expect(html).toContain(`maxLength="${SOCIAL_URL_MAX_LENGTH}"`);
  });
});
