import Link from "next/link";
import { SITE } from "@/content/site";
import { ArrowIcon, PinIcon } from "./Icons";

/**
 * Quoi : bloc « Où nous trouver » des pages secondaires : adresse, bouton d'itinéraire et lien vers les horaires de l'accueil.
 * Input : aucun.
 * Output : la section (mêmes classes que celle de l'accueil).
 * Effets de bord : aucun (composant pur). Aucun plan externe n'est chargé : l'itinéraire s'ouvre dans Google Maps au clic seulement.
 */
export function StoreAccessBlock() {
  return (
    <section className="f-find" aria-labelledby="find-title">
      <div className="f-find__in">
        <h2 className="b-h2 f-find__h" id="find-title">Où nous <span>trouver</span></h2>
        <address className="f-find__card">
          <PinIcon />
          <strong>{SITE.name}</strong>
          <span>{SITE.address}</span>
        </address>
        <div className="f-find__actions">
          <a className="b-btn b-btn--primary" href={SITE.directionsUrl} target="_blank" rel="noopener noreferrer">
            <span className="b-btn__row">
              Itinéraire
              <ArrowIcon />
            </span>
          </a>
          <Link className="b-btn b-btn--ghost" href="/#horaires">
            <span className="b-btn__row">Voir nos horaires</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
