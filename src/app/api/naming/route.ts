/**
 * src/app/api/naming/route.ts
 * 英文名 → 中文名 起名接口（服务端 nodejs runtime）。
 *
 * 字库（data/char-meta，约 8.5MB）与起名管线只在服务端运行；
 * 前端仅传参并展示返回的精简候选 JSON（ADR-7：禁止前端 import 大字库）。
 * 管线：音译+意译双通道 → 六项硬过滤 → 六维加权评分 → TopN（纯函数、零随机）。
 *
 * 角色裁剪（ADR-3 / v7 §5.2）：引擎管线跑全量，按能力档截断输出——
 *  guest/registered：3 条且无字义详解；single_paid/bazi_report/pro：10 条完整；
 *  consult_owner：—（0 条）。
 */
import { NextRequest, NextResponse } from 'next/server';
import { loadCharMeta } from '@/lib/naming/charMeta';
import { generateNameCandidates } from '@/lib/naming/pipeline';
import { resolveRoleFromRequest } from '@/lib/auth/serverRole';
import { getCapabilities } from '@/lib/auth/roleMatrix';
import { cropNamingCandidates } from '@/lib/auth/crop';

export const runtime = 'nodejs';

interface NamingBody {
  englishName?: string;
  surname?: string;
  xiYong?: { yong?: unknown; xi?: unknown; ji?: unknown };
  tabooNames?: unknown;
  topN?: unknown;
}

interface CandidateDTO {
  full: string;
  source: string;
  meaning?: string;
  syllables?: string[];
  popularityLabel: string;
  given: { char: string; pinyin: string; wuxing: string; strokes: number }[];
  score: {
    total: number; xiyong: number; yinlv: number; ziyi: number;
    zixing: number; shuli: number; dute: number;
  };
}

const WUXING_SET = new Set(['金', '木', '水', '火', '土']);

export async function POST(req: NextRequest) {
  let body: NamingBody;
  try {
    body = (await req.json()) as NamingBody;
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const englishName = (body.englishName ?? '').toString().trim();
  const surnameRaw = (body.surname ?? '').toString().trim();
  const surnameChars = [...surnameRaw];
  if (!englishName) {
    return NextResponse.json({ error: 'englishName is required' }, { status: 400 });
  }
  if (surnameChars.length !== 1) {
    return NextResponse.json({ error: 'surname must be a single Chinese character' }, { status: 400 });
  }

  const meta = loadCharMeta();
  const surname = meta.get(surnameChars[0]!);
  if (!surname) {
    return NextResponse.json(
      { error: `surname "${surnameChars[0]}" is not covered by the character database` },
      { status: 400 },
    );
  }

  // 喜用：只接受五行白名单值，其余忽略（缺省 = 不做喜用过滤/评分取中性档）
  const cleanWx = (v: unknown): string[] =>
    Array.isArray(v) ? v.map(String).filter(x => WUXING_SET.has(x)) : [];
  const hasXiYong = body.xiYong && typeof body.xiYong === 'object';
  const xiYong = hasXiYong
    ? {
        yong: cleanWx(body.xiYong!.yong),
        xi: cleanWx(body.xiYong!.xi),
        ji: cleanWx(body.xiYong!.ji),
      }
    : undefined;

  const tabooNames = Array.isArray(body.tabooNames)
    ? body.tabooNames.map(x => x.toString().trim()).filter(Boolean)
    : undefined;

  const topNRaw = Number(body.topN);
  const topN = Number.isFinite(topNRaw) ? Math.min(20, Math.max(1, Math.trunc(topNRaw))) : 10;

  const results = generateNameCandidates(
    {
      englishName,
      surname,
      ...(xiYong ? { xiYong } : {}),
      ...(tabooNames && tabooNames.length ? { tabooNames } : {}),
      topN,
    },
    meta,
  );

  // 全量 DTO → 角色裁剪（截断条数 + 剥离字义详解）
  const fullDtos: CandidateDTO[] = results.map(r => ({
    full: r.full,
    source: r.source,
    ...(r.meaning ? { meaning: r.meaning } : {}),
    ...(r.syllables ? { syllables: r.syllables } : {}),
    popularityLabel: r.popularityLabel,
    given: r.given.map(g => ({
      char: g.char,
      pinyin: g.pinyin,
      wuxing: g.wuxing,
      strokes: g.strokeKangxi,
    })),
    score: {
      total: r.score.total,
      xiyong: r.score.xiyong,
      yinlv: r.score.yinlv,
      ziyi: r.score.ziyi,
      zixing: r.score.zixing,
      shuli: r.score.shuli,
      dute: r.score.dute,
    },
  }));

  const rc = await resolveRoleFromRequest(req);
  const caps = getCapabilities(rc.role, rc.expired);
  const cropped = cropNamingCandidates(fullDtos, caps);

  return NextResponse.json({
    plan: { role: rc.role, detail: caps.namingDetail, limit: cropped.limit },
    limited: cropped.limited,
    count: cropped.candidates.length,
    candidates: cropped.candidates,
  });
}
