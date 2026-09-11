/**
 * reports/life.ts 命理报告数据构建测试
 * - 基准命盘（乙卯 壬午 辛卯 戊子，1975-06-14 00:30 男）完整结构 snapshot
 * - 断语全部出自四书白名单
 * - 流年走 bazi-engine（10 项，当前项高亮）
 * - 建禄月（甲日寅月）pattern=null → 格局整卡缺省
 * - JSON 可序列化（存档要求）
 */
import { describe, it, expect } from 'vitest';
import { paipan } from '@/lib/bazi/paipan';
import { buildLifeReport } from '@/lib/reports/life';
import { ALLOWED_CLASSICS } from '@/lib/bazi/config';
import type { LifeReportData } from '@/lib/reports/types';

const NOW = new Date('2026-09-08T12:00:00+08:00');
const CLASSIC_SET = new Set<string>(ALLOWED_CLASSICS);

async function buildBaseline(): Promise<LifeReportData> {
  const result = await paipan({
    year: 1975, month: 6, day: 14, hour: 0, minute: 30,
    gender: 'male', calendar: 'solar',
    lon: 120, lat: 39.9, timezone: 'Asia/Shanghai',
    now: NOW,
  });
  return buildLifeReport(result, { now: NOW, locale: 'zh' });
}

