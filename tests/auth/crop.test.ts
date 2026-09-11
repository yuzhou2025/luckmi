/**
 * tests/auth/crop.test.ts
 * 角色字段裁剪纯函数（ADR-3 / v7 §5.2）。
 * 排盘：guest/registered/single_paid → 简版（无神煞/大运/起运）；bazi_report/pro → 全量。
 * 起名：guest/registered → 3 条且剥离字义详解；single_paid/bazi_report/pro → 10 条完整。
 */
import { describe, it, expect } from 'vitest';
import { cropPaipanResult, cropNamingCandidates } from '@/lib/auth/crop';
import { getCapabilities } from '@/lib/auth/roleMatrix';
import type { PaipanResult } from '@/lib/bazi/paipan';

/** 构造最小 PaipanResult 结构（裁剪只看结构不看命理值） */
function fakeFullResult(): PaipanResult {
  const mkPillar = () => ({
    position: 'year' as const,
    gan: '乙', zhi: '卯', canggan: ['乙'], shishen: '比肩', zhishen: ['比肩'],
    nayin: '大溪水', kongwang: ['子', '丑'], dishi: '临官', zizuo: '临官',
    shensha: [{ name: '太极贵人', level: '大' as const, source: '年干' as const }],
  });
  return {
    trueSolarTime: { year: 1975, month: 6, day: 14, hour: 0, minute: 30 },
    inputEcho: {} as PaipanResult['inputEcho'],
    pillars: { year: mkPillar(), month: mkPillar(), day: mkPillar(), hour: mkPillar() },
    dayGan: '辛',
    dayGanWuxing: '金',
    relations: [],
    wuxingScore: { mu: 36, huo: 23, tu: 23, jin: 0, shui: 18 },
    strength: '极弱',
    wangxiang: [],
    xiYong: { yong: ['土'], xi: ['金'], ji: ['火', '木', '水'], colors: [], directions: [], numbers: [] },
    pattern: null,
    tiaoHou: { gods: ['壬', '己'], source: '穷通宝鉴' },
    dayun: [{ startAge: 5, startYear: 1980, endAge: 15, endYear: 1990, ganzhi: '辛巳', isCurrent: false }],
    qiYun: { solar: '1980-03-01', age: 5 },
    dayunDirection: '顺排',
  } as unknown as PaipanResult;
}

describe('cropPaipanResult（排盘简版/全量裁剪）', () => {
  it('全量档（bazi_report）返回原对象，含 dayun/qiYun/神煞', () => {
    const full = fakeFullResult();
    const out = cropPaipanResult(full, getCapabilities('bazi_report'));
    expect(out).toBe(full);
    expect(out).toHaveProperty('dayun');
    expect(out).toHaveProperty('qiYun');
    expect(full.pillars.year.shensha).toHaveLength(1);
  });

  it.each(['guest', 'registered', 'single_paid'] as const)('简版档（%s）剥离大运/起运并清空神煞', role => {
    const full = fakeFullResult();
    const out = cropPaipanResult(full, getCapabilities(role));
    expect(out).not.toHaveProperty('dayun');
    expect(out).not.toHaveProperty('qiYun');
    expect(out).not.toHaveProperty('dayunDirection');
    for (const pos of ['year', 'month', 'day', 'hour'] as const) {
      expect(out.pillars[pos].shensha).toEqual([]);
    }
    // 其余命理事实原样保留（ADR-2：只裁剪不改写）
    expect(out.dayGan).toBe('辛');
    expect(out.wuxingScore.jin).toBe(0);
    expect(out.xiYong.yong).toEqual(['土']);
  });

  it('pro 过期降级后同样拿到简版', () => {
    const out = cropPaipanResult(fakeFullResult(), getCapabilities('pro_monthly', true));
    expect(out).not.toHaveProperty('dayun');
  });
});

describe('cropNamingCandidates（起名候选截断/剥离）', () => {
  const mk = (i: number) => ({
    full: `王甲${i}`,
    meaning: `meaning-${i}`,
    score: { total: 90 - i },
  });

  it('guest/registered：3 条且剥离 meaning', () => {
    for (const role of ['guest', 'registered'] as const) {
      const r = cropNamingCandidates([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(mk), getCapabilities(role));
      expect(r.candidates).toHaveLength(3);
      expect(r.limit).toBe(3);
      expect(r.limited).toBe(true);
      for (const c of r.candidates) expect(c).not.toHaveProperty('meaning');
    }
  });

  it('single_paid/bazi_report/pro：10 条完整含 meaning', () => {
    for (const role of ['single_paid', 'bazi_report', 'pro_monthly', 'pro_yearly'] as const) {
      const r = cropNamingCandidates([1, 2, 3].map(mk), getCapabilities(role));
      expect(r.candidates).toHaveLength(3);
      expect(r.limit).toBe(10);
      expect(r.limited).toBe(false);
      for (const c of r.candidates) expect(c.meaning).toBe(`meaning-${c.full.slice(-1)}`);
    }
  });

  it('single_paid 候选超过 10 条时截断到 10', () => {
    const r = cropNamingCandidates(Array.from({ length: 12 }, (_, i) => mk(i)), getCapabilities('single_paid'));
    expect(r.candidates).toHaveLength(10);
    expect(r.limited).toBe(true);
    expect(r.candidates[0].meaning).toBeDefined();
  });

  it('consult_owner：0 条', () => {
    const r = cropNamingCandidates([1, 2, 3].map(mk), getCapabilities('consult_owner'));
    expect(r.candidates).toHaveLength(0);
    expect(r.limited).toBe(true);
  });

  it('namingDetail=false 即使条数未满也剥离 meaning', () => {
    const r = cropNamingCandidates([1, 2].map(mk), getCapabilities('guest'));
    expect(r.candidates).toHaveLength(2);
    for (const c of r.candidates) expect(c).not.toHaveProperty('meaning');
    expect(r.limited).toBe(true);
  });
});
