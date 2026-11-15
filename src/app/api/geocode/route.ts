// Reverse geocoding (coordinates -> address) through OpenStreetMap Nominatim.
// Done on the server so we can follow Nominatim's usage policy: an identifying
// User-Agent, at most 1 request per second, and caching of results.
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth/session';
import { api, enforceRateLimit } from '@/lib/http';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

const cache = new Map<string, string | null>();
let lastRequestAt = 0;
let queue: Promise<unknown> = Promise.resolve();

async function lookup(lat: number, lng: number): Promise<string | null> {
  // Wait until at least 1.1 s have passed since the previous upstream request.
  const wait = Math.max(0, lastRequestAt + 1100 - Date.now());
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastRequestAt = Date.now();

  const contact = process.env.GEOCODER_CONTACT || 'contact-not-configured';
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&lat=${lat}&lon=${lng}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': `JanSetu-academic-project/1.0 (${contact})`, 'Accept-Language': 'en' },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) return null;
  const data = await response.json();
  return typeof data?.display_name === 'string' ? data.display_name.slice(0, 400) : null;
}

export const GET = api(async (req) => {
  await requireRole('CITIZEN');
  enforceRateLimit(req, 'geocode', 30, 60 * 1000);
  const { lat, lng } = querySchema.parse(Object.fromEntries(req.nextUrl.searchParams));

  // Round to about 11 m so nearby clicks share one cached answer.
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (!cache.has(key)) {
    // Requests are chained so that only one talks to Nominatim at a time.
    const task = queue.then(() => (cache.has(key) ? cache.get(key)! : lookup(lat, lng))).catch(() => null);
    queue = task;
    const address = await task;
    if (cache.size > 2000) cache.clear();
    cache.set(key, address);
  }
  return NextResponse.json({ address: cache.get(key) ?? null });
});
