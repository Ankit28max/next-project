// Perceptual "difference hash" (dHash).
// Idea: shrink the picture to 9x8 grey pixels and, for each row, record whether each
// pixel is brighter than its right-hand neighbour. That gives 8 x 8 = 64 bits.
// Resizing, recompressing or lightly editing a photo changes only a few of those bits,
// so two hashes that differ in few bits (small Hamming distance) are "visually the same".
import sharp from 'sharp';

export async function computeDHash(image: Buffer): Promise<string> {
  const pixels = await sharp(image).grayscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer();
  return dHashFromPixels(pixels);
}

/** `pixels` is 72 grey values: 8 rows of 9. Returns 16 hex characters. */
export function dHashFromPixels(pixels: Uint8Array): string {
  let bits = BigInt(0);
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const left = pixels[row * 9 + col];
      const right = pixels[row * 9 + col + 1];
      bits = (bits << BigInt(1)) | BigInt(left > right ? 1 : 0);
    }
  }
  return bits.toString(16).padStart(16, '0');
}

/** Number of bits that differ between two 64-bit hashes (0 = identical, 64 = opposite). */
export function hammingDistance(hashA: string, hashB: string): number {
  let diff = BigInt(`0x${hashA}`) ^ BigInt(`0x${hashB}`);
  let count = 0;
  while (diff > BigInt(0)) {
    count += Number(diff & BigInt(1));
    diff >>= BigInt(1);
  }
  return count;
}
