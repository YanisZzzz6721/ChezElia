import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_OUTPUT_SIDE_PX = 1600;
const MIN_SIDE_PX = 200;
/** Garde-fou contre les « bombes de décompression » (image minuscule en octets, énorme en pixels). */
const MAX_INPUT_PIXELS = 50_000_000;
const WEBP_QUALITY = 82;

export type ImageType = "jpeg" | "png" | "webp";

export interface ProcessedPhoto {
  bytes: Uint8Array;
  width: number;
  height: number;
}

/** Erreur destinée à l'administrateur : le message est lisible, en français, et actionnable. */
export class PhotoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhotoError";
  }
}

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  return signature.every((value, index) => bytes[offset + index] === value);
}

/**
 * Quoi : identifie le vrai format d'une image d'après sa signature (octets de tête), sans se fier à l'extension.
 * Input : bytes — le contenu du fichier.
 * Output : « jpeg », « png » ou « webp » ; null pour tout autre contenu (exécutable, SVG, texte, vide…).
 * Effets de bord : aucun (fonction pure).
 */
export function detectImageType(bytes: Uint8Array): ImageType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  const isRiff = startsWith(bytes, [0x52, 0x49, 0x46, 0x46]);
  if (isRiff && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return "webp";
  return null;
}

/**
 * Quoi : décode l'image et lit ses dimensions réelles (échoue si elle est corrompue).
 * Input : bytes — le contenu du fichier (type déjà vérifié).
 * Output : largeur et hauteur en pixels.
 * Effets de bord : aucun. Lève PhotoError si l'image est illisible.
 */
async function readDimensions(bytes: Uint8Array): Promise<{ width: number; height: number }> {
  try {
    const metadata = await sharp(bytes, { limitInputPixels: MAX_INPUT_PIXELS }).metadata();
    if (!metadata.width || !metadata.height) throw new Error("dimensions absentes");
    return { width: metadata.width, height: metadata.height };
  } catch {
    throw new PhotoError("Image illisible ou corrompue. Essayez avec une autre photo (JPEG, PNG ou WebP).");
  }
}

/**
 * Quoi : prépare une photo envoyée par l'administrateur pour la publication.
 *   Vérifie taille et vrai format, applique l'orientation EXIF, retire les métadonnées (GPS compris),
 *   réduit à 1600 px maximum sans agrandir ni déformer, convertit en WebP.
 * Input : bytes — le contenu du fichier envoyé.
 * Output : { bytes WebP, width, height }.
 * Effets de bord : aucun (calcul pur en mémoire). Lève PhotoError (message en français) si le fichier est
 *   vide, trop lourd, d'un format non pris en charge, illisible ou trop petit.
 */
export async function processPhoto(bytes: Uint8Array): Promise<ProcessedPhoto> {
  if (bytes.byteLength === 0) throw new PhotoError("Le fichier est vide. Choisissez une photo.");
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    const limitMegabytes = MAX_UPLOAD_BYTES / (1024 * 1024);
    throw new PhotoError(`Photo trop lourde : ${limitMegabytes} Mo maximum.`);
  }
  if (detectImageType(bytes) === null) {
    throw new PhotoError("Format non pris en charge. Utilisez une photo JPEG, PNG ou WebP.");
  }

  const source = await readDimensions(bytes);
  if (Math.min(source.width, source.height) < MIN_SIDE_PX) {
    throw new PhotoError(`Photo trop petite : ${MIN_SIDE_PX} px minimum sur chaque côté (reçu ${source.width} × ${source.height}).`);
  }

  const { data, info } = await sharp(bytes, { limitInputPixels: MAX_INPUT_PIXELS })
    .rotate()
    .resize({ width: MAX_OUTPUT_SIDE_PX, height: MAX_OUTPUT_SIDE_PX, fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer({ resolveWithObject: true });
  return { bytes: new Uint8Array(data), width: info.width, height: info.height };
}
