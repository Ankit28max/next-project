// Server-side handling of an uploaded photo. Nothing the browser says about the file is trusted:
// the type comes from the first bytes, and size, hash and metadata come from the real content.
import sharp from 'sharp';
import exifr from 'exifr';
import { computeDHash } from './dhash';

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // Vercel rejects request bodies above 4.5 MB
const MAX_DIMENSION = 1600;
const MAX_INPUT_PIXELS = 50_000_000;

export type ImageType = 'jpeg' | 'png' | 'webp';

/** Detects the real file type from its "magic bytes". */
export function sniffImageType(bytes: Uint8Array): ImageType | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (png.every((b, i) => bytes[i] === b)) return 'png';
  const ascii = (from: number, to: number) => String.fromCharCode(...Array.from(bytes.slice(from, to)));
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp';
  return null;
}

export interface ExifFacts {
  hasExif: boolean;
  exifTakenAt: Date | null;
  exifLat: number | null;
  exifLng: number | null;
  exifDevice: string | null;
  exifSoftware: string | null;
}

const NO_EXIF: ExifFacts = {
  hasExif: false,
  exifTakenAt: null,
  exifLat: null,
  exifLng: null,
  exifDevice: null,
  exifSoftware: null,
};

/** Keeps only a handful of facts. The raw EXIF block is never stored. */
export async function readExifFacts(bytes: Buffer): Promise<ExifFacts> {
  try {
    const exif = await exifr.parse(bytes, { gps: true, tiff: true, exif: true });
    if (!exif) return NO_EXIF;
    const takenAt = exif.DateTimeOriginal ?? exif.CreateDate;
    const validCoord = (v: unknown, max: number) => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= max;
    const hasGps = validCoord(exif.latitude, 90) && validCoord(exif.longitude, 180);
    const device = [exif.Make, exif.Model].filter((s) => typeof s === 'string').join(' ').trim();
    return {
      hasExif: true,
      exifTakenAt: takenAt instanceof Date && !Number.isNaN(takenAt.getTime()) ? takenAt : null,
      exifLat: hasGps ? exif.latitude : null,
      exifLng: hasGps ? exif.longitude : null,
      exifDevice: device ? device.slice(0, 80) : null,
      exifSoftware: typeof exif.Software === 'string' ? exif.Software.slice(0, 80) : null,
    };
  } catch {
    return NO_EXIF;
  }
}

export interface ProcessedImage extends ExifFacts {
  jpeg: Buffer;
  width: number;
  height: number;
  imageHash: string;
}

export class InvalidImageError extends Error {}

export async function processUpload(bytes: Buffer): Promise<ProcessedImage> {
  if (bytes.length === 0 || bytes.length > MAX_UPLOAD_BYTES) {
    throw new InvalidImageError('Photo must be smaller than 4 MB.');
  }
  if (!sniffImageType(bytes)) {
    throw new InvalidImageError('Only JPEG, PNG or WebP photos are accepted.');
  }

  // 1. Read EXIF facts first, because step 2 removes all metadata.
  const exif = await readExifFacts(bytes);

  // 2. Re-encode. sharp drops EXIF/GPS by default, and decoding + encoding again
  //    also discards anything hidden in a file that merely looks like an image.
  //    The browser already drew the photo upright, so the EXIF orientation is ignored.
  let jpeg: Buffer;
  let width: number;
  let height: number;
  try {
    const result = await sharp(bytes, { limitInputPixels: MAX_INPUT_PIXELS })
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    jpeg = result.data;
    width = result.info.width;
    height = result.info.height;
  } catch {
    throw new InvalidImageError('This file could not be read as an image.');
  }

  // 3. Hash the stored version, so the hash always describes what we kept.
  const imageHash = await computeDHash(jpeg);
  return { jpeg, width, height, imageHash, ...exif };
}
