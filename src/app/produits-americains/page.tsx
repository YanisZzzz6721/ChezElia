import type { Metadata } from "next";
import { JsonLdScript } from "@/components/JsonLdScript";
import { ShelfPage } from "@/components/ShelfPage";
import type { Product } from "@/content/products";
import { listCategoriesWithProducts } from "@/lib/catalogue";
import { findLatestClosing } from "@/lib/homeSeo";
import { getSeoConfig } from "@/lib/seoConfig";
import { isUsImportPageIndexable, listPublicUsImportProducts } from "@/lib/shelfPages";
import {
  US_IMPORT_INTRO,
  US_IMPORT_LABEL,
  buildBreadcrumbJsonLd,
  buildPageMetadata,
  buildShelfDescription,
  buildShelfTitle,
  buildUsImportBreadcrumb,
} from "@/lib/shelfSeo";
import { fetchSiteData, fetchUsImportProducts, type SiteData } from "@/lib/siteQueries";

/** Les données viennent de la base ; la page est régénérée toutes les minutes et à chaque modification d'admin. */
export const revalidate = 60;

/**
 * Quoi : charge les produits américains à afficher (alcools exclus) et les données communes du site.
 * Input : aucun.
 * Output : { products, site }.
 * Effets de bord : lectures Supabase (anonymes ; Next déduplique celles de generateMetadata et de la page). Lève une Error explicite si une lecture échoue.
 */
async function loadUsImportPage(): Promise<{ products: Product[]; site: SiteData }> {
  const [site, usImportProducts] = await Promise.all([fetchSiteData(), fetchUsImportProducts()]);
  return { products: listPublicUsImportProducts(usImportProducts, site.categories), site };
}

/**
 * Quoi : métadonnées de la page des produits américains.
 * Input : aucun.
 * Output : titre, description (nombre de produits, heure de fermeture), canonical, Open Graph ; indexable seulement avec au moins 6 produits.
 * Effets de bord : lectures Supabase (anonymes). Lève une Error explicite si une lecture échoue ou si les horaires sont invalides.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { products, site } = await loadUsImportPage();
  return buildPageMetadata({
    title: buildShelfTitle(US_IMPORT_LABEL),
    description: buildShelfDescription(US_IMPORT_LABEL, products.length, findLatestClosing(site.hours)),
    path: "/produits-americains",
    globalIndexing: getSeoConfig().indexing,
    pageIndexable: isUsImportPageIndexable(products),
  });
}

export default async function UsImportPage() {
  const { products, site } = await loadUsImportPage();
  const breadcrumb = buildUsImportBreadcrumb();
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(breadcrumb, getSeoConfig().siteUrl);
  return (
    <>
      {breadcrumbJsonLd ? <JsonLdScript data={breadcrumbJsonLd} /> : null}
      <ShelfPage
        breadcrumb={breadcrumb}
        headingStart={US_IMPORT_LABEL}
        introParagraphs={[US_IMPORT_INTRO]}
        healthNotice={null}
        products={products}
        socialLinks={site.socialLinks}
        rayons={listCategoriesWithProducts(site.categories, site.products)}
      />
    </>
  );
}
