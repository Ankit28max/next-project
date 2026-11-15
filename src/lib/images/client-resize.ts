// Runs in the BROWSER. Shrinks a photo before upload so it fits under Vercel's 4.5 MB
// request limit. Drawing on a canvas throws away EXIF, so for JPEGs we copy the
// original EXIF block into the resized file: the server needs it for its checks.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

/** Finds the EXIF segment (APP1, marker 0xFFE1, starting with "Exif") in a JPEG. */
export function findExifSegment(jpeg: Uint8Array): Uint8Array | null {
  if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 4 <= jpeg.length && jpeg[offset] === 0xff) {
    const marker = jpeg[offset + 1];
    if (marker === 0xda) break; // start of image data: no more metadata segments
    const length = (jpeg[offset + 2] << 8) | jpeg[offset + 3];
    const isExif =
      marker === 0xe1 &&
      jpeg[offset + 4] === 0x45 && // E
      jpeg[offset + 5] === 0x78 && // x
      jpeg[offset + 6] === 0x69 && // i
      jpeg[offset + 7] === 0x66; //   f
    if (isExif) return jpeg.slice(offset, offset + 2 + length);
    offset += 2 + length;
  }
  return null;
}

/** Returns `resized` with the EXIF segment of `original` inserted right after the JPEG header. */
export function copyExif(original: Uint8Array, resized: Uint8Array): Uint8Array {
  const exif = findExifSegment(original);
  if (!exif || resized[0] !== 0xff || resized[1] !== 0xd8) return resized;
  const out = new Uint8Array(resized.length + exif.length);
  out.set(resized.subarray(0, 2), 0);
  out.set(exif, 2);
  out.set(resized.subarray(2), 2 + exif.length);
  return out;
}

export async function resizeForUpload(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const resized = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not process the photo.'))), 'image/jpeg', JPEG_QUALITY)
  );
  const withExif = copyExif(new Uint8Array(await file.arrayBuffer()), new Uint8Array(await resized.arrayBuffer()));
  return new Blob([withExif as BlobPart], { type: 'image/jpeg' });
}
