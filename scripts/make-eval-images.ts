// Generates the evaluation photos in eval/images/. They are SYNTHETIC illustrations drawn
// from SVG (no real people or places), so they can be committed and used freely.
// Run: npm run eval:images
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const OUT = path.join(process.cwd(), 'eval', 'images');
const W = 1280;
const H = 960;

/** Small seeded random generator so every run produces identical files. */
function rng(seed: number) {
  let a = seed * 2654435761;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Scene = 'pothole' | 'garbage' | 'streetlight' | 'leak' | 'drain' | 'bench' | 'screenshot';

function speckles(r: () => number, count: number, y0: number, y1: number, colors: string[]): string {
  let out = '';
  for (let i = 0; i < count; i++) {
    out += `<circle cx="${r() * W}" cy="${y0 + r() * (y1 - y0)}" r="${2 + r() * 7}" fill="${colors[Math.floor(r() * colors.length)]}" opacity="${0.3 + r() * 0.5}"/>`;
  }
  return out;
}

function draw(scene: Scene, seed: number): string {
  const r = rng(seed);
  const horizon = 180 + r() * 380;
  const x = 200 + r() * 880;
  const y = horizon + 120 + r() * (H - horizon - 260);
  const flip = r() < 0.5;
  const sky = ['#9cc4e8', '#c9d6df', '#e8d5b0', '#7fa7c9'][Math.floor(r() * 4)];
  let body = '';

  if (scene === 'pothole') {
    body = `<rect width="${W}" height="${horizon}" fill="${sky}"/><rect y="${horizon}" width="${W}" height="${H}" fill="#5f6368"/>
      ${speckles(r, 500, horizon, H, ['#777', '#4a4a4a', '#8a8a8a'])}
      <rect x="${r() * 200}" y="${horizon + 40}" width="${W}" height="14" fill="#e9e3c8" opacity="0.7" transform="rotate(${r() * 6 - 3})"/>
      <ellipse cx="${x}" cy="${y}" rx="${180 + r() * 120}" ry="${70 + r() * 50}" fill="#1f1b18"/>
      <ellipse cx="${x + 20}" cy="${y + 10}" rx="${90 + r() * 60}" ry="${30 + r() * 20}" fill="#3b4a54"/>`;
  } else if (scene === 'garbage') {
    body = `<rect width="${W}" height="${horizon}" fill="${sky}"/><rect y="${horizon}" width="${W}" height="${H}" fill="#8b7d6b"/>
      <rect x="${x - 380}" y="${horizon - 180}" width="260" height="330" fill="#2f6b3a"/>`;
    const colors = ['#d94b4b', '#f2c14e', '#3b82c4', '#ffffff', '#222', '#7a4f2a', '#4caf50'];
    for (let i = 0; i < 90; i++) {
      body += `<rect x="${x - 250 + r() * 500}" y="${y - 140 + r() * 260}" width="${30 + r() * 90}" height="${20 + r() * 70}" fill="${colors[Math.floor(r() * colors.length)]}" transform="rotate(${r() * 60 - 30} ${x} ${y})"/>`;
    }
  } else if (scene === 'streetlight') {
    body = `<rect width="${W}" height="${H}" fill="#101a2e"/><rect y="${horizon + 250}" width="${W}" height="${H}" fill="#1c1c1c"/>
      ${speckles(r, 80, 0, horizon, ['#fff'])}
      <rect x="${x}" y="120" width="26" height="${H}" fill="#6b7280"/><rect x="${x}" y="120" width="${170 + r() * 60}" height="20" fill="#6b7280"/>
      <ellipse cx="${x + 190}" cy="150" rx="60" ry="24" fill="#2a2a2a"/>
      <rect x="${r() * 300}" y="${horizon + 60}" width="${200 + r() * 200}" height="190" fill="#263247"/>`;
  } else if (scene === 'leak') {
    body = `<rect width="${W}" height="${horizon}" fill="${sky}"/><rect y="${horizon}" width="${W}" height="${H}" fill="#9a8f80"/>
      <rect x="0" y="${y - 40}" width="${W}" height="70" fill="#4b5563"/>
      <path d="M${x} ${y - 30} q-150 -300 -320 -80 M${x} ${y - 30} q120 -340 300 -60 M${x} ${y - 30} q10 -380 60 -40" stroke="#5db7f0" stroke-width="${24 + r() * 20}" fill="none" opacity="0.85"/>
      <ellipse cx="${x}" cy="${y + 160}" rx="${380 + r() * 100}" ry="${90 + r() * 40}" fill="#4a90c2" opacity="0.8"/>`;
  } else if (scene === 'drain') {
    body = `<rect width="${W}" height="${horizon}" fill="${sky}"/><rect y="${horizon}" width="${W}" height="${H}" fill="#6d665c"/>
      <rect x="${x - 160}" y="${y - 90}" width="320" height="200" fill="#151515"/>`;
    for (let i = 0; i < 7; i++) body += `<rect x="${x - 150 + i * 45}" y="${y - 90}" width="14" height="200" fill="#555"/>`;
    body += `<ellipse cx="${x + 60}" cy="${y + 190}" rx="${420 + r() * 120}" ry="${110 + r() * 40}" fill="#3d3a26" opacity="0.9"/>${speckles(r, 120, y + 80, H, ['#5a5330', '#222'])}`;
  } else if (scene === 'bench') {
    body = `<rect width="${W}" height="${horizon}" fill="${sky}"/><rect y="${horizon}" width="${W}" height="${H}" fill="#5c9a4b"/>
      <circle cx="${200 + r() * 800}" cy="${horizon - 60}" r="${120 + r() * 60}" fill="#2f6b3a"/>
      <rect x="${x - 220}" y="${y - 60}" width="440" height="30" fill="#8a5a2b" transform="rotate(${8 + r() * 14} ${x} ${y})"/>
      <rect x="${x - 220}" y="${y}" width="250" height="30" fill="#8a5a2b"/>
      <rect x="${x - 200}" y="${y}" width="22" height="130" fill="#444"/><rect x="${x + 170}" y="${y - 20}" width="22" height="150" fill="#444" transform="rotate(25 ${x + 180} ${y})"/>`;
  } else {
    // A phone screenshot: flat interface shapes instead of a camera photo.
    body = `<rect width="${W}" height="${H}" fill="#f5f6f8"/><rect width="${W}" height="110" fill="#1a73e8"/>
      <rect x="40" y="35" width="${300 + r() * 200}" height="40" rx="8" fill="#fff" opacity="0.9"/>`;
    for (let i = 0; i < 6; i++) {
      body += `<rect x="40" y="${160 + i * 125}" width="${W - 80}" height="100" rx="14" fill="#fff" stroke="#d0d4da"/>
        <rect x="70" y="${185 + i * 125}" width="${300 + r() * 600}" height="18" rx="6" fill="#9aa3ad"/>
        <rect x="70" y="${218 + i * 125}" width="${200 + r() * 500}" height="14" rx="6" fill="#c8ced6"/>`;
    }
  }
  // Real photos of different places differ a lot in framing. Random background
  // buildings (drawn in the sky area only) and mirroring give the synthetic scenes comparable variety.
  let buildings = '';
  if (scene !== 'screenshot') {
    const count = 2 + Math.floor(r() * 5);
    for (let i = 0; i < count; i++) {
      const shade = 60 + Math.floor(r() * 150);
      const height = 60 + r() * (horizon - 40);
      buildings += `<rect x="${r() * W}" y="${horizon - height}" width="${80 + r() * 260}" height="${height}" fill="rgb(${shade},${shade},${shade + 10})" opacity="0.85"/>`;
    }
  }
  const mirror = flip ? ` transform="translate(${W},0) scale(-1,1)"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><g${mirror}>${body}${buildings}</g></svg>`;
}

/** Degrees -> the "deg/1 min/1 sec/100" text format EXIF uses for GPS. */
function gps(value: number): string {
  const abs = Math.abs(value);
  const deg = Math.floor(abs);
  const min = Math.floor((abs - deg) * 60);
  const sec = Math.round(((abs - deg) * 60 - min) * 60 * 100);
  return `${deg}/1 ${min}/1 ${sec}/100`;
}

interface Exif {
  takenAt: string; // "YYYY:MM:DD HH:MM:SS"
  lat: number;
  lng: number;
  software?: string;
}

interface Spec {
  file: string;
  scene: Scene;
  seed: number;
  exif?: Exif;
  /** Simulates the same photo after being forwarded: smaller and more compressed. */
  forwarded?: boolean;
}

const near = (lat: number, lng: number, takenAt = '2026:11:10 09:30:00'): Exif => ({ takenAt, lat, lng });

export const IMAGE_SPECS: Spec[] = [
  { file: 'pothole-1.jpg', scene: 'pothole', seed: 1, exif: near(31.2536, 75.7037) },
  { file: 'pothole-2.jpg', scene: 'pothole', seed: 2, exif: near(31.2538, 75.704) },
  { file: 'pothole-3.jpg', scene: 'pothole', seed: 3 },
  { file: 'pothole-4.jpg', scene: 'pothole', seed: 4, exif: near(31.262, 75.712) },
  { file: 'pothole-5.jpg', scene: 'pothole', seed: 5, exif: near(31.245, 75.695) },
  { file: 'pothole-6.jpg', scene: 'pothole', seed: 6 },
  { file: 'pothole-1-forwarded.jpg', scene: 'pothole', seed: 1, forwarded: true },
  { file: 'leak-1.jpg', scene: 'leak', seed: 11, exif: near(31.258, 75.7) },
  { file: 'leak-1-forwarded.jpg', scene: 'leak', seed: 11, forwarded: true },
  { file: 'leak-2.jpg', scene: 'leak', seed: 12, exif: near(31.249, 75.709) },
  { file: 'leak-3.jpg', scene: 'leak', seed: 13 },
  { file: 'leak-4.jpg', scene: 'leak', seed: 14, exif: near(31.266, 75.699) },
  { file: 'drain-1.jpg', scene: 'drain', seed: 21, exif: near(31.251, 75.715) },
  { file: 'drain-2.jpg', scene: 'drain', seed: 22, exif: near(31.2514, 75.7154) },
  { file: 'drain-3.jpg', scene: 'drain', seed: 23 },
  { file: 'drain-4.jpg', scene: 'drain', seed: 24, exif: near(31.24, 75.705) },
  { file: 'drain-5.jpg', scene: 'drain', seed: 25 },
  { file: 'garbage-1.jpg', scene: 'garbage', seed: 31, exif: near(31.2605, 75.7065) },
  { file: 'garbage-2.jpg', scene: 'garbage', seed: 32, exif: near(31.2606, 75.7067) },
  { file: 'garbage-3.jpg', scene: 'garbage', seed: 33 },
  { file: 'garbage-4.jpg', scene: 'garbage', seed: 34, exif: near(31.243, 75.714) },
  { file: 'garbage-5.jpg', scene: 'garbage', seed: 35, exif: near(31.255, 75.692) },
  // Old photo taken in another city: used for the "metadata does not fit" example.
  { file: 'garbage-old-elsewhere.jpg', scene: 'garbage', seed: 36, exif: { takenAt: '2025:03:01 08:00:00', lat: 28.6139, lng: 77.209 } },
  { file: 'garbage-6.jpg', scene: 'garbage', seed: 37, exif: near(31.2475, 75.7005) },
  { file: 'streetlight-1.jpg', scene: 'streetlight', seed: 41, exif: near(31.2565, 75.7095, '2026:11:09 21:10:00') },
  { file: 'streetlight-1-forwarded.jpg', scene: 'streetlight', seed: 41, forwarded: true },
  { file: 'streetlight-2.jpg', scene: 'streetlight', seed: 42 },
  { file: 'streetlight-3.jpg', scene: 'streetlight', seed: 43, exif: near(31.264, 75.704, '2026:11:09 20:40:00') },
  { file: 'streetlight-4.jpg', scene: 'streetlight', seed: 44, exif: near(31.2585, 75.7115, '2026:11:09 22:00:00') },
  { file: 'bench-1.jpg', scene: 'bench', seed: 51, exif: near(31.2525, 75.698) },
  { file: 'bench-2.jpg', scene: 'bench', seed: 52 },
  { file: 'screenshot-1.jpg', scene: 'screenshot', seed: 61 },
  { file: 'screenshot-2.jpg', scene: 'screenshot', seed: 62 },
];

async function main() {
  await mkdir(OUT, { recursive: true });
  for (const spec of IMAGE_SPECS) {
    let image = sharp(Buffer.from(draw(spec.scene, spec.seed)));
    if (spec.forwarded) image = image.resize(800, 600);
    if (spec.exif) {
      image = image.withExif({
        IFD0: { Make: 'DemoPhone', Model: 'Camera A1', ...(spec.exif.software ? { Software: spec.exif.software } : {}) },
        IFD2: { DateTimeOriginal: spec.exif.takenAt },
        IFD3: {
          GPSLatitudeRef: spec.exif.lat >= 0 ? 'N' : 'S',
          GPSLatitude: gps(spec.exif.lat),
          GPSLongitudeRef: spec.exif.lng >= 0 ? 'E' : 'W',
          GPSLongitude: gps(spec.exif.lng),
        },
      });
    }
    await image.jpeg({ quality: spec.forwarded ? 55 : 85 }).toFile(path.join(OUT, spec.file));
  }
  console.log(`Wrote ${IMAGE_SPECS.length} images to eval/images/`);
}

main();
