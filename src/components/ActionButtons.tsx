import { SITE } from "@/content/site";
import { ArrowIcon } from "./Icons";
import { CallButton } from "./CallButton";

/** Boutons « Venir au magasin » (itinéraire) et « Appeler » du premier écran et de la section horaires. */
export function ActionButtons() {
  return (
    <div className="b-actions">
      <a className="b-btn b-btn--primary" href={SITE.directionsUrl} target="_blank" rel="noopener noreferrer">
        <span className="b-btn__row">
          Venir au magasin
          <ArrowIcon />
        </span>
      </a>
      <CallButton showIcon />
    </div>
  );
}
