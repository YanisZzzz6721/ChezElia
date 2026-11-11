type NeonKind = "bolt" | "moon" | "spark";
type NeonColor = "y" | "v";

const SHAPE_PATHS: Record<NeonKind, string> = {
  bolt: "M38 4 14 36h16l-4 24 24-34H34z",
  moon: "M46 6C28 8 16 22 16 38c0 12 10 20 22 20 8 0 16-4 20-10-16 2-28-8-28-20 0-8 6-16 16-22z",
  spark:
    "M32 4c2 18 10 26 28 28-18 2-26 10-28 28-2-18-10-26-28-28 18-2 26-10 28-28z",
};

interface NeonShapeProps {
  kind: NeonKind;
  color: NeonColor;
  className: string;
}

/** Forme décorative en tube néon (double trait). Masquée aux lecteurs d'écran. */
export function NeonShape({ kind, color, className }: NeonShapeProps) {
  const path = SHAPE_PATHS[kind];
  return (
    <svg className={`bn bn--${color} ${className}`} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <g className="o"><path d={path} /></g>
      <g className="i"><path d={path} /></g>
    </svg>
  );
}
