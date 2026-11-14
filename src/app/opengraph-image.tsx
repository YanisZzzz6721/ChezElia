import { ImageResponse } from "next/og";

export const alt = "Chez Elia — Votre épicerie de nuit à Strasbourg";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Aperçu de partage (WhatsApp, réseaux sociaux, messages) : texte seul aux couleurs du site, aucune photo. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px", background: "#5b21d6", color: "#ffffff" }}>
        <div style={{ display: "flex", alignSelf: "flex-start", padding: "10px 26px", background: "#ffd60a", color: "#12051f", fontSize: 54, fontWeight: 800, border: "6px solid #ffffff", transform: "rotate(-3deg)" }}>
          Chez Elia
        </div>
        <div style={{ marginTop: 48, fontSize: 92, fontWeight: 800, lineHeight: 1.05 }}>Votre épicerie de nuit à Strasbourg</div>
        <div style={{ marginTop: 36, fontSize: 38, color: "#e6d6ff" }}>Boissons, snacks, confiseries et produits américains</div>
        <div style={{ marginTop: 18, fontSize: 32, color: "#ffd60a" }}>4 rue Sédillot · Ouvert tard</div>
      </div>
    ),
    size,
  );
}
