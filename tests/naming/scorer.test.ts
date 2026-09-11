import { describe, it, expect } from 'vitest';
import { scoreName } from '@/lib/naming/scorer';
import { NAMING_WEIGHT } from '@/lib/naming/config';
import type { CharMeta } from '@/lib/naming/charMeta';

function cm(char: string, over: Partial<CharMeta> = {}): CharMeta {
  return {
    pinyin: 'a', pinyinList: ['a'], shengmu: '', yunmu: 'a', tone: 1, pingze: '平',
    strokeKangxi: 7, strokeSimple: 7, wuxing: '土', radical: '一', freqRank: 300,
    ...over, char,
  };
}

const li = cm('李', { strokeKangxi: 7 });
const hao = cm('浩', { wuxing: '水', strokeKangxi: 11 });
const ran = cm('然', { strokeKangxi: 12 });

const round1 = (n: number) => Math.round(n * 10) / 10;

describe('scorer 六维加权评分', () => {
  it('权重合计 1.00（config 锁死）', () => {
    const sum = Object.values(NAMING_WEIGHT).reduce((s, v) => s + v, 0);
    expect(Math.round(sum * 100) / 100).toBe(1);
  });

  it('喜用分档：用100 / 喜85 / 中性55 / 忌10；无入参 75', () => {
    const yong = { yong: ['水'], xi: [], ji: [] };
    const xi = { yong: [], xi: ['水'], ji: [] };
    const neutral = { yong: ['金'], xi: [], ji: [] };
    const ji = { yong: [], xi: [], ji: ['水'] };
    expect(scoreName({ surname: li, given: [hao], xiYong: yong }).xiyong).toBe(100);
    expect(scoreName({ surname: li, given: [hao], xiYong: xi }).xiyong).toBe(85);
    expect(scoreName({ surname: li, given: [hao], xiYong: neutral }).xiyong).toBe(55);
    expect(scoreName({ surname: li, given: [hao], xiYong: ji }).xiyong).toBe(10);
    expect(scoreName({ surname: li, given: [hao] }).xiyong).toBe(75);
  });

  it('音律：李浩然（仄仄平·声调3种）100 分；李丽丽 双声叠韵扣至 0', () => {
    expect(scoreName({ surname: li, given: [hao, ran] }).yinlv).toBe(100);
    const li4 = cm('丽', { strokeKangxi: 7 });
    expect(scoreName({ surname: li, given: [li4, cm('丽', { strokeKangxi: 7 })] }).yinlv).toBe(0);
  });

  it('字义：有释义 80 / 无 60；意译标签命中 +15', () => {
    const withMeaning = cm('宸', { meaning: '帝王居所' });
    expect(scoreName({ surname: li, given: [withMeaning] }).ziyi).toBe(80);
    expect(scoreName({ surname: li, given: [cm('宸')] }).ziyi).toBe(60);
    expect(scoreName({ surname: li, given: [withMeaning], semanticMeaning: '坚毅' }).ziyi).toBe(95);
  });

  it('字形：康熙笔画极差分层 100/88/75/60', () => {
    expect(scoreName({ surname: li, given: [hao, ran] }).zixing).toBe(100);   // 11,12 极差 1
    const s2 = cm('一', { strokeKangxi: 2 });
    const s20 = cm('释', { strokeKangxi: 20 });
    expect(scoreName({ surname: li, given: [s2, s20] }).zixing).toBe(60);     // 极差 18
  });

  it('数理：李浩然 五格 = 100/100/75/100 加权 → 91', () => {
    // 人格18吉 地格23吉 外格13吉 总格30半吉 → .35*100+.35*75+.15*100+.15*100 = 91.25 → 91
    expect(scoreName({ surname: li, given: [hao, ran] }).shuli).toBe(91);
  });

  it('单名数理：外格权重并入总格（王昭 人18吉 总18吉 地15吉 外2凶）', () => {
    // 复名口径会 = .35*100+.35*100+.15*100+.15*40 = 91
    // 单名口径（豁免外格，0.15并入总格）= .35*100+.50*100+.15*100 = 100
    const wang = cm('王', { strokeKangxi: 4 });
    const zhao = cm('昭', { strokeKangxi: 14 });
    expect(scoreName({ surname: wang, given: [zhao] }).shuli).toBe(100);
  });

  it('独特性：freqRank/80 截断 [20,100]；无频次 40；非简体形式+低频(>3000)封顶 15', () => {
    // 简体形式 + 中频：freqRank/80
    expect(scoreName({ surname: li, given: [cm('一', { freqRank: 4000, simplified: true })] }).dute).toBe(50);
    // 繁简同形 + 高频：freqRank/80（不受封顶影响）
    expect(scoreName({ surname: li, given: [cm('一', { freqRank: 100, simplified: false })] }).dute).toBe(20);
    // 非简体形式 + 低频（>3000）：封顶 15（避免奖励繁体字）
    expect(scoreName({ surname: li, given: [cm('一', { freqRank: 4000, simplified: false })] }).dute).toBe(15);
    // 混合：简体中频 + 非简体低频 → avg(50, 15) = 32.5 → 33
    expect(scoreName({ surname: li, given: [cm('一', { freqRank: 4000, simplified: true }), cm('二', { freqRank: 5000, simplified: false })] }).dute).toBe(33);
    // 无频次：40
    expect(scoreName({ surname: li, given: [cm('一', { freqRank: undefined })] }).dute).toBe(40);
    // 极高频：下限 20
    expect(scoreName({ surname: li, given: [cm('一', { freqRank: 100, simplified: true })] }).dute).toBe(20);
  });

  it('总分 = 六维 × config 权重（1 位小数），同入参同出参', () => {
    const r = scoreName({ surname: li, given: [hao, ran] });
    const expected = round1(
      NAMING_WEIGHT.xiyong * r.xiyong + NAMING_WEIGHT.yinlv * r.yinlv +
      NAMING_WEIGHT.ziyi * r.ziyi + NAMING_WEIGHT.zixing * r.zixing +
      NAMING_WEIGHT.shuli * r.shuli + NAMING_WEIGHT.dute * r.dute,
    );
    expect(r.total).toBe(expected);
    expect(r.total).toBeLessThanOrEqual(100);
    expect(r.total).toBeGreaterThanOrEqual(0);
    expect(JSON.stringify(r)).toBe(JSON.stringify(scoreName({ surname: li, given: [hao, ran] })));
  });
});
