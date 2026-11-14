import type { FaqItem } from "@/content/faq";
import { staggerStyle } from "@/lib/motion";

/**
 * Quoi : section « Questions fréquentes » (une question dépliable par ligne, toutes de même largeur).
 * Input : items — les questions saisies par les propriétaires, dans l'ordre d'affichage.
 * Output : la section ; rien du tout (null) si aucune question n'a été saisie.
 * Effets de bord : aucun (composant pur). Les réponses sont du texte : React les échappe, les retours à la ligne sont conservés par le style.
 */
export function FaqSection({ items }: { items: readonly FaqItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="f-faq" id="faq" aria-labelledby="faq-title">
      <div className="f-faq__in">
        <h2 className="b-h2 f-faq__h" id="faq-title" data-reveal>Questions <span>fréquentes</span></h2>
        <ul className="f-faq__list">
          {items.map((item, index) => (
            <li key={item.id} data-reveal style={staggerStyle(index % 4)}>
              <details className="f-q">
                <summary className="f-q__sum">
                  <h3 className="f-q__q">{item.question}</h3>
                </summary>
                <div className="f-q__a">
                  <p>{item.answer}</p>
                </div>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
