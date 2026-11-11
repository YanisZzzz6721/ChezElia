import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { LEGAL } from "@/content/legal";
import { valueOrPlaceholder } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Chez Elia, épicerie de nuit à Strasbourg",
  description: "Politique de confidentialité du site de Chez Elia : ce site ne collecte aucune donnée personnelle.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Politique de confidentialité">
      <h2>Données collectées</h2>
      <p>
        Ce site est une vitrine : il ne comporte ni formulaire, ni compte visiteur, ni outil de mesure d’audience.
        Il ne collecte aucune donnée personnelle et ne dépose aucun cookie.
      </p>
      <h2>Liens externes</h2>
      <p>
        Le bouton « Venir au magasin » ouvre Google Maps dans un nouvel onglet. Les données échangées avec ce
        service sont régies par sa propre politique de confidentialité.
      </p>
      <h2>Vos droits</h2>
      <p>
        Conformément au RGPD, vous pouvez demander l’accès, la rectification ou l’effacement de vos données en
        écrivant à : {valueOrPlaceholder(LEGAL.contactEmail)}.
      </p>
    </LegalPage>
  );
}
