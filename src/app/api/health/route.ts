import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { isGeminiConfigured } from '@/lib/ai/gemini';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: 'ok',
      database: 'up',
      classifier: isGeminiConfigured() ? 'vision model with rules fallback' : 'rules only',
    });
  } catch {
    return NextResponse.json({ status: 'error', database: 'down' }, { status: 503 });
  }
}
