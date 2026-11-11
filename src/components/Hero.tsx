import { SITE } from "@/content/site";
import { ActionButtons } from "./ActionButtons";
import { CallButton } from "./CallButton";
import { Address } from "./Address";
import { NeonShape } from "./NeonShape";
import { StorePhotoFrame, type StorePhotoFrameProps } from "./StorePhotoFrame";

const MAIN_NAV = [
  { href: "#catalogue", label: "Catalogue" },
  { href: "#horaires", label: "Horaires" },
] as const;

/**
 * Quoi : en-tête avec la marque et la navigation principale.
 * Input : aucun.
 * Output : le bloc d'en-tête (liens d'ancres + lien « Venir au magasin »).
 * Effets de bord : aucun (composant pur).
 */
function Header() {
  return (
    <header className="b-nav">
      <a className="b-brand" href="#top">{SITE.name}</a>
      <nav className="b-links" aria-label="Navigation principale">
        {MAIN_NAV.map((item) => (
          <a key={item.href} href={item.href}>{item.label}</a>
        ))}
        <a className="b-links__cta" href={SITE.directionsUrl} target="_blank" rel="noopener noreferrer">
          Venir au magasin
        </a>
      </nav>
    </header>
  );
}

function PhotoStage({ photo }: { photo: StorePhotoFrameProps["photo"] }) {
  return (
    <div className="p5-stage">
      <span className="p5-tube p5-tube--y" aria-hidden="true" />
      <span className="b-frame b-frame--v" aria-hidden="true" />
      <NeonShape kind="bolt" color="y" className="p5-bolt" />
      <NeonShape kind="moon" color="y" className="p5-moon" />
      <NeonShape kind="spark" color="v" className="p5-spark" />
      <NeonShape kind="spark" color="y" className="p5-spark2" />
      <StorePhotoFrame photo={photo} />
    </div>
  );
}

/**
 * Quoi : ruban défilant des rayons (liste répétée deux fois pour remplir la largeur).
 * Input : aucun (lit SITE.tape).
 * Output : le ruban, masqué aux lecteurs d'écran car purement décoratif.
 * Effets de bord : aucun (composant pur).
 */
function CategoryTape() {
  const items = [...SITE.tape, ...SITE.tape];
  return (
    <div className="b-tape" aria-hidden="true">
      {items.map((label, index) => (
        <span key={`${label}-${index}`}>{label}</span>
      ))}
    </div>
  );
}

interface HeroProps {
  tag: string;
  lead: string;
  phoneNumber: string | null;
  photo: StorePhotoFrameProps["photo"];
}

/** Premier écran : accroche, boutons, photo d'accueil (cadre « Photo à venir » tant qu'aucune n'est publiée). */
export function Hero({ tag, lead, phoneNumber, photo }: HeroProps) {
  return (
    <section className="b-hero p-hero" id="top">
      <Header />
      <div className="b-top p-top">
        <div className="b-copy">
          <p className="b-tag">{tag}</p>
          <h1 className="b-h1">
            <span className="b-l">Votre épicerie</span>{" "}
            <span className="b-l"><span className="b-hl">de nuit</span> à</span>{" "}
            <span className="b-l">Strasbourg</span>
          </h1>
          <p className="b-lead">{lead}</p>
          <ActionButtons phoneNumber={phoneNumber} />
          <Address />
        </div>
        <PhotoStage photo={photo} />
      </div>
      <span className="b-wire" aria-hidden="true" />
      <CategoryTape />
      <MobileBar phoneNumber={phoneNumber} />
    </section>
  );
}

/** Barre fixe mobile : itinéraire et appel toujours accessibles. */
function MobileBar({ phoneNumber }: { phoneNumber: string | null }) {
  return (
    <div className="b-bar">
      <a className="b-btn b-btn--primary" href={SITE.directionsUrl} target="_blank" rel="noopener noreferrer">
        <span className="b-btn__row">Venir au magasin</span>
      </a>
      <CallButton phoneNumber={phoneNumber} showIcon={false} />
    </div>
  );
}
