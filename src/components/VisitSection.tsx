import { HOURS_NOTE, OPENING_HOURS } from "@/content/hours";
import { formatDayHours } from "@/lib/hours";
import { ActionButtons } from "./ActionButtons";
import { Address } from "./Address";

/**
 * Quoi : ticket d'horaires de la semaine.
 * Input : aucun (lit OPENING_HOURS).
 * Output : le ticket, une ligne par jour (« Fermé » mis en forme à part).
 * Effets de bord : aucun (composant pur). Lève une Error si une ligne d'horaires est incohérente.
 */
function HoursTicket() {
  return (
    <div className="p-tk">
      <span className="b-hours__tube" aria-hidden="true" />
      <div className="b-ticket">
        <div className="b-ticket__paper">
          <h2 className="b-h2t" id="b-h-hor">Horaires</h2>
          <ul>
            {OPENING_HOURS.map((hours) => (
              <li key={hours.day} className={hours.isClosed ? "off" : undefined}>
                <b>{hours.day}</b>
                <i />
                <span>{formatDayHours(hours)}</span>
              </li>
            ))}
          </ul>
          <p>{HOURS_NOTE}</p>
        </div>
      </div>
    </div>
  );
}

/** Horaires (tableau statique, sans « ouvert maintenant ») + adresse et boutons. */
export function VisitSection() {
  return (
    <section className="p-visit" id="horaires" aria-labelledby="b-h-hor">
      <div className="p-visit__in">
        <HoursTicket />
        <div className="p-visit__side">
          <h2 className="p-visit__h">Venir <span>au magasin</span></h2>
          <Address />
          <ActionButtons />
        </div>
      </div>
    </section>
  );
}
