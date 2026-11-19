import { serializeJsonLd } from "@/lib/structuredData";

/**
 * Quoi : insère un bloc de données structurées JSON-LD dans la page.
 * Input : data — l'objet JSON-LD (contenu maîtrisé ; « < » est échappé par serializeJsonLd).
 * Output : la balise <script type="application/ld+json">.
 * Effets de bord : aucun.
 */
export function JsonLdScript({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
