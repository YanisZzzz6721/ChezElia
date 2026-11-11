import Image from "next/image";
import type { HeroPhoto } from "@/lib/siteData";

export interface StorePhotoFrameProps {
  /** Photo d'accueil publiée par l'administrateur (URL + dimensions), ou null. */
  photo: (HeroPhoto & { url: string }) | null;
}

/**
 * Quoi : cadre papier « Découvrez Chez Elia » avec la photo d'accueil entière (jamais recadrée),
 *   ou un cadre « Photo à venir » de format 3:4 si aucune photo n'est publiée.
 * Input : photo — URL et dimensions de la photo, ou null.
 * Output : la figure avec sa légende.
 * Effets de bord : aucun (composant pur).
 */
export function StorePhotoFrame({ photo }: StorePhotoFrameProps) {
  return (
    <figure className="p-photo" id="decouvrir">
      {photo ? (
        <Image
          className="p-photo__img"
          src={photo.url}
          width={photo.width}
          height={photo.height}
          alt="Photo du magasin Chez Elia"
          priority
          unoptimized
        />
      ) : (
        <div className="p-photo__empty">Photo à venir</div>
      )}
      <figcaption className="p-photo__cap">
        <h2 className="p-photo__h">Découvrez Chez Elia</h2>
      </figcaption>
    </figure>
  );
}
