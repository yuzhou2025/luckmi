/**
 * tests/auth/rateLimit.test.ts
 * 游客每日限流：3 次/天，按日重置，key 相互独立（v7 §5.2 guest 排盘 3 次/天）。
 */
import { describe, it, expect } from 'vitest';
import { checkDailyLimit } from '@/lib/auth/rateLimit';

describe('checkDailyLimit', () => {
  it('同日第 4 次拒绝', () => {
    const now = new Date('2026-09-10T10:00:00Z');
    expect(checkDailyLimit('paipan:1.2.3.4', 3, now)).toEqual({ ok: true, remaining: 2 });
    expect(checkDailyLimit('paipan:1.2.3.4', 3, now)).toEqual({ ok: true, remaining: 1 });
    expect(checkDailyLimit('paipan:1.2.3.4', 3, now)).toEqual({ ok: true, remaining: 0 });
    expect(checkDailyLimit('paipan:1.2.3.4', 3, now)).toEqual({ ok: false, remaining: 0 });
  });

  it('次日重置', () => {
    const d1 = new Date('2026-09-10T23:59:59Z');
    const d2 = new Date('2026-09-11T00:00:01Z');
    checkDailyLimit('paipan:5.6.7.8', 3, d1);
    checkDailyLimit('paipan:5.6.7.8', 3, d1);
    checkDailyLimit('paipan:5.6.7.8', 3, d1);
    expect(checkDailyLimit('paipan:5.6.7.8', 3, d1).ok).toBe(false);
    expect(checkDailyLimit('paipan:5.6.7.8', 3, d2)).toEqual({ ok: true, remaining: 2 });
  });

  it('不同 key 相互独立', () => {
    const now = new Date('2026-09-10T12:00:00Z');
    checkDailyLimit('paipan:a', 3, now);
    checkDailyLimit('paipan:a', 3, now);
    expect(checkDailyLimit('paipan:a', 3, now)).toEqual({ ok: true, remaining: 0 });
    expect(checkDailyLimit('paipan:b', 3, now)).toEqual({ ok: true, remaining: 2 });
  });
});
