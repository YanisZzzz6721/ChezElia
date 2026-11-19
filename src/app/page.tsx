import { Catalogue } from "@/components/Catalogue";
import { FaqSection } from "@/components/FaqSection";
import { FindUsSection } from "@/components/FindUsSection";
import { GrainFilter } from "@/components/GrainFilter";
import { Hero } from "@/components/Hero";
import { JsonLdScript } from "@/components/JsonLdScript";
import { ServicesSection } from "@/components/ServicesSection";
import { SiteFooter } from "@/components/SiteFooter";
import { VisitSection } from "@/components/VisitSection";
import type { Metadata } from "next";
import { listCategoriesWithProducts } from "@/lib/catalogue";
import { buildHomeDescription, HOME_TITLE } from "@/lib/homeSeo";
import { fetchSiteData } from "@/lib/siteQueries";
import { getSeoConfig } from "@/lib/seoConfig";
import { buildStoreJsonLd, buildWebSiteJsonLd } from "@/lib/structuredData";

/** Les données viennent de la base ; la page est régénérée toutes les minutes et à chaque modification d'admin. */
export const revalidate = 60;

/**
 * Quoi : métadonnées de l'accueil (titre validé, description calculée depuis les horaires de la base, partage social).
 * Input : aucun (lit les horaires ; Next déduplique la lecture avec celle de la page).
 * Output : titre, description, Open Graph et Twitter de l'accueil ; l'adresse canonique et l'indexation restent celles du layout.
 * Effets de bord : lecture Supabase (anonyme). Lève une Error explicite si la lecture échoue ou si les horaires sont invalides.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { hours } = await fetchSiteData();
  const description = buildHomeDescription(hours);
  return {
    title: HOME_TITLE,
    description,
    openGraph: { type: "website", locale: "fr_FR", siteName: "Chez Elia", title: HOME_TITLE, description },
    twitter: { card: "summary_large_image", title: HOME_TITLE, description },
  };
}

export default async function HomePage() {
  const { settings, hours, categories, products, faqItems, services, socialLinks, heroPhotoUrl } = await fetchSiteData();
  const { siteUrl } = getSeoConfig();
  const webSiteJsonLd = buildWebSiteJsonLd(siteUrl);
  const heroPhoto = settings.heroPhoto && heroPhotoUrl ? { ...settings.heroPhoto, url: heroPhotoUrl } : null;

  return (
    <div className="b-page">
      <JsonLdScript data={buildStoreJsonLd(hours, settings.phoneNumber, { siteUrl, imageUrl: heroPhotoUrl, socialUrls: socialLinks.map((link) => link.url), description: buildHomeDescription(hours) })} />
      {webSiteJsonLd ? <JsonLdScript data={webSiteJsonLd} /> : null}
      <GrainFilter />
      <Hero tag={settings.tag} lead={settings.lead} phoneNumber={settings.phoneNumber} photo={heroPhoto} socialLinks={socialLinks} />
      <VisitSection hours={hours} phoneNumber={settings.phoneNumber} />
      <ServicesSection services={services} />
      <Catalogue categories={categories} products={products} />
      <FaqSection items={faqItems} />
      <FindUsSection phoneNumber={settings.phoneNumber} />
      <SiteFooter socialLinks={socialLinks} rayons={listCategoriesWithProducts(categories, products)} />
    </div>
  );
}
