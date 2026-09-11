/**
 * reports/month.ts 月度报告骨架测试
 * - 流年/流月/流日全部走 bazi-engine；流月流日以节气为界
 * - 当前流月、流日高亮正确
 * - JSON 可序列化 + snapshot 锁定
 */
import { describe, it, expect } from 'vitest';
import { paipan } from '@/lib/bazi/paipan';
import { buildMonthReport } from '@/lib/reports/month';

const NOW = new Date('2026-09-08T12:00:00+08:00');

async function buildBaselineMonth() {
  const result = await paipan({
    year: 1975, month: 6, day: 14, hour: 0, minute: 30,
    gender: 'male', calendar: 'solar',
    lon: 120, lat: 39.9, timezone: 'Asia/Shanghai',
    now: NOW,
  });
  return buildMonthReport(result, { now: NOW, locale: 'zh' });
}

describe('month: 月度报告骨架（基准盘，now=2026-09-08）', () => {
  it('meta：kind=month', async () => {
    const r = await buildBaselineMonth();
    expect(r.meta.kind).toBe('month');
    expect(r.meta.engine).toBe('bazi-engine');
    expect(r.meta.generatedAt).toBe(NOW.toISOString());
  });

  it('liunian 锚点：2026 年', async () => {
    const r = await buildBaselineMonth();
    expect(r.liunian).not.toBeNull();
    expect(r.liunian?.year).toBe(2026);
    expect(r.liunian?.ganzhi).toHaveLength(2);
  });

  it('liuyue：当前流月高亮（白露后节气月），带节气名', async () => {
    const r = await buildBaselineMonth();
    expect(r.liuyue).not.toBeNull();
    expect(r.liuyue?.isCurrent).toBe(true);
    expect(r.liuyue?.scope).toBe('liuyue');
    expect(r.liuyue?.jieqiName).toBeTruthy();
  });

  it('liuri：当前节气月内每日（28–32 天），恰好 1 个当前日（9/8）', async () => {
    const r = await buildBaselineMonth();
    expect(r.liuri.length).toBeGreaterThanOrEqual(28);
    expect(r.liuri.length).toBeLessThanOrEqual(32);
    expect(r.liuri.every(d => d.scope === 'liuri')).toBe(true);
    const cur = r.liuri.filter(d => d.isCurrent);
    expect(cur.length).toBe(1);
    // 当前流日标签为公历 M/D（TimelineView 渲染口径），干支长度 2
    expect(cur[0].ganzhi).toHaveLength(2);
  });

  it('JSON 序列化往返一致', async () => {
    const r = await buildBaselineMonth();
    expect(JSON.parse(JSON.stringify(r))).toEqual(r);
  });

  it('snapshot 锁定', async () => {
    const r = await buildBaselineMonth();
    expect({
      liunian: r.liunian,
      liuyue: r.liuyue && { label: r.liuyue.label, gz: r.liuyue.ganzhi, jieqi: r.liuyue.jieqiName, jieqiDate: r.liuyue.jieqiDate },
      liuriCount: r.liuri.length,
      liuriCurrent: r.liuri.find(d => d.isCurrent)?.label ?? null,
      liuriHead: r.liuri.slice(0, 3).map(d => ({ label: d.label, gz: d.ganzhi })),
      liuriTail: r.liuri.slice(-3).map(d => ({ label: d.label, gz: d.ganzhi })),
    }).toMatchSnapshot();
  });
});
