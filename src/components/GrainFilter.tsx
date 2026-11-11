/** Texture « grain graffiti » posée sur toute la page (décorative). */
export function GrainFilter() {
  return (
    <svg className="b-grain" aria-hidden="true" focusable="false">
      <filter id="b-noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#b-noise)" />
    </svg>
  );
}
