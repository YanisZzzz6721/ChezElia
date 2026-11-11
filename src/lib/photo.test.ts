import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, PhotoError, detectImageType, processPhoto } from "./photo";

async function makeImage(width: number, height: number, format: "jpeg" | "png" | "webp"): Promise<Uint8Array> {
  const buffer = await sharp({ create: { width, height, channels: 3, background: "#5b21d6" } })
    .toFormat(format)
    .toBuffer();
  return new Uint8Array(buffer);
}

describe("detectImageType (signature réelle, pas l'extension)", () => {
  it("reconnaît JPEG, PNG et WebP", async () => {
    expect(detectImageType(await makeImage(300, 300, "jpeg"))).toBe("jpeg");
    expect(detectImageType(await makeImage(300, 300, "png"))).toBe("png");
    expect(detectImageType(await makeImage(300, 300, "webp"))).toBe("webp");
  });

  it("rejette un exécutable, du texte et un fichier vide", () => {
    expect(detectImageType(new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03]))).toBeNull(); // « MZ » : .exe
    expect(detectImageType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(detectImageType(new Uint8Array([]))).toBeNull();
  });
});

describe("processPhoto", () => {
  it("convertit un JPEG en WebP et garde le rapport d'aspect", async () => {
    const result = await processPhoto(await makeImage(900, 1200, "jpeg"));
    expect(detectImageType(result.bytes)).toBe("webp");
    expect(result.width).toBe(900);
    expect(result.height).toBe(1200);
  });

  it("réduit une grande image à 1600 px maximum sans la déformer", async () => {
    const result = await processPhoto(await makeImage(3200, 2400, "png"));
    expect(result.width).toBe(1600);
    expect(result.height).toBe(1200);
  });

  it("n'agrandit jamais une petite image", async () => {
    const result = await processPhoto(await makeImage(400, 300, "webp"));
    expect(result.width).toBe(400);
    expect(result.height).toBe(300);
  });

  it("refuse un fichier vide avec un message clair", async () => {
    await expect(processPhoto(new Uint8Array([]))).rejects.toThrow(PhotoError);
    await expect(processPhoto(new Uint8Array([]))).rejects.toThrow(/vide/);
  });

  it("refuse un exécutable renommé en .jpg", async () => {
    const fakeJpg = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
    await expect(processPhoto(fakeJpg)).rejects.toThrow(/format/i);
  });

  it("refuse un fichier trop lourd avant même de le décoder", async () => {
    await expect(processPhoto(new Uint8Array(MAX_UPLOAD_BYTES + 1))).rejects.toThrow(/trop lourd/);
  });

  it("refuse une image trop petite", async () => {
    await expect(processPhoto(await makeImage(100, 100, "jpeg"))).rejects.toThrow(/trop petite/);
  });

  it("refuse une image corrompue (signature JPEG valide, contenu invalide)", async () => {
    const corrupted = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...new Array(200).fill(7)]);
    await expect(processPhoto(corrupted)).rejects.toThrow(/illisible/);
  });
});
