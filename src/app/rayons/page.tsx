import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { InnerPageShell } from "@/components/InnerPageShell";
import { JsonLdScript } from "@/components/JsonLdScript";
import { RayonsList } from "@/components/RayonsList";
import { listCategoriesWithProducts } from "@/lib/catalogue";
import { getSeoConfig } from "@/lib/seoConfig";
import { listIndexableCategories } from "@/lib/shelfPages";
import { buildBreadcrumbJsonLd, buildPageMetadata, buildRayonsBreadcrumb, buildRayonsDescription } from "@/lib/shelfSeo";
import { fetchSiteData } from "@/lib/siteQueries";

/** Les données viennent de la base ; la page est régénérée toutes les minutes et à chaque modification d'admin. */
export const revalidate = 60;

/**
 * Quoi : métadonnées de la liste des rayons.
 * Input : aucun.
 * Output : titre, description (noms des rayons non vides), canonical, Open Graph ; indexable si au moins un rayon est lui-même indexable.
 * Effets de bord : lecture Supabase (anonyme). Lève une Error explicite si la lecture échoue.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { categories, products } = await fetchSiteData();
  const rayons = listCategoriesWithProducts(categories, products);
  return buildPageMetadata({
    title: "Nos rayons à Strasbourg | Chez Elia",
    description: buildRayonsDescription(rayons.map((rayon) => rayon.label)),
    path: "/rayons",
    globalIndexing: getSeoConfig().indexing,
    pageIndexable: listIndexableCategories(categories, products).length > 0,
  });
}

export default async function RayonsPage() {
  const { categories, products, socialLinks } = await fetchSiteData();
  const rayons = listCategoriesWithProducts(categories, products);
  const breadcrumb = buildRayonsBreadcrumb();
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(breadcrumb, getSeoConfig().siteUrl);
  return (
    <>
      {breadcrumbJsonLd ? <JsonLdScript data={breadcrumbJsonLd} /> : null}
      <InnerPageShell socialLinks={socialLinks} rayons={rayons}>
        <Breadcrumb items={breadcrumb} />
        <h1 className="b-h2 r-h1">Nos <span>rayons</span></h1>
        <RayonsList rayons={rayons} products={products} />
      </InnerPageShell>
    </>
  );
}
