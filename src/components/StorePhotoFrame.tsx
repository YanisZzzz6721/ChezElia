/**
 * Cadre papier « Découvrez Chez Elia ». La photo du magasin n'est pas publiée tant que les droits
 * ne sont pas confirmés (Q12) : un cadre « Photo à venir » de même format 3:4 la remplace.
 */
export function StorePhotoFrame() {
  return (
    <figure className="p-photo" id="decouvrir">
      <div className="p-photo__empty">Photo à venir</div>
      <figcaption className="p-photo__cap">
        <h2 className="p-photo__h">Découvrez Chez Elia</h2>
      </figcaption>
    </figure>
  );
}
