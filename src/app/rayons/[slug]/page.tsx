import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLdScript } from "@/components/JsonLdScript";
import { ShelfPage } from "@/components/ShelfPage";
import type { Category, Product } from "@/content/products";
import { ALCOHOL_NOTICE, isAlcoholCategoryLabel, listCategoriesWithProducts } from "@/lib/catalogue";
import { findLatestClosing } from "@/lib/homeSeo";
import { getSeoConfig } from "@/lib/seoConfig";
import { isCategoryPageIndexable } from "@/lib/shelfPages";
import {
  buildBreadcrumbJsonLd,
  buildPageMetadata,
  buildRayonBreadcrumb,
  buildShelfDescription,
  buildShelfIntroParagraphs,
  buildShelfTitle,
} from "@/lib/shelfSeo";
import { fetchCategoryPageData, fetchSiteData, type SiteData } from "@/lib/siteQueries";

/** Les données viennent de la base ; la page est régénérée toutes les minutes et à chaque modification d'admin. */
export const revalidate = 60;
/** Un rayon créé après le dernier déploiement est généré à la première visite. */
export const dynamicParams = true;

interface RayonPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Quoi : liste les adresses de rayon à générer à l'avance.
 * Input : aucun.
 * Output : un { slug } par catégorie.
 * Effets de bord : lecture Supabase (anonyme). Lève une Error explicite si la lecture échoue.
 */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const { categories } = await fetchSiteData();
  return categories.map((category) => ({ slug: category.slug }));
}

/**
 * Quoi : charge ce qu'il faut pour afficher un rayon (le rayon, ses produits, et les données communes du site).
 * Input : slug — adresse du rayon, telle qu'elle vient de l'URL.
 * Output : { category, products, site }.
 * Effets de bord : lectures Supabase (anonymes ; Next déduplique celles de generateMetadata et de la page). Répond 404 (notFound) si le rayon n'existe pas ;
 *   lève une Error explicite si une lecture échoue.
 */
async function loadRayonPage(slug: string): Promise<{ category: Category; products: Product[]; site: SiteData }> {
  const pageData = await fetchCategoryPageData(slug);
  if (pageData === null) notFound();
  const site = await fetchSiteData();
  return { ...pageData, site };
}

/**
 * Quoi : métadonnées d'un rayon (titre, description avec nombre de produits et heure de fermeture, canonical, Open Graph, indexation).
 * Input : params — { slug }.
 * Output : les métadonnées ; la page n'est indexable que si elle a un texte de présentation et au moins 6 produits visibles.
 * Effets de bord : lectures Supabase (anonymes). 404 si le rayon n'existe pas ; Error explicite si une lecture échoue ou si les horaires sont invalides.
 */
export async function generateMetadata({ params }: RayonPageProps): Promise<Metadata> {
  const { category, products, site } = await loadRayonPage((await params).slug);
  return buildPageMetadata({
    title: buildShelfTitle(category.label),
    description: buildShelfDescription(category.label, products.length, findLatestClosing(site.hours)),
    path: `/rayons/${category.slug}`,
    globalIndexing: getSeoConfig().indexing,
    pageIndexable: isCategoryPageIndexable(category, products),
  });
}

export default async function RayonPage({ params }: RayonPageProps) {
  const { category, products, site } = await loadRayonPage((await params).slug);
  const breadcrumb = buildRayonBreadcrumb(category.label, category.slug);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(breadcrumb, getSeoConfig().siteUrl);
  return (
    <>
      {breadcrumbJsonLd ? <JsonLdScript data={breadcrumbJsonLd} /> : null}
      <ShelfPage
        breadcrumb={breadcrumb}
        headingStart={category.label}
        introParagraphs={buildShelfIntroParagraphs(category.seoIntro, category.label)}
        healthNotice={isAlcoholCategoryLabel(category.label) ? ALCOHOL_NOTICE : null}
        products={products}
        socialLinks={site.socialLinks}
        rayons={listCategoriesWithProducts(site.categories, site.products)}
      />
    </>
  );
}
