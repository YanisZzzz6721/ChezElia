import { HOURS_NOTE, type DayHours } from "@/content/hours";
import { formatDayHours } from "@/lib/hours";
import { staggerStyle } from "@/lib/motion";
import { ActionButtons } from "./ActionButtons";
import { Address } from "./Address";

/**
 * Quoi : ticket d'horaires de la semaine.
 * Input : hours — les horaires de la semaine.
 * Output : le ticket, une ligne par jour (« Fermé » mis en forme à part).
 * Effets de bord : aucun (composant pur). Lève une Error si une ligne d'horaires est incohérente.
 */
function HoursTicket({ hours }: { hours: readonly DayHours[] }) {
  return (
    <div className="p-tk" data-reveal>
      <span className="b-hours__tube" aria-hidden="true" />
      <div className="b-ticket">
        <div className="b-ticket__paper">
          <h2 className="b-h2t" id="b-h-hor">Horaires</h2>
          <ul>
            {hours.map((hours) => (
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
export function VisitSection({ hours, phoneNumber }: { hours: readonly DayHours[]; phoneNumber: string | null }) {
  return (
    <section className="p-visit" id="horaires" aria-labelledby="b-h-hor">
      <div className="p-visit__in">
        <HoursTicket hours={hours} />
        <div className="p-visit__side" data-reveal style={staggerStyle(2)}>
          <h2 className="p-visit__h">Venir <span>au magasin</span></h2>
          <Address />
          <ActionButtons phoneNumber={phoneNumber} />
        </div>
      </div>
    </section>
  );
}
