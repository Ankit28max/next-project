import { NextResponse } from 'next/server';
import { endSession } from '@/lib/auth/session';
import { api } from '@/lib/http';

export const POST = api(async () => {
  endSession();
  return NextResponse.json({ ok: true });
});
