import type { Metadata, Viewport } from "next";
import { Anton, Archivo, Permanent_Marker } from "next/font/google";
import "@/styles/site.css";
import "@/styles/overrides.css";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton", display: "swap" });
const archivo = Archivo({ weight: ["400", "500", "700", "800"], subsets: ["latin"], variable: "--font-archivo", display: "swap" });
const marker = Permanent_Marker({ weight: "400", subsets: ["latin"], variable: "--font-marker", display: "swap" });

export const metadata: Metadata = {
  title: "Chez Elia — Votre épicerie de nuit à Strasbourg",
  description:
    "Chez Elia, épicerie de nuit au 4 rue Sédillot à Strasbourg : boissons, snacks, confiseries et produits américains.",
  // Préproduction : pas d'indexation avant l'ordre de mise en ligne.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#5b21d6" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${anton.variable} ${archivo.variable} ${marker.variable}`}>
      <body style={{ margin: 0, background: "#12051f" }}>{children}</body>
    </html>
  );
}
