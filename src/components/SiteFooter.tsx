import Link from "next/link";
import { SITE } from "@/content/site";
import { Logo } from "./Logo";

/** Pied de page : nom, adresse et liens légaux obligatoires. */
export function SiteFooter() {
  return (
    <footer className="s-foot" data-reveal>
      <div className="s-foot__logo"><Logo size="footer" href="/" /></div>
      <p>{SITE.name} · {SITE.address}</p>
      <p>
        <Link href="/mentions-legales">Mentions légales</Link>
        {" · "}
        <Link href="/confidentialite">Politique de confidentialité</Link>
      </p>
    </footer>
  );
}
