import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { DUPLICATE } from '@/lib/ai/config';
import { computeDHash, dHashFromPixels, hammingDistance } from '@/lib/images/dhash';
import { copyExif, findExifSegment } from '@/lib/images/client-resize';
import { InvalidImageError, processUpload, readExifFacts, sniffImageType } from '@/lib/images/process';

const image = (name: string) => readFile(path.join(process.cwd(), 'eval', 'images', name));

describe('dHash', () => {
  it('produces 16 hex characters', async () => {
    expect(await computeDHash(await image('pothole-1.jpg'))).toMatch(/^[0-9a-f]{16}$/);
  });

  it('sets a bit when the left pixel is brighter than the right one', () => {
    const descending = new Uint8Array(72).map((_, i) => 200 - (i % 9) * 10);
    expect(dHashFromPixels(descending)).toBe('ffffffffffffffff');
    expect(dHashFromPixels(new Uint8Array(72).fill(50))).toBe('0000000000000000');
  });

  it('counts differing bits', () => {
    expect(hammingDistance('0000000000000000', '0000000000000000')).toBe(0);
    expect(hammingDistance('0000000000000000', '000000000000000f')).toBe(4);
    expect(hammingDistance('0000000000000000', 'ffffffffffffffff')).toBe(64);
  });

  it('treats a resized, recompressed copy as the same photo', async () => {
    const original = await image('pothole-1.jpg');
    const copy = await sharp(original).resize(400).jpeg({ quality: 40 }).toBuffer();
    const distance = hammingDistance(await computeDHash(original), await computeDHash(copy));
    expect(distance).toBeLessThanOrEqual(DUPLICATE.SAME_PHOTO_MAX_HAMMING);
  });

  it('treats different photos as different', async () => {
    const distance = hammingDistance(await computeDHash(await image('pothole-1.jpg')), await computeDHash(await image('garbage-1.jpg')));
    expect(distance).toBeGreaterThan(DUPLICATE.SAME_PHOTO_MAX_HAMMING);
  });
});

describe('upload processing', () => {
  it('detects the type from magic bytes, not from a name', async () => {
    expect(sniffImageType(await image('pothole-1.jpg'))).toBe('jpeg');
    expect(sniffImageType(await sharp(await image('pothole-1.jpg')).png().toBuffer())).toBe('png');
    expect(sniffImageType(Buffer.from('<html>definitely not an image</html>'))).toBeNull();
  });

  it('rejects non-images and corrupt images', async () => {
    await expect(processUpload(Buffer.from('MZ this is an exe pretending to be a photo'))).rejects.toThrow(InvalidImageError);
    await expect(processUpload(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 5, 6, 7, 8, 9]))).rejects.toThrow(InvalidImageError);
  });

  it('reads EXIF facts, then strips EXIF from the stored file', async () => {
    const result = await processUpload(await image('pothole-1.jpg'));
    expect(result.hasExif).toBe(true);
    expect(result.exifLat).toBeCloseTo(31.2536, 3);
    expect(result.exifLng).toBeCloseTo(75.7037, 3);
    expect(result.exifDevice).toContain('DemoPhone');
    expect(result.exifTakenAt).toBeInstanceOf(Date);

    const stored = await readExifFacts(result.jpeg);
    expect(stored.hasExif).toBe(false);
    expect(sniffImageType(result.jpeg)).toBe('jpeg');
    expect(Math.max(result.width, result.height)).toBeLessThanOrEqual(1600);
  });

  it('reports no EXIF for a photo without metadata', async () => {
    expect((await processUpload(await image('pothole-3.jpg'))).hasExif).toBe(false);
  });
});

describe('browser EXIF copy (used before upload)', () => {
  it('carries EXIF over to a re-encoded JPEG', async () => {
    const original = await image('pothole-1.jpg');
    const reencoded = await sharp(original).resize(600).jpeg().toBuffer(); // like a canvas: no EXIF
    expect(findExifSegment(new Uint8Array(reencoded))).toBeNull();

    const merged = Buffer.from(copyExif(new Uint8Array(original), new Uint8Array(reencoded)));
    const facts = await readExifFacts(merged);
    expect(facts.exifLat).toBeCloseTo(31.2536, 3);
    // Still a valid image.
    expect((await sharp(merged).metadata()).width).toBe(600);
  });
});
