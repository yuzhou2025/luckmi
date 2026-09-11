/**
 * tests/auth/roleMatrix.test.ts
 * v7 §5.2 角色→能力矩阵锁定（含过期降级）。
 */
import { describe, it, expect } from 'vitest';
import { getCapabilities } from '@/lib/auth/roleMatrix';

describe('getCapabilities（v7 §5.2 矩阵）', () => {
  it('guest：简版 + 3 条截断无详解', () => {
    const c = getCapabilities('guest');
    expect(c.fullBaZi).toBe(false);
    expect(c.timeline).toBe(false);
    expect(c.namingFullCount).toBe(3);
    expect(c.namingDetail).toBe(false);
    expect(c.dailyFortune).toBe(false);
  });

  it('registered：同简版档，开始有每日运势', () => {
    const c = getCapabilities('registered');
    expect(c.fullBaZi).toBe(false);
    expect(c.timeline).toBe(false);
    expect(c.namingFullCount).toBe(3);
    expect(c.namingDetail).toBe(false);
    expect(c.dailyFortune).toBe(true);
  });

  it('single_paid：10 条完整，排盘仍简版', () => {
    const c = getCapabilities('single_paid');
    expect(c.fullBaZi).toBe(false);
    expect(c.timeline).toBe(false);
    expect(c.namingFullCount).toBe(10);
    expect(c.namingDetail).toBe(true);
  });

  it('bazi_report：全量排盘 + 时间轴', () => {
    const c = getCapabilities('bazi_report');
    expect(c.fullBaZi).toBe(true);
    expect(c.timeline).toBe(true);
    expect(c.nameReport).toBe(true);
  });

  it('pro_yearly：全量 + 流时 + 年报 + 每日运势增强', () => {
    const c = getCapabilities('pro_yearly');
    expect(c.fullBaZi).toBe(true);
    expect(c.hourPillar).toBe(true);
    expect(c.annualReport).toBe(true);
    expect(c.dailyFortunePlus).toBe(true);
    expect(c.consultDiscount).toBeCloseTo(0.9);
  });

  it('pro 会员过期 → 降级为 registered 档', () => {
    for (const role of ['pro_monthly', 'pro_yearly'] as const) {
      const c = getCapabilities(role, true);
      expect(c.fullBaZi).toBe(false);
      expect(c.timeline).toBe(false);
      expect(c.namingFullCount).toBe(3);
      expect(c.namingDetail).toBe(false);
    }
  });
});
