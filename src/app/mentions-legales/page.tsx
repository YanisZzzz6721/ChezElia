import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { LEGAL } from "@/content/legal";
import { SITE } from "@/content/site";
import { valueOrPlaceholder } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Mentions légales — Chez Elia, épicerie de nuit à Strasbourg",
  description: "Mentions légales du site de Chez Elia, épicerie de nuit au 4 rue Sédillot à Strasbourg.",
};

export default function LegalNoticePage() {
  return (
    <LegalPage title="Mentions légales">
      <h2>Éditeur du site</h2>
      <ul>
        <li>Nom ou raison sociale : {valueOrPlaceholder(LEGAL.publisherName)}</li>
        <li>Forme juridique : {valueOrPlaceholder(LEGAL.legalForm)}</li>
        <li>SIRET : {valueOrPlaceholder(LEGAL.siret)}</li>
        <li>Adresse : {SITE.address}</li>
        <li>E-mail : {valueOrPlaceholder(LEGAL.contactEmail)}</li>
      </ul>
      <h2>Directeur de la publication</h2>
      <p>{valueOrPlaceholder(LEGAL.publicationDirector)}</p>
      <h2>Hébergeur</h2>
      <ul>
        <li>Nom : {valueOrPlaceholder(LEGAL.hostName)}</li>
        <li>Adresse : {valueOrPlaceholder(LEGAL.hostAddress)}</li>
      </ul>
      <h2>Données personnelles</h2>
      <p>Voir la <Link href="/confidentialite">politique de confidentialité</Link>.</p>
    </LegalPage>
  );
}
