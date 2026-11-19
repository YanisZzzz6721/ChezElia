import type { Category, Product } from "@/content/products";
import type { SocialLink } from "@/content/social";
import type { BreadcrumbItem } from "@/lib/shelfSeo";
import { Breadcrumb } from "./Breadcrumb";
import { InnerPageShell } from "./InnerPageShell";
import { ProductCard } from "./ProductCard";

interface ShelfPageProps {
  breadcrumb: readonly BreadcrumbItem[];
  /** Début du titre H1, suivi de « à Strasbourg » (ex. « Confiserie »). */
  headingStart: string;
  /** Paragraphes de présentation (au moins un). Les retours à la ligne simples sont conservés à l'affichage. */
  introParagraphs: readonly string[];
  /** Mention de santé affichée avant la grille (rayon des alcools), ou null. */
  healthNotice: string | null;
  products: readonly Product[];
  socialLinks: readonly SocialLink[];
  rayons: readonly Category[];
}

/**
 * Quoi : page publique d'un ensemble de produits (rayon ou « produits américains ») : fil d'Ariane, H1, présentation, mention de santé éventuelle, grille.
 * Input : voir ShelfPageProps.
 * Output : la page complète ; une grille vide est remplacée par un message prévu. Tous les textes venus de la base sont échappés par React.
 * Effets de bord : aucun (composant pur).
 */
export function ShelfPage({ breadcrumb, headingStart, introParagraphs, healthNotice, products, socialLinks, rayons }: ShelfPageProps) {
  return (
    <InnerPageShell socialLinks={socialLinks} rayons={rayons}>
      <Breadcrumb items={breadcrumb} />
      <h1 className="b-h2 r-h1">{headingStart} <span>à Strasbourg</span></h1>
      <div className="r-intro">
        {introParagraphs.map((paragraph, index) => (
          <p key={index} className="b-intro">{paragraph}</p>
        ))}
      </div>
      <p className="b-count">{products.length} produit{products.length > 1 ? "s" : ""}</p>
      {healthNotice !== null ? <p className="b-legal" role="note">{healthNotice}</p> : null}
      {products.length === 0 ? (
        <div className="b-empty"><p>Aucun produit à afficher pour l’instant.</p></div>
      ) : (
        <div className="b-grid">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}
    </InnerPageShell>
  );
}
