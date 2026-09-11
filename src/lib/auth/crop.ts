/**
 * src/lib/auth/crop.ts
 * 角色字段裁剪纯函数（ADR-3）。引擎跑全量 → 按能力档裁剪输出。
 *
 * 排盘简版（guest/registered/single_paid，v7 §5.2）：无神煞、无大运/起运；
 * 命理事实仍来自同一引擎，只是输出裁剪 —— 事实层不做任何改写（ADR-2）。
 */
import type { PaipanResult, SimplePaipanResult } from '@/lib/bazi/paipan';
import type { Capabilities } from './types';

export type { SimplePaipanResult };

/** API 排盘结果：全量或简版（按角色而定） */
export type CroppedPaipanResult = PaipanResult | SimplePaipanResult;

export function cropPaipanResult(r: PaipanResult, caps: Capabilities): CroppedPaipanResult {
  if (caps.fullBaZi) return r;
  const { dayun: _dayun, qiYun: _qiYun, dayunDirection: _direction, ...rest } = r;
  const pillars = Object.fromEntries(
    Object.entries(rest.pillars).map(([pos, pillar]) => [pos, { ...pillar, shensha: [] }]),
  ) as unknown as SimplePaipanResult['pillars'];
  return { ...rest, pillars };
}

/** 起名候选裁剪：按档位截断条数；namingDetail=false 时剥离字义详解 */
export interface NamingCropResult<T> {
  candidates: T[];
  /** 是否因档位发生截断/剥离（客户端据此展示升级提示） */
  limited: boolean;
  /** 档位允许的完整候选条数 */
  limit: number;
}

export function cropNamingCandidates<T extends { meaning?: unknown }>(
  list: T[],
  caps: Capabilities,
): NamingCropResult<T> {
  const limit = caps.namingFullCount;
  const cut = limit > 0 ? list.slice(0, limit) : [];
  const candidates = caps.namingDetail
    ? cut
    : cut.map(c => {
        const { meaning: _meaning, ...rest } = c;
        return rest as T;
      });
  return { candidates, limited: !caps.namingDetail || list.length > candidates.length, limit };
}
