import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;
export const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp"];
export const ACCEPTED_LOGO_MIME = [...ACCEPTED_MIME, "image/svg+xml"];

export class ImageError extends Error {}

export interface ProcessedImage {
  buffer: Buffer;
  ext: string;
  mime: string;
  width: number;
  height: number;
}

/**
 * Normalises an evidence photo for print: applies EXIF orientation, caps the
 * long edge (default 1600px ≈ 220dpi across an A4 content column), re-encodes
 * as quality-72 mozjpeg. Keeps 40+ photo PDFs comfortably under ~15MB.
 */
export async function processPhoto(input: Buffer, longEdge = 1600): Promise<ProcessedImage> {
  let img = sharp(input, { failOn: "error" }).rotate(); // .rotate() = honour EXIF
  const meta = await img.metadata().catch(() => {
    throw new ImageError("Unreadable image file.");
  });
  if (!meta.width || !meta.height) throw new ImageError("Unreadable image dimensions.");

  img = img.resize({
    width: longEdge,
    height: longEdge,
    fit: "inside",
    withoutEnlargement: true,
  });
  const buffer = await img.jpeg({ quality: 72, mozjpeg: true }).toBuffer();
  const out = await sharp(buffer).metadata();
  return {
    buffer,
    ext: "jpg",
    mime: "image/jpeg",
    width: out.width ?? meta.width,
    height: out.height ?? meta.height,
  };
}

/** Building/hero photo keeps a little more resolution for full-bleed covers. */
export const processBuildingPhoto = (input: Buffer) => processPhoto(input, 2400);

/** Logos pass through untouched (SVG) or get a gentle PNG resize. */
export async function processLogo(input: Buffer, mime: string): Promise<ProcessedImage> {
  if (mime === "image/svg+xml") {
    const text = input.toString("utf8");
    // Defence-in-depth: strip active content before the SVG is ever served.
    if (/<script|onload=|onerror=|javascript:/i.test(text)) {
      throw new ImageError("SVG contains active content and was rejected.");
    }
    return { buffer: input, ext: "svg", mime, width: 320, height: 88 };
  }
  const img = sharp(input, { failOn: "error" }).rotate().resize({
    width: 1200,
    height: 1200,
    fit: "inside",
    withoutEnlargement: true,
  });
  const buffer = await img.png().toBuffer();
  const meta = await sharp(buffer).metadata();
  return {
    buffer,
    ext: "png",
    mime: "image/png",
    width: meta.width ?? 0,
    height: meta.height ?? 0,
  };
}
