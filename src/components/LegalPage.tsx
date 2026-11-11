import Link from "next/link";
import { GrainFilter } from "./GrainFilter";
import { SiteFooter } from "./SiteFooter";

interface LegalPageProps {
  title: string;
  children: React.ReactNode;
}

/** Gabarit commun des pages légales (retour à l'accueil, titre H1 unique, contenu, pied de page). */
export function LegalPage({ title, children }: LegalPageProps) {
  return (
    <div className="b-page">
      <GrainFilter />
      <main className="s-legal">
        <Link className="s-legal__back" href="/">← Retour à l’accueil</Link>
        <h1 className="s-legal__h1">{title}</h1>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
