/**
 * src/lib/auth/rateLimit.ts
 * 游客每日限流（v7 §5.2：四柱排盘 guest 3 次/天）。
 *
 * MVP 实现：进程内存桶（按日重置），dev/单实例够用；
 * 生产多实例部署时替换为 Upstash Redis 或 Supabase 计数表（接口不变）。
 * key 约定 `paipan:{ip}`。
 */
import type { NextRequest } from 'next/server';

interface Bucket { date: string; count: number }

const buckets = new Map<string, Bucket>();

export interface DailyLimitResult { ok: boolean; remaining: number }

export function checkDailyLimit(key: string, limit: number, now: Date = new Date()): DailyLimitResult {
  const date = now.toISOString().slice(0, 10);
  const b = buckets.get(key);
  if (!b || b.date !== date) {
    buckets.set(key, { date, count: 1 });
    return { ok: true, remaining: limit - 1 };
  }
  if (b.count >= limit) return { ok: false, remaining: 0 };
  b.count += 1;
  return { ok: true, remaining: limit - b.count };
}

/** 测试/开发用：清空所有限流桶 */
export function resetRateLimits(): void {
  buckets.clear();
}

/** 取客户端 IP：反代场景读 x-forwarded-for 首段，本地 dev 兜底 'local' */
export function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
}
