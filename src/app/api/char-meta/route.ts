import { NextRequest, NextResponse } from 'next/server';
import { loadCharMeta } from '@/lib/naming/charMeta';

export const runtime = 'nodejs';

/** GET /api/char-meta?chars=浩然 → 每字 CharMeta，未收录为 null */
export async function GET(req: NextRequest) {
  const chars = new URL(req.url).searchParams.get('chars') ?? '';
  const unique = [...new Set([...chars])];
  const meta = loadCharMeta();
  const list = unique.map(ch => meta.get(ch) ?? null);
  return NextResponse.json({ count: list.length, meta: list });
}
