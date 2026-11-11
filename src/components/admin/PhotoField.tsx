"use client";

import { useEffect, useState } from "react";

interface PhotoFieldProps {
  /** URL de la photo actuelle, ou null. */
  currentUrl: string | null;
  /** Texte d'aide sous le champ. */
  hint?: string;
}

/**
 * Quoi : champ d'envoi de photo avec aperçu (photo actuelle ou fichier choisi) et case « Retirer la photo ».
 * Input : currentUrl — photo actuelle ; hint — aide.
 * Output : les champs « photo » (fichier) et « removePhoto » (case) lus par les actions serveur.
 * Effets de bord : crée une URL d'aperçu locale pour le fichier choisi (libérée au changement/démontage).
 */
export function PhotoField({ currentUrl, hint }: PhotoFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeChecked, setRemoveChecked] = useState(false);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const shownUrl = removeChecked ? null : (previewUrl ?? currentUrl);
  return (
    <div className="adm-photo">
      <div className="adm-photo__preview">
        {shownUrl ? <img src={shownUrl} alt="Aperçu de la photo" /> : <span>Aucune photo</span>}
      </div>
      <div className="adm-photo__controls">
        <label className="adm-label" htmlFor="photo">Photo (JPEG, PNG ou WebP, 8 Mo maximum)</label>
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            setPreviewUrl(file ? URL.createObjectURL(file) : null);
            if (file) setRemoveChecked(false);
          }}
        />
        {currentUrl ? (
          <label className="adm-check">
            <input type="checkbox" name="removePhoto" checked={removeChecked} onChange={(event) => setRemoveChecked(event.target.checked)} />
            Retirer la photo actuelle
          </label>
        ) : null}
        {hint ? <p className="adm-hint">{hint}</p> : null}
      </div>
    </div>
  );
}
