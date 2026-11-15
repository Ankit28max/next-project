import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireRole } from '@/lib/auth/session';
import { HttpError } from '@/lib/auth/guards';
import { api, enforceRateLimit } from '@/lib/http';
import { InvalidImageError, MAX_UPLOAD_BYTES, processUpload } from '@/lib/images/process';
import { putImage } from '@/lib/storage';

export const runtime = 'nodejs'; // sharp needs the Node.js runtime

export const POST = api(async (req) => {
  const user = await requireRole('CITIZEN');
  enforceRateLimit(req, 'upload', 20, 10 * 60 * 1000);

  // Refuse oversized bodies before reading them.
  if (Number(req.headers.get('content-length') ?? 0) > MAX_UPLOAD_BYTES + 100_000) {
    throw new HttpError(413, 'Photo must be smaller than 4 MB.');
  }
  const file = (await req.formData()).get('file');
  if (!(file instanceof Blob)) throw new HttpError(400, 'No photo was sent.');

  // The browser's file name and MIME type are ignored. Everything below comes from the bytes.
  let processed;
  try {
    processed = await processUpload(Buffer.from(await file.arrayBuffer()));
  } catch (error) {
    if (error instanceof InvalidImageError) throw new HttpError(400, error.message);
    throw error;
  }

  const { jpeg, ...facts } = processed;
  const storageUrl = await putImage(jpeg);
  const image = await prisma.complaintImage.create({
    data: { uploaderId: user.id, storageUrl, mimeType: 'image/jpeg', fileSize: jpeg.length, ...facts },
    select: { id: true, storageUrl: true },
  });

  // The client only gets an id to quote when submitting. It cannot supply a URL or hash itself.
  return NextResponse.json({ imageId: image.id, previewUrl: image.storageUrl });
});
