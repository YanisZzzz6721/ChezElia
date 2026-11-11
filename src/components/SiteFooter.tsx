import Link from "next/link";
import { SITE } from "@/content/site";

/** Pied de page : nom, adresse et liens légaux obligatoires. */
export function SiteFooter() {
  return (
    <footer className="s-foot" data-reveal>
      <p>{SITE.name} · {SITE.address}</p>
      <p>
        <Link href="/mentions-legales">Mentions légales</Link>
        {" · "}
        <Link href="/confidentialite">Politique de confidentialité</Link>
      </p>
    </footer>
  );
}
