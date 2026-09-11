/**
 * src/app/api/paipan/route.ts
 * 服务端排盘接口（nodejs runtime）。ADR-3：引擎跑全量 → 按角色裁剪 → 返回。
 *
 * 角色 → 输出（v7 §5.2）：
 *  - guest：简版（无神煞/大运），3 次/天（IP 限流）；
 *  - registered / single_paid：简版，不限次；
 *  - bazi_report / pro_monthly / pro_yearly：全量 + 大运/流年/流月/流日 timeline。
 *
 * 客户端必须携带 `Authorization: Bearer <access_token>`（AuthProvider session），
 * 缺省按 guest 处理。
 */
import { NextRequest, NextResponse } from 'next/server';
import { paipan } from '@/lib/bazi/paipan';
import { getLiunian, getLiuyue, getLiuri } from '@/lib/bazi/timeline';
import { resolveRoleFromRequest } from '@/lib/auth/serverRole';
import { getCapabilities } from '@/lib/auth/roleMatrix';
import { cropPaipanResult } from '@/lib/auth/crop';
import { checkDailyLimit, clientIp } from '@/lib/auth/rateLimit';

export const runtime = 'nodejs';

const GUEST_DAILY_LIMIT = 3;

interface PaipanBody {
  year?: unknown; month?: unknown; day?: unknown; hour?: unknown; minute?: unknown;
  gender?: unknown; calendar?: unknown; lon?: unknown; timezone?: unknown;
}

export async function POST(req: NextRequest) {
  // 1) 角色 → 能力档；游客先过每日限流
  const rc = await resolveRoleFromRequest(req);
  const caps = getCapabilities(rc.role, rc.expired);
  if (rc.role === 'guest') {
    const lim = checkDailyLimit(`paipan:${clientIp(req)}`, GUEST_DAILY_LIMIT);
    if (!lim.ok) {
      return NextResponse.json({ error: 'rate_limited', limit: GUEST_DAILY_LIMIT }, { status: 429 });
    }
  }

  // 2) 入参校验
  let body: PaipanBody;
  try {
    body = (await req.json()) as PaipanBody;
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  const num = (v: unknown): number | undefined => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const year = num(body.year);
  const month = num(body.month);
  const day = num(body.day);
  const hour = num(body.hour) ?? 0;
  const minute = num(body.minute) ?? 0;
  const gender = body.gender === 'male' ? 'male' : body.gender === 'female' ? 'female' : undefined;
  const calendar = body.calendar === 'lunar' ? 'lunar' : 'solar';
  if (!year || !month || !day || !gender) {
    return NextResponse.json({ error: 'year/month/day/gender are required' }, { status: 400 });
  }
  const lon = num(body.lon);
  const timezone = typeof body.timezone === 'string' && body.timezone.trim() ? body.timezone.trim() : undefined;

  // 3) 确定性引擎全量排盘（服务端时间基准）
  let full;
  try {
    full = await paipan({
      year, month, day, hour, minute, gender, calendar,
      ...(lon !== undefined ? { lon } : {}),
      ...(timezone ? { timezone } : {}),
      now: new Date(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 },
    );
  }

  // 4) 角色裁剪；全量档附带大运/流年/流月/流日
  const result = cropPaipanResult(full, caps);
  let timeline;
  if (caps.timeline) {
    const now = new Date();
    const curDayun = full.dayun.find(d => d.isCurrent)?.ganzhi ?? full.dayun[0]?.ganzhi ?? '甲子';
    const liunian = await getLiunian(full, curDayun, now);
    const curLN = liunian.find(x => x.isCurrent)?.ganzhi ?? '甲子';
    const liuyue = await getLiuyue(full, now.getFullYear(), curDayun, curLN, now);
    const liuri = await getLiuri(full, now);
    timeline = { liunian, liuyue, liuri };
  }

  return NextResponse.json({
    plan: { role: rc.role, full: caps.fullBaZi, timeline: caps.timeline },
    result,
    ...(timeline ? { timeline } : {}),
  });
}
