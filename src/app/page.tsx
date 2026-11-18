import { Catalogue } from "@/components/Catalogue";
import { FaqSection } from "@/components/FaqSection";
import { FindUsSection } from "@/components/FindUsSection";
import { GrainFilter } from "@/components/GrainFilter";
import { Hero } from "@/components/Hero";
import { ServicesSection } from "@/components/ServicesSection";
import { SiteFooter } from "@/components/SiteFooter";
import { VisitSection } from "@/components/VisitSection";
import { fetchSiteData } from "@/lib/siteQueries";
import { getSeoConfig } from "@/lib/seoConfig";
import { buildStoreJsonLd, serializeJsonLd } from "@/lib/structuredData";

/** Les données viennent de la base ; la page est régénérée toutes les minutes et à chaque modification d'admin. */
export const revalidate = 60;

export default async function HomePage() {
  const { settings, hours, categories, products, faqItems, services, socialLinks, heroPhotoUrl } = await fetchSiteData();
  const { siteUrl } = getSeoConfig();
  const heroPhoto = settings.heroPhoto && heroPhotoUrl ? { ...settings.heroPhoto, url: heroPhotoUrl } : null;

  return (
    <div className="b-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildStoreJsonLd(hours, settings.phoneNumber, { siteUrl, imageUrl: heroPhotoUrl, socialUrls: socialLinks.map((link) => link.url) })) }}
      />
      <GrainFilter />
      <Hero tag={settings.tag} lead={settings.lead} phoneNumber={settings.phoneNumber} photo={heroPhoto} socialLinks={socialLinks} />
      <VisitSection hours={hours} phoneNumber={settings.phoneNumber} />
      <ServicesSection services={services} />
      <Catalogue categories={categories} products={products} />
      <FaqSection items={faqItems} />
      <FindUsSection phoneNumber={settings.phoneNumber} />
      <SiteFooter socialLinks={socialLinks} />
    </div>
  );
}
