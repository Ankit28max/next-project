// The only file that knows WHERE photos are stored.
// - With BLOB_READ_WRITE_TOKEN set (Vercel): Vercel Blob.
// - Otherwise (local development): the .uploads/ folder, served by /api/files/[name].
// Vercel's filesystem is read-only at runtime, so local disk can never be used there.
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { put } from '@vercel/blob';

const LOCAL_DIR = path.join(process.cwd(), '.uploads');
const LOCAL_URL_PREFIX = '/api/files/';
const LOCAL_NAME = /^[0-9a-f-]{36}\.jpg$/;
const BLOB_HOST_SUFFIX = '.public.blob.vercel-storage.com';

function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** Stores a JPEG and returns the URL to save in the database. The server chooses the name. */
export async function putImage(jpeg: Buffer): Promise<string> {
  const name = `${randomUUID()}.jpg`;
  if (blobConfigured()) {
    const blob = await put(`complaints/${name}`, jpeg, { access: 'public', contentType: 'image/jpeg' });
    return blob.url;
  }
  if (process.env.VERCEL) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set: link a Vercel Blob store to this project.');
  }
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_DIR, name), jpeg);
  return `${LOCAL_URL_PREFIX}${name}`;
}

export async function readLocalImage(name: string): Promise<Buffer | null> {
  if (!LOCAL_NAME.test(name)) return null;
  try {
    return await readFile(path.join(LOCAL_DIR, name));
  } catch {
    return null;
  }
}

/** Loads the bytes of a stored photo (used to send it to the vision model). */
export async function getImage(url: string): Promise<Buffer> {
  if (url.startsWith(LOCAL_URL_PREFIX)) {
    const bytes = await readLocalImage(url.slice(LOCAL_URL_PREFIX.length));
    if (!bytes) throw new Error('Stored image not found.');
    return bytes;
  }
  // Only ever fetch from our own blob store, never from an arbitrary URL.
  if (!new URL(url).hostname.endsWith(BLOB_HOST_SUFFIX)) throw new Error('Unexpected image host.');
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Image fetch failed: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}
