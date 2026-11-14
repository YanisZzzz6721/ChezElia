import { SITE } from "@/content/site";
import { staggerStyle } from "@/lib/motion";
import { CallButton } from "./CallButton";
import { ArrowIcon, PinIcon } from "./Icons";

/**
 * Quoi : section « Où nous trouver » : adresse, bouton d'itinéraire et bouton d'appel, centrés.
 * Input : phoneNumber — numéro public ou null (bouton « Appeler » désactivé tant qu'il n'est pas fourni).
 * Output : la section.
 * Effets de bord : aucun (composant pur). Aucun plan externe n'est chargé : le lien d'itinéraire s'ouvre dans Google Maps au clic seulement.
 */
export function FindUsSection({ phoneNumber }: { phoneNumber: string | null }) {
  return (
    <section className="f-find" id="acces" aria-labelledby="find-title">
      <div className="f-find__in">
        <h2 className="b-h2 f-find__h" id="find-title" data-reveal>Où nous <span>trouver</span></h2>
        <address className="f-find__card" data-reveal style={staggerStyle(1)}>
          <PinIcon />
          <strong>{SITE.name}</strong>
          <span>{SITE.address}</span>
        </address>
        <div className="f-find__actions" data-reveal style={staggerStyle(2)}>
          <a className="b-btn b-btn--primary" href={SITE.directionsUrl} target="_blank" rel="noopener noreferrer">
            <span className="b-btn__row">
              Itinéraire
              <ArrowIcon />
            </span>
          </a>
          <CallButton phoneNumber={phoneNumber} showIcon />
        </div>
      </div>
    </section>
  );
}
