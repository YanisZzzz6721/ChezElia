import { Catalogue } from "@/components/Catalogue";
import { GrainFilter } from "@/components/GrainFilter";
import { Hero } from "@/components/Hero";
import { SiteFooter } from "@/components/SiteFooter";
import { VisitSection } from "@/components/VisitSection";
import { fetchSiteData } from "@/lib/siteQueries";
import { buildStoreJsonLd, serializeJsonLd } from "@/lib/structuredData";

/** Les données viennent de la base ; la page est régénérée toutes les minutes et à chaque modification d'admin. */
export const revalidate = 60;

export default async function HomePage() {
  const { settings, hours, categories, products, heroPhotoUrl } = await fetchSiteData();
  const heroPhoto = settings.heroPhoto && heroPhotoUrl ? { ...settings.heroPhoto, url: heroPhotoUrl } : null;

  return (
    <div className="b-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildStoreJsonLd(hours, settings.phoneNumber)) }}
      />
      <GrainFilter />
      <Hero tag={settings.tag} lead={settings.lead} phoneNumber={settings.phoneNumber} photo={heroPhoto} />
      <VisitSection hours={hours} phoneNumber={settings.phoneNumber} />
      <Catalogue categories={categories} products={products} />
      <SiteFooter />
    </div>
  );
}
