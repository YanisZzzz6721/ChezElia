/** Réseaux sociaux affichables sur le site. */
export type SocialNetworkName = "instagram" | "tiktok" | "snapchat";

/** Clé du réglage (table `site_settings`) qui porte l'adresse d'un réseau. */
export type SocialSettingKey = `social_${SocialNetworkName}`;

export interface SocialNetwork {
  name: SocialNetworkName;
  label: string;
  settingKey: SocialSettingKey;
  /** Seuls hôtes acceptés (comparaison exacte : un hôte qui ne fait que contenir le domaine est refusé). */
  allowedHosts: readonly string[];
}

/** Un lien prêt à afficher (source unique du type : Hero, pied de page et rangée d'icônes l'importent d'ici). */
export interface SocialLink {
  network: SocialNetworkName;
  label: string;
  url: string;
}

export const SOCIAL_NETWORKS: readonly SocialNetwork[] = [
  { name: "instagram", label: "Instagram", settingKey: "social_instagram", allowedHosts: ["instagram.com", "www.instagram.com"] },
  { name: "tiktok", label: "TikTok", settingKey: "social_tiktok", allowedHosts: ["tiktok.com", "www.tiktok.com"] },
  { name: "snapchat", label: "Snapchat", settingKey: "social_snapchat", allowedHosts: ["snapchat.com", "www.snapchat.com"] },
];

/** Longueur maximale d'une adresse de réseau social, en caractères. */
export const SOCIAL_URL_MAX_LENGTH = 300;

/** Résultat de validation : `data` vaut null quand le champ est vide (réseau masqué). */
export type SocialUrlResult = { ok: true; data: string | null } | { ok: false; error: string };

/**
 * Quoi : retrouve la description d'un réseau social.
 * Input : name — nom du réseau.
 * Output : la description du réseau. Lève une Error si le nom est inconnu (erreur de programmation).
 * Effets de bord : aucun (fonction pure).
 */
export function getSocialNetwork(name: SocialNetworkName): SocialNetwork {
  const network = SOCIAL_NETWORKS.find((candidate) => candidate.name === name);
  if (!network) throw new Error(`Réseau social inconnu : « ${name} ».`);
  return network;
}

/** Lit une adresse ; renvoie null si elle est illisible (le refus est expliqué par l'appelant). */
function readUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

/**
 * Quoi : valide l'adresse du compte d'un réseau social saisie par un administrateur ou lue en base.
 * Input : network — réseau concerné ; raw — texte saisi (peut être vide ou contenir des espaces autour).
 * Output : { ok: true, data: null } si vide (réseau masqué) ; { ok: true, data: url } avec l'adresse normalisée
 *   si c'est une URL https, sans identifiants ni port, dont l'hôte est exactement l'un des domaines du réseau ;
 *   sinon { ok: false, error } explicite en français.
 * Effets de bord : aucun (fonction pure).
 */
export function parseSocialUrl(network: SocialNetworkName, raw: string): SocialUrlResult {
  const { label, allowedHosts } = getSocialNetwork(network);
  const trimmed = raw.trim();
  if (trimmed === "") return { ok: true, data: null };

  const tooLong = { ok: false, error: `L'adresse ${label} est trop longue (${SOCIAL_URL_MAX_LENGTH} caractères maximum).` } as const;
  if (trimmed.length > SOCIAL_URL_MAX_LENGTH) return tooLong;
  if (/\s/.test(trimmed)) return { ok: false, error: `L'adresse ${label} ne doit contenir aucun espace.` };

  const url = readUrl(trimmed);
  if (!url) return { ok: false, error: `L'adresse ${label} n'est pas valide : collez l'adresse complète, qui commence par https://.` };
  if (url.protocol !== "https:") return { ok: false, error: `L'adresse ${label} doit commencer par https://.` };
  if (url.username !== "" || url.password !== "" || url.port !== "") {
    return { ok: false, error: `L'adresse ${label} ne doit contenir ni identifiant ni numéro de port.` };
  }
  if (!allowedHosts.includes(url.hostname)) {
    return { ok: false, error: `L'adresse ${label} doit pointer vers ${allowedHosts.join(" ou ")}.` };
  }
  if (url.href.length > SOCIAL_URL_MAX_LENGTH) return tooLong;
  return { ok: true, data: url.href };
}
