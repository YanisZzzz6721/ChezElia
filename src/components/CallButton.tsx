import { SITE } from "@/content/site";
import { PhoneIcon } from "./Icons";

interface CallButtonProps {
  /** Affiche l'icône téléphone (désactivée dans la barre mobile, où la place manque). */
  showIcon: boolean;
}

/**
 * Quoi : bouton « Appeler ».
 * Input : showIcon — afficher ou non l'icône téléphone.
 * Output : un lien `tel:` si le numéro public est fourni, sinon un bouton désactivé « numéro à venir ».
 * Effets de bord : aucun (composant pur). Aucun numéro n'est jamais inventé.
 */
export function CallButton({ showIcon }: CallButtonProps) {
  const label = (
    <span className="b-btn__row">
      {showIcon ? <PhoneIcon /> : null}
      Appeler
    </span>
  );

  if (SITE.phoneNumber) {
    return (
      <a className="b-btn b-btn--ghost" href={`tel:${SITE.phoneNumber}`}>
        {label}
      </a>
    );
  }
  return (
    <button className="b-btn b-btn--ghost" type="button" disabled aria-disabled="true">
      {label}
      <small>numéro à venir</small>
    </button>
  );
}
