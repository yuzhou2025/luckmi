/**
 * reports/year.ts 流年报告骨架测试
 * - 当前流年/流月全部走 bazi-engine（流月以节气为界，12 项）
 * - 当前流年高亮、虚岁正确
 * - 流年十神义理断语出自《渊海子平》
 * - JSON 可序列化 + snapshot 锁定
 */
import { describe, it, expect } from 'vitest';
import { paipan } from '@/lib/bazi/paipan';
import { buildYearReport } from '@/lib/reports/year';
import { ALLOWED_CLASSICS } from '@/lib/bazi/config';

const NOW = new Date('2026-09-08T12:00:00+08:00');
const CLASSIC_SET = new Set<string>(ALLOWED_CLASSICS);

async function buildBaselineYear() {
  const result = await paipan({
    year: 1975, month: 6, day: 14, hour: 0, minute: 30,
    gender: 'male', calendar: 'solar',
    lon: 120, lat: 39.9, timezone: 'Asia/Shanghai',
    now: NOW,
  });
  return buildYearReport(result, { now: NOW, locale: 'zh' });
}

describe('year: 流年报告骨架（基准盘，now=2026-09-08）', () => {
  it('meta：kind=year / engine / locale', async () => {
    const r = await buildBaselineYear();
    expect(r.meta.kind).toBe('year');
    expect(r.meta.engine).toBe('bazi-engine');
    expect(r.meta.locale).toBe('zh');
    expect(r.meta.generatedAt).toBe(NOW.toISOString());
  });

  it('dayun：当前大运非空且 isCurrent', async () => {
    const r = await buildBaselineYear();
    expect(r.dayun).not.toBeNull();
    expect(r.dayun?.isCurrent).toBe(true);
    expect(r.dayun?.ganzhi).toHaveLength(2);
  });

  it('liunian：当前流年=2026，虚岁 52，scope=liunian', async () => {
    const r = await buildBaselineYear();
    expect(r.liunian).not.toBeNull();
    expect(r.liunian?.year).toBe(2026);
    expect(r.liunian?.age).toBe(2026 - 1975 + 1);
    expect(r.liunian?.scope).toBe('liunian');
    expect(r.liunian?.isCurrent).toBe(true);
    expect(r.liunian?.ganzhi).toHaveLength(2);
  });

  it('liuyue：当年 12 个节气月，恰好 1 个当前月，均带节气信息', async () => {
    const r = await buildBaselineYear();
    expect(r.liuyue.length).toBe(12);
    expect(r.liuyue.every(m => m.scope === 'liuyue')).toBe(true);
    const cur = r.liuyue.filter(m => m.isCurrent);
    expect(cur.length).toBe(1);
    // 2026-09-08 在白露（~9/7）之后 → 当前月节气名为白露
    expect(cur[0].jieqiName).toBeTruthy();
    expect(r.liuyue.every(m => !!m.jieqiName && !!m.jieqiDate)).toBe(true);
  });

  it('断语：流年天干十神义理出自渊海子平', async () => {
    const r = await buildBaselineYear();
    expect(r.duanyu.shishen.length).toBeGreaterThan(0);
    for (const d of r.duanyu.shishen) {
      expect(d.topic).toBe('shishen');
      expect(d.source).toBe('渊海子平');
      expect(CLASSIC_SET.has(d.source)).toBe(true);
      expect(d.matchKey).toBe(r.liunian?.shishen);
    }
  });

  it('JSON 序列化往返一致', async () => {
    const r = await buildBaselineYear();
    expect(JSON.parse(JSON.stringify(r))).toEqual(r);
  });

  it('snapshot 锁定', async () => {
    const r = await buildBaselineYear();
    expect({
      dayun: r.dayun?.ganzhi ?? null,
      liunian: r.liunian && { year: r.liunian.year, age: r.liunian.age, gz: r.liunian.ganzhi, shishen: r.liunian.shishen },
      liuyue: r.liuyue.map(m => ({ label: m.label, gz: m.ganzhi, jieqi: m.jieqiName, current: m.isCurrent })),
      duanyu: r.duanyu.shishen.map(d => d.id),
    }).toMatchSnapshot();
  });
});
