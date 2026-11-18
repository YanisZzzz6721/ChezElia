import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PasswordInput, passwordToggleState } from "./PasswordInput";

describe("passwordToggleState", () => {
  it("mot de passe masqué : champ de type password, bouton « Afficher »", () => {
    expect(passwordToggleState(false)).toEqual({ inputType: "password", buttonLabel: "Afficher le mot de passe" });
  });

  it("mot de passe affiché : champ texte, bouton « Masquer »", () => {
    expect(passwordToggleState(true)).toEqual({ inputType: "text", buttonLabel: "Masquer le mot de passe" });
  });
});

describe("PasswordInput", () => {
  const html = renderToStaticMarkup(<PasswordInput id="password" name="password" autoComplete="current-password" />);

  it("est masqué au chargement, avec les attributs du champ d'origine", () => {
    expect(html).toContain('type="password"');
    expect(html).toContain('name="password"');
    expect(html).toMatch(/autocomplete="current-password"/i);
    expect(html).toContain("required");
  });

  it("affiche un bouton œil accessible qui n'envoie pas le formulaire", () => {
    expect(html).toContain('type="button"');
    expect(html).toContain('aria-label="Afficher le mot de passe"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('aria-controls="password"');
  });
});
