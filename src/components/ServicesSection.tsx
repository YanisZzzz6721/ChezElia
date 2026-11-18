import { staggerStyle } from "@/lib/motion";
import type { ServiceIconName, ServiceItem } from "@/content/services";
import { BrandIcon } from "./BrandIcons";

function SandwichIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M3 10.5C3 7 7 5 12 5s9 2 9 5.5H3z" />
      <path d="M2.5 13.5c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 5.5 0" />
      <path d="M3.5 16.5h17a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z" />
    </svg>
  );
}

function ParcelIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" />
      <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9M7.8 5.2l8.4 4.6" />
    </svg>
  );
}

function VintedIcon() {
  return <BrandIcon name="vinted" />;
}

const ICONS: Record<ServiceIconName, () => React.JSX.Element> = { sandwich: SandwichIcon, parcel: ParcelIcon, vinted: VintedIcon };

/**
 * Quoi : section « Nos services » : une carte par service, toutes de même taille, sur une grille symétrique.
 * Input : services — les services à afficher (déjà filtrés sur « visible » et triés par la couche données).
 * Output : la section ; null si aucun service.
 * Effets de bord : aucun (composant pur). Textes échappés par React.
 */
export function ServicesSection({ services }: { services: readonly ServiceItem[] }) {
  if (services.length === 0) return null;
  return (
    <section className="f-srv" id="services" aria-labelledby="services-title">
      <div className="f-srv__in">
        <h2 className="b-h2 f-srv__h" id="services-title" data-reveal>Nos <span>services</span></h2>
        <ul className="f-srv__list">
          {services.map((service, index) => {
            const Icon = ICONS[service.icon];
            return (
              <li key={service.id} className="f-srv__card" data-reveal style={staggerStyle(index % 4)}>
                <span className={`f-srv__ic f-srv__ic--${service.icon}`}><Icon /></span>
                <h3 className="f-srv__t">{service.title}</h3>
                <p className="f-srv__p">{service.body}</p>
                {service.highlight ? <strong className="f-srv__hl">{service.highlight}</strong> : null}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
