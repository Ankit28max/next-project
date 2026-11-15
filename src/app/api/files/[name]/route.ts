// Serves photos stored by the local-disk adapter (development only).
// In production photos are served directly by Vercel Blob.
import { readLocalImage } from '@/lib/storage';

export async function GET(_req: Request, { params }: { params: { name: string } }) {
  const bytes = await readLocalImage(params.name);
  if (!bytes) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