describe('life: 基准命盘（乙卯 壬午 辛卯 戊子）', () => {
  it('四柱锁定：乙卯 / 壬午 / 辛卯 / 戊子', async () => {
    const r = await buildBaseline();
    const p = r.chart.pillars;
    expect(p.year.gan + p.year.zhi).toBe('乙卯');
    expect(p.month.gan + p.month.zhi).toBe('壬午');
    expect(p.day.gan + p.day.zhi).toBe('辛卯');
    expect(p.hour.gan + p.hour.zhi).toBe('戊子');
  });

  it('meta：kind=life / engine=bazi-engine / locale=zh / 时间锁定', async () => {
    const r = await buildBaseline();
    expect(r.meta.kind).toBe('life');
    expect(r.meta.engine).toBe('bazi-engine');
    expect(r.meta.locale).toBe('zh');
    expect(r.meta.generatedAt).toBe(NOW.toISOString());
  });

  it('subject：男性 + 真太阳时字符串 + 生肖兔（年支卯）', async () => {
    const r = await buildBaseline();
    expect(r.subject.gender).toBe('male');
    expect(r.subject.trueSolarTime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    expect(r.subject.zodiac?.branch).toBe('卯');
    expect(r.subject.zodiac?.animal).toBe('兔');
  });

  it('chart：日干辛、日干五行金', async () => {
    const r = await buildBaseline();
    expect(r.chart.dayGan).toBe('辛');
    expect(r.chart.dayGanWuxing).toBe('金');
    expect(r.chart.relations.length).toBeGreaterThan(0);
  });

  it('wuxing：强弱五档之一 + 五行百分合计100（V1.1 模型，十神无独立分数）', async () => {
    const r = await buildBaseline();
    expect(['极强', '偏强', '均衡', '偏弱', '极弱']).toContain(r.wuxing.strength);
    // 最大余数法：五项合计精确 =100
    const scoreSum = r.wuxing.score.mu + r.wuxing.score.huo + r.wuxing.score.tu
      + r.wuxing.score.jin + r.wuxing.score.shui;
    expect(scoreSum).toBe(100);
    // V1.1 基准盘对拍：木36 火23 土23 金0 水18（辛金午月极弱）
    expect(r.wuxing.score).toEqual({ mu: 36, huo: 23, tu: 23, jin: 0, shui: 18 });
    expect(r.wuxing.strength).toBe('极弱');
  });

  it('xiyong：用喜忌与幸运映射字段齐全（中和局喜用可空，由调候补充）', async () => {
    const r = await buildBaseline();
    expect(Array.isArray(r.xiyong.yong)).toBe(true);
    expect(Array.isArray(r.xiyong.xi)).toBe(true);
    expect(Array.isArray(r.xiyong.ji)).toBe(true);
    expect(Array.isArray(r.xiyong.colors)).toBe(true);
    expect(Array.isArray(r.xiyong.directions)).toBe(true);
    expect(Array.isArray(r.xiyong.numbers)).toBe(true);
    // 基准盘辛金午月偏弱 → 必有喜用
    expect(r.xiyong.yong.length).toBeGreaterThan(0);
    expect(r.xiyong.colors.length).toBeGreaterThan(0);
  });

  it('pattern：辛日午月本气七杀 → 七杀格，断语出自子平真诠', async () => {
    const r = await buildBaseline();
    expect(r.pattern.result?.name).toBe('七杀格');
    expect(r.pattern.duanyu.length).toBeGreaterThan(0);
    for (const d of r.pattern.duanyu) {
      expect(d.topic).toBe('pattern');
      expect(d.source).toBe('子平真诠');
    }
  });

  it('tiaohou：午月归夏，断语出自穷通宝鉴', async () => {
    const r = await buildBaseline();
    expect(r.tiaohou.season).toBe('夏');
    expect(r.tiaohou.source).toBe('穷通宝鉴');
    expect(r.tiaohou.duanyu.length).toBeGreaterThan(0);
    expect(r.tiaohou.duanyu.every(d => d.source === '穷通宝鉴')).toBe(true);
  });

  it('strengthDuanyu：旺衰断语出自三命通会', async () => {
    const r = await buildBaseline();
    expect(r.strengthDuanyu.length).toBeGreaterThan(0);
    expect(r.strengthDuanyu.every(d => d.source === '三命通会')).toBe(true);
  });

  it('dayun：起运信息 + 当前大运非空 + 顺逆排标记', async () => {
    const r = await buildBaseline();
    expect(r.dayun.qiYun.age).toBeGreaterThan(0);
    expect(r.dayun.qiYun.solar).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(['顺排', '逆排']).toContain(r.dayun.direction);
    expect(r.dayun.list.length).toBeGreaterThan(0);
    expect(r.dayun.current).not.toBeNull();
    expect(r.dayun.current?.isCurrent).toBe(true);
  });

  it('liunian：走引擎的当前大运 10 年，2026 为当前项', async () => {
    const r = await buildBaseline();
    expect(r.liunian.length).toBe(10);
    expect(r.liunian.every(i => i.scope === 'liunian')).toBe(true);
    const cur = r.liunian.filter(i => i.isCurrent);
    expect(cur.length).toBe(1);
    expect(cur[0].year).toBe(2026);
    expect(cur[0].age).toBe(2026 - 1975 + 1);
  });

  it('全报告断语出处均在四书白名单内', async () => {
    const r = await buildBaseline();
    const all = [
      ...r.pattern.duanyu,
      ...r.tiaohou.duanyu,
      ...r.strengthDuanyu,
    ];
    expect(all.length).toBeGreaterThan(0);
    const bad = all.filter(d => !CLASSIC_SET.has(d.source));
    expect(bad.map(d => `${d.id}:${d.source}`)).toEqual([]);
  });

  it('JSON 序列化往返一致（存档要求）', async () => {
    const r = await buildBaseline();
    const roundtrip = JSON.parse(JSON.stringify(r)) as LifeReportData;
    expect(roundtrip).toEqual(r);
  });

  it('完整结构 snapshot 锁定', async () => {
    const r = await buildBaseline();
    expect({
      pillars: ['year', 'month', 'day', 'hour'].map(k => {
        const p = r.chart.pillars[k as keyof typeof r.chart.pillars];
        return { gan: p.gan, zhi: p.zhi, shishen: p.shishen, nayin: p.nayin, dishi: p.dishi };
      }),
      strength: r.wuxing.strength,
      score: r.wuxing.score,
      xiyong: r.xiyong,
      pattern: r.pattern.result ? { name: r.pattern.result.name, sub: r.pattern.result.sub ?? null } : null,
      patternDuanyu: r.pattern.duanyu.map(d => d.id),
      tiaohou: { gods: r.tiaohou.gods, season: r.tiaohou.season, duanyu: r.tiaohou.duanyu.map(d => d.id) },
      strengthDuanyu: r.strengthDuanyu.map(d => d.id),
      dayun: r.dayun.list.map(d => ({ gz: d.ganzhi, age: d.startAge, year: d.startYear, current: d.isCurrent })),
      liunian: r.liunian.map(i => ({ year: i.year, age: i.age, gz: i.ganzhi, shishen: i.shishen, current: i.isCurrent })),
      zodiac: r.subject.zodiac?.animal ?? null,
      trueSolarTime: r.subject.trueSolarTime,
    }).toMatchSnapshot();
  });
});

describe('life: 格局缺省场景（甲日寅月建禄，八正格不识别）', () => {
  it('pattern.result=null 且 duanyu=[]（整卡缺省，不写"需人工复核"）', async () => {
    const result = await paipan({
      year: 2025, month: 2, day: 14, hour: 10, minute: 0,
      gender: 'male', calendar: 'solar',
      lon: 120, lat: 39.9, timezone: 'Asia/Shanghai',
      now: NOW,
    });
    // 锁定前提：甲日寅月
    expect(result.pillars.day.gan).toBe('甲');
    expect(result.pillars.month.zhi).toBe('寅');

    const r = await buildLifeReport(result, { now: NOW, locale: 'zh' });
    expect(r.pattern.result).toBeNull();
    expect(r.pattern.duanyu).toEqual([]);
    // 其他章节不受影响
    expect(r.tiaohou.duanyu.length).toBeGreaterThan(0);
    expect(r.strengthDuanyu.length).toBeGreaterThan(0);
    expect(r.liunian.length).toBe(10);
  });
});
