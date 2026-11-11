import { Catalogue } from "@/components/Catalogue";
import { GrainFilter } from "@/components/GrainFilter";
import { Hero } from "@/components/Hero";
import { VisitSection } from "@/components/VisitSection";

export default function HomePage() {
  return (
    <div className="b-page">
      <GrainFilter />
      <Hero />
      <VisitSection />
      <Catalogue />
    </div>
  );
}
