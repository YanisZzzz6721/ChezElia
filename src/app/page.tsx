import { Catalogue } from "@/components/Catalogue";
import { GrainFilter } from "@/components/GrainFilter";
import { Hero } from "@/components/Hero";
import { SiteFooter } from "@/components/SiteFooter";
import { VisitSection } from "@/components/VisitSection";
import { OPENING_HOURS } from "@/content/hours";
import { buildStoreJsonLd, serializeJsonLd } from "@/lib/structuredData";

export default function HomePage() {
  return (
    <div className="b-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildStoreJsonLd(OPENING_HOURS)) }} />
      <GrainFilter />
      <Hero />
      <VisitSection />
      <Catalogue />
      <SiteFooter />
    </div>
  );
}
