import { toTelHref } from "@/lib/phone";
import { PhoneIcon } from "./Icons";

interface CallButtonProps {
  /** Numéro public (normalisé), ou null tant qu'il n'est pas fourni. */
  phoneNumber: string | null;
  /** Affiche l'icône téléphone (désactivée dans la barre mobile, où la place manque). */
  showIcon: boolean;
}

/**
 * Quoi : bouton « Appeler ».
 * Input : phoneNumber — numéro public ou null ; showIcon — afficher ou non l'icône téléphone.
 * Output : un lien `tel:` si le numéro public est fourni, sinon un bouton désactivé « numéro à venir ».
 * Effets de bord : aucun (composant pur). Aucun numéro n'est jamais inventé.
 */
export function CallButton({ phoneNumber, showIcon }: CallButtonProps) {
  const label = (
    <span className="b-btn__row">
      {showIcon ? <PhoneIcon /> : null}
      Appeler
    </span>
  );

  if (phoneNumber) {
    return (
      <a className="b-btn b-btn--ghost" href={toTelHref(phoneNumber)}>
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
