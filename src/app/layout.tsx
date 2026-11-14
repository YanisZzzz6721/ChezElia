import type { Metadata, Viewport } from "next";
import { Anton, Archivo, Permanent_Marker } from "next/font/google";
import "@/styles/site.css";
import "@/styles/overrides.css";
import { MotionProvider } from "@/components/MotionProvider";

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

/** Pose data-anim="on" si JavaScript tourne et que le visiteur n'a pas demandé moins d'animations. Contenu fixe, sans donnée externe. */
const EARLY_MOTION_SCRIPT = "try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.dataset.anim='on'}catch(e){}";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${anton.variable} ${archivo.variable} ${marker.variable}`} suppressHydrationWarning>
      <head>
        {/* Active les animations d'apparition AVANT le premier affichage (sinon le contenu apparaît puis se cache puis réapparaît). */}
        <script dangerouslySetInnerHTML={{ __html: EARLY_MOTION_SCRIPT }} />
        <noscript><style>{"[data-reveal]{opacity:1 !important}"}</style></noscript>
      </head>
      <body style={{ margin: 0, background: "#12051f" }}>
        <MotionProvider />
        {children}
      </body>
    </html>
  );
}
