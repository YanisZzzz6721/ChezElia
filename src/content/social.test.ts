import { describe, expect, it } from "vitest";
import { SOCIAL_NETWORKS, SOCIAL_URL_MAX_LENGTH, parseSocialUrl } from "./social";

describe("SOCIAL_NETWORKS", () => {
  it("décrit les trois réseaux avec leur clé de réglage et leurs domaines", () => {
    expect(SOCIAL_NETWORKS.map((n) => [n.name, n.settingKey, n.label])).toEqual([
      ["instagram", "social_instagram", "Instagram"],
      ["tiktok", "social_tiktok", "TikTok"],
      ["snapchat", "social_snapchat", "Snapchat"],
    ]);
    expect(SOCIAL_NETWORKS.find((n) => n.name === "tiktok")?.allowedHosts).toEqual(["tiktok.com", "www.tiktok.com"]);
  });
});

describe("parseSocialUrl : cas acceptés", () => {
  it("accepte une adresse https du bon domaine et la renvoie normalisée", () => {
    expect(parseSocialUrl("instagram", "https://www.instagram.com/chez.elia/")).toEqual({ ok: true, data: "https://www.instagram.com/chez.elia/" });
    expect(parseSocialUrl("tiktok", "https://tiktok.com/@chez.elia")).toEqual({ ok: true, data: "https://tiktok.com/@chez.elia" });
    expect(parseSocialUrl("snapchat", "https://www.snapchat.com/add/chezelia")).toEqual({ ok: true, data: "https://www.snapchat.com/add/chezelia" });
  });

  it("retire les espaces autour et met l'hôte en minuscules", () => {
    expect(parseSocialUrl("instagram", "  HTTPS://WWW.Instagram.com/chez.elia  ")).toEqual({ ok: true, data: "https://www.instagram.com/chez.elia" });
  });

  it("vide ou espaces seuls : null (réseau masqué)", () => {
    expect(parseSocialUrl("instagram", "")).toEqual({ ok: true, data: null });
    expect(parseSocialUrl("tiktok", "   \n ")).toEqual({ ok: true, data: null });
  });
});

describe("parseSocialUrl : cas refusés", () => {
  const refused: [string, string][] = [
    ["http (non sécurisé)", "http://www.instagram.com/chez.elia"],
    ["javascript:", "javascript:alert(1)"],
    ["data:", "data:text/html,<script>alert(1)</script>"],
    ["mauvais domaine", "https://www.facebook.com/chez.elia"],
    ["domaine d'un autre réseau", "https://www.tiktok.com/@chez.elia"],
    ["sous-domaine piège (le domaine n'est que contenu)", "https://instagram.com.evil.fr/chez.elia"],
    ["domaine collé à un autre", "https://eviginstagram.com/chez.elia"],
    ["sous-domaine non prévu", "https://evil.instagram.com/chez.elia"],
    ["identifiants dans l'adresse", "https://user:pass@www.instagram.com/chez.elia"],
    ["identifiant seul qui masque l'hôte", "https://www.instagram.com@evil.fr/chez.elia"],
    ["port inhabituel", "https://www.instagram.com:8443/chez.elia"],
    ["pas une adresse", "chez.elia"],
    ["espace au milieu", "https://www.instagram.com/chez elia"],
    ["retour à la ligne au milieu", "https://www.instagram.com/chez\nelia"],
    ["hôte avec point final", "https://www.instagram.com./chez.elia"],
  ];
  for (const [label, raw] of refused) {
    it(`refuse : ${label}`, () => {
      const result = parseSocialUrl("instagram", raw);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/Instagram|adresse/i);
    });
  }

  it("refuse une adresse trop longue", () => {
    const tooLong = `https://www.instagram.com/${"a".repeat(SOCIAL_URL_MAX_LENGTH)}`;
    expect(parseSocialUrl("instagram", tooLong)).toMatchObject({ ok: false, error: expect.stringMatching(/trop longue/) });
  });

  it("accepte une adresse juste sous la limite", () => {
    const justOk = `https://www.instagram.com/${"a".repeat(SOCIAL_URL_MAX_LENGTH - "https://www.instagram.com/".length)}`;
    expect(parseSocialUrl("instagram", justOk)).toMatchObject({ ok: true });
  });
});
