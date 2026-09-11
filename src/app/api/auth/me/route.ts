/**
 * GET /api/auth/me
 * 返回当前用户角色（支付成功页轮询用）。
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRoleFromRequest } from '@/lib/auth/serverRole';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const rc = await resolveRoleFromRequest(req);
  if (!rc.userId) {
    return NextResponse.json({ role: 'guest' }, { status: 200 });
  }
  return NextResponse.json({ role: rc.role, expired: rc.expired });
}
