import Link from "next/link";
import { GrainFilter } from "@/components/GrainFilter";
import { SiteFooter } from "@/components/SiteFooter";

export default function NotFound() {
  return (
    <div className="b-page">
      <GrainFilter />
      <main className="s-legal">
        <h1 className="s-legal__h1">Page introuvable</h1>
        <p>Cette page n’existe pas ou a été déplacée.</p>
        <p><Link className="s-legal__back" href="/">← Retour à l’accueil</Link></p>
      </main>
      <SiteFooter />
    </div>
  );
}
