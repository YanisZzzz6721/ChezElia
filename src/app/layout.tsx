import type { Metadata, Viewport } from "next";
import { Anton, Archivo, Permanent_Marker } from "next/font/google";
import "@/styles/site.css";
import "@/styles/overrides.css";
import { MotionProvider } from "@/components/MotionProvider";
import { getSeoConfig } from "@/lib/seoConfig";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton", display: "swap" });
const archivo = Archivo({ weight: ["400", "500", "700", "800"], subsets: ["latin"], variable: "--font-archivo", display: "swap" });
const marker = Permanent_Marker({ weight: "400", subsets: ["latin"], variable: "--font-marker", display: "swap" });

const SITE_TITLE = "Chez Elia — Votre épicerie de nuit à Strasbourg";
const SITE_DESCRIPTION = "Chez Elia, épicerie de nuit au 4 rue Sédillot à Strasbourg : boissons, snacks, confiseries et produits américains, ouverts tard.";

/**
 * Quoi : métadonnées communes du site (titre, description, partage social, indexation).
 * Input : aucun (lit la configuration SEO).
 * Output : les métadonnées ; l'indexation n'est autorisée que si l'interrupteur, le domaine et les mentions légales le permettent.
 * Effets de bord : aucun.
 */
export function generateMetadata(): Metadata {
  const { siteUrl, indexing } = getSeoConfig();
  return {
    ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    alternates: { canonical: "/" },
    openGraph: { type: "website", locale: "fr_FR", siteName: "Chez Elia", title: SITE_TITLE, description: SITE_DESCRIPTION },
    twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
    robots: { index: indexing, follow: indexing },
  };
}

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
