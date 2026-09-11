/**
 * wuxing + pattern 测试
 * 覆盖：基准盘五行百分占比校准（±2）、强弱、喜用土金、调候标注、
 *       七杀格·杀印相生正例、格局不输出反例（建禄/月刃）、十神纯函数
 */
import { describe, it, expect } from 'vitest';
import { paipan } from '@/lib/bazi/paipan';
import { getShiShen, GAN_WUXING } from '@/lib/bazi/shishen';
import { detectPattern } from '@/lib/bazi/pattern';
import {
  calcWuxingRaw,
  normalizeToPercent,
  calcStrength,
  calcXiYong,
  calcTiaoHou,
} from '@/lib/bazi/wuxing';

// ── 十神纯函数（日干为轴）──────────────────────────────

describe('shishen: 十神以日干为轴', () => {
  it('辛金日干基准盘十神', () => {
    // 乙（阴木）被辛（阴金）克：同阴 → 偏财
    expect(getShiShen('辛', '乙')).toBe('偏财');
    // 壬（阳水）泄辛（阴金）：辛生壬，异阴阳 → 伤官
    expect(getShiShen('辛', '壬')).toBe('伤官');
    // 戊（阳土）生辛（阴金）：异阴阳 → 正印
    expect(getShiShen('辛', '戊')).toBe('正印');
    // 丁（阴火）克辛（阴金）：同阴 → 七杀
    expect(getShiShen('辛', '丁')).toBe('七杀');
    // 己（阴土）生辛（阴金）：同阴 → 偏印
    expect(getShiShen('辛', '己')).toBe('偏印');
    // 癸（阴水）泄辛（阴金）：同阴 → 食神
    expect(getShiShen('辛', '癸')).toBe('食神');
    // 庚（阳金）同我：异阴阳 → 劫财
    expect(getShiShen('辛', '庚')).toBe('劫财');
    // 日柱自身：辛同字 → 日主
    expect(getShiShen('辛', '辛')).toBe('日主');
    // 他柱/流运同字（external=true）→ 比肩，不作日主
    expect(getShiShen('辛', '辛', true)).toBe('比肩');
    // 丙（阳火）克辛（阴金）：异阴阳 → 正官
    expect(getShiShen('辛', '丙')).toBe('正官');
    // 甲（阳木）被辛克：异阴阳 → 正财
    expect(getShiShen('辛', '甲')).toBe('正财');
  });

  it('五行映射', () => {
    expect(GAN_WUXING.辛).toBe('金');
    expect(GAN_WUXING.午).toBeUndefined(); // 地支不在天干表
  });
});

// ── 基准盘五行校准 ─────────────────────────────────────

describe('wuxing: 基准盘百分占比校准 V1.1（乙卯 壬午 辛卯 戊子，午月火令）', () => {
  it('五行占比 = 手算对拍值 木36/火23/土23/金0/水18', async () => {
    const r = await paipan({
      year: 1975, month: 6, day: 14, hour: 0, minute: 30,
      gender: 'female', calendar: 'solar',
    });
    const s = r.wuxingScore;
    // V1.1 手算对拍（引擎实跑一致）：
    //   地支关系：年月卯午破、年时子卯刑、月日卯午破、月时子午冲、日时子卯刑（无合会局，系数连乘）
    //   盖头：壬午(水克火)/辛卯(金克木)/戊子(土克水) 各×0.8；乙卯一气不扣
    //   月令乘数：火旺×1.2 土相×1.1 木休×1.0 金死×0.5 水囚×0.7
    //   原始分：木18.982 火12.1296 土12.1572 金0 水9.1476（总52.4164）
    //   最大余数法归一：木36 火23 土23 金0 水18
    expect(s).toEqual({ mu: 36, huo: 23, tu: 23, jin: 0, shui: 18 });
    // 归一化后五项之和恰为 100（最大余数法）
    const sum = s.mu + s.huo + s.tu + s.jin + s.shui;
    expect(sum).toBe(100);
  });

  it('calcWuxingRaw 原始分对拍（未归一，含作用/盖头/月令全流程）', () => {
    const pillars = [
      { position: 'year' as const, gan: '乙', zhi: '卯', canggan: ['乙'] },
      { position: 'month' as const, gan: '壬', zhi: '午', canggan: ['丁', '己'] },
      { position: 'day' as const, gan: '辛', zhi: '卯', canggan: ['乙'] },
      { position: 'hour' as const, gan: '戊', zhi: '子', canggan: ['癸'] },
    ];
    const raw = calcWuxingRaw({ dayGan: '辛', pillars });
    expect(raw.mu).toBeCloseTo(18.982, 3);
    expect(raw.huo).toBeCloseTo(12.1296, 4);
    expect(raw.tu).toBeCloseTo(12.1572, 4);
    expect(raw.jin).toBe(0); // 全局无申酉戌丑巳等金藏干，日干辛又不计 → 金=0
    expect(raw.shui).toBeCloseTo(9.1476, 4);
    // 归一后与手算一致
    expect(normalizeToPercent(raw)).toEqual({ mu: 36, huo: 23, tu: 23, jin: 0, shui: 18 });
  });

  it('木最旺、金最弱（日干辛金不计分且全局无金根）', async () => {
    const r = await paipan({
      year: 1975, month: 6, day: 14, hour: 0, minute: 30,
      gender: 'female', calendar: 'solar',
    });
    const s = r.wuxingScore;
    expect(s.mu).toBeGreaterThan(s.huo);
    expect(s.mu).toBeGreaterThan(s.jin);
    expect(s.jin).toBeLessThan(s.shui);
    expect(s.jin).toBe(0);
  });
});

// ── 强弱 ───────────────────────────────────────────────

describe('wuxing: 强弱判定', () => {
  it('基准盘辛金身极弱（无金根、无比劫，印弱，bang/hao≈0.35）→ 极弱，对拍参考图"极弱型"', async () => {
    const r = await paipan({
      year: 1975, month: 6, day: 14, hour: 0, minute: 30,
      gender: 'female', calendar: 'solar',
    });
    expect(r.strength).toBe('极弱');
  });

  it('旺相休囚死：午月（火当令）→ 火旺/土相/木休/水囚/金死；日元辛金=死', async () => {
    const r = await paipan({
      year: 1975, month: 6, day: 14, hour: 0, minute: 30,
      gender: 'female', calendar: 'solar',
    });
    const map = Object.fromEntries(r.wangxiang.map(w => [w.wuxing, w.state]));
    expect(map).toEqual({ 火: '旺', 土: '相', 木: '休', 水: '囚', 金: '死' });
    // 日元辛金，午月火令，火克金 → 日元为死
    expect(map[r.dayGanWuxing]).toBe('死');
  });

  it('calcStrength 直接验证：帮身=金+土，耗身=木火水', () => {
    // 构造基准盘原始分
    const pillars = [
      { position: 'year' as const, gan: '乙', zhi: '卯', canggan: ['乙'] },
      { position: 'month' as const, gan: '壬', zhi: '午', canggan: ['丁', '己'] },
      { position: 'day' as const, gan: '辛', zhi: '卯', canggan: ['乙'] },
      { position: 'hour' as const, gan: '戊', zhi: '子', canggan: ['癸'] },
    ];
    const raw = calcWuxingRaw({ dayGan: '辛', pillars });
    expect(calcStrength('辛', raw)).toBe('极弱');
  });
});

// ── 喜用（扶抑）───────────────────────────────────────

describe('wuxing: 喜用（扶抑法）', () => {
  it('基准盘身弱 → 用神土（印）、喜神金（比劫）、忌木火水', async () => {
    const r = await paipan({
      year: 1975, month: 6, day: 14, hour: 0, minute: 30,
      gender: 'female', calendar: 'solar',
    });
    expect(r.xiYong.yong).toContain('土');   // 印
    expect(r.xiYong.xi).toContain('金');     // 比劫
    expect(r.xiYong.ji).toContain('木');
    expect(r.xiYong.ji).toContain('火');
    expect(r.xiYong.ji).toContain('水');
  });

  it('幸运色/方位/数字来自配置（土金）', async () => {
    const r = await paipan({
      year: 1975, month: 6, day: 14, hour: 0, minute: 30,
      gender: 'female', calendar: 'solar',
    });
    // 金：白金/西西北/4,9；土：黄棕/中.../5,0
    expect(r.xiYong.colors).toEqual(expect.arrayContaining(['白', '金', '黄', '棕']));
    expect(r.xiYong.directions).toEqual(expect.arrayContaining(['西', '西北']));
    expect(r.xiYong.numbers).toEqual(expect.arrayContaining([4, 9, 5, 0]));
  });

  it('身强 → 用官杀、忌食伤比劫印', () => {
    const xy = calcXiYong('辛', '偏强');
    expect(xy.yong).toContain('火'); // 克我者官杀=火
    expect(xy.ji).toContain('土');   // 印
    expect(xy.ji).toContain('金');   // 比劫
  });
});

// ── 调候（仅标注）──────────────────────────────────────

describe('wuxing: 调候用神（仅标注，出处穷通宝鉴）', () => {
  it('辛金午月 → 调候壬己，不参与喜用合成', async () => {
    const r = await paipan({
      year: 1975, month: 6, day: 14, hour: 0, minute: 30,
      gender: 'female', calendar: 'solar',
    });
    expect(r.tiaoHou.gods).toEqual(['壬', '己']);
    expect(r.tiaoHou.source).toBe('穷通宝鉴');
    // 调候壬水不在喜用 yong/xi 中（扶抑喜用土金）
    expect(r.xiYong.yong).not.toContain('水');
    expect(r.xiYong.xi).not.toContain('水');
  });

  it('calcTiaoHou 直接验证', () => {
    expect(calcTiaoHou('辛', '午').gods).toEqual(['壬', '己']);
    expect(calcTiaoHou('辛', '午').source).toBe('穷通宝鉴');
  });
});

// ── 格局 ───────────────────────────────────────────────

describe('pattern: 基准盘七杀格·杀印相生', () => {
  it('月支午本气丁火=七杀，时干戊正印透 → 七杀格·杀印相生', async () => {
    const r = await paipan({
      year: 1975, month: 6, day: 14, hour: 0, minute: 30,
      gender: 'female', calendar: 'solar',
    });
    expect(r.pattern).not.toBeNull();
    expect(r.pattern!.name).toBe('七杀格');
    expect(r.pattern!.sub).toBe('杀印相生');
    expect(r.pattern!.source).toBe('子平真诠');
  });

  it('detectPattern 直接验证基准盘', () => {
    const pillars = [
      { position: 'year' as const, gan: '乙', canggan: ['乙'] },
      { position: 'month' as const, gan: '壬', canggan: ['丁', '己'] },
      { position: 'day' as const, gan: '辛', canggan: ['乙'] },
      { position: 'hour' as const, gan: '戊', canggan: ['癸'] },
    ];
    const p = detectPattern('辛', pillars);
    expect(p).not.toBeNull();
    expect(p!.name).toBe('七杀格');
    expect(p!.sub).toBe('杀印相生');
    expect(p!.source).toBe('子平真诠');
  });
});

describe('pattern: 格局不输出场景（返回 null）', () => {
  it('月支本气为比肩（建禄）→ 不输出格局', () => {
    // 甲日寅月：寅本气甲=比肩 → 建禄格，不输出
    const pillars = [
      { position: 'year' as const, gan: '庚', canggan: ['戊', '丙', '庚'] },
      { position: 'month' as const, gan: '丙', canggan: ['甲', '丙', '戊'] },
      { position: 'day' as const, gan: '甲', canggan: ['甲', '丙', '戊'] },
      { position: 'hour' as const, gan: '丁', canggan: ['乙'] },
    ];
    expect(detectPattern('甲', pillars)).toBeNull();
  });

  it('月支本气为劫财（月刃）→ 不输出格局', () => {
    // 乙日寅月？寅本气甲对乙=劫财 → 月刃，不输出
    const pillars = [
      { position: 'year' as const, gan: '戊', canggan: ['乙'] },
      { position: 'month' as const, gan: '戊', canggan: ['甲', '丙', '戊'] },
      { position: 'day' as const, gan: '乙', canggan: ['乙'] },
      { position: 'hour' as const, gan: '丁', canggan: ['癸'] },
    ];
    expect(detectPattern('乙', pillars)).toBeNull();
  });
});

describe('pattern: 其他正格识别', () => {
  it('正官格：月支本气正官 + 透财 → 财官双美', () => {
    // 辛金：正官=丙。月支巳本气丙=正官；年干甲=正财透
    const pillars = [
      { position: 'year' as const, gan: '甲', canggan: ['乙'] },
      { position: 'month' as const, gan: '癸', canggan: ['丙', '戊', '庚'] },
      { position: 'day' as const, gan: '辛', canggan: ['戊', '乙', '癸'] },
      { position: 'hour' as const, gan: '己', canggan: ['癸'] },
    ];
    const p = detectPattern('辛', pillars);
    expect(p?.name).toBe('正官格');
    expect(p?.sub).toBe('财官双美');
  });

  it('食神格 + 透杀 → 食神制杀', () => {
    // 辛金：食神=癸。月支子本气癸=食神；年干丁=七杀透
    const pillars = [
      { position: 'year' as const, gan: '丁', canggan: ['丁', '己'] },
      { position: 'month' as const, gan: '戊', canggan: ['癸'] },
      { position: 'day' as const, gan: '辛', canggan: ['乙'] },
      { position: 'hour' as const, gan: '甲', canggan: ['癸'] },
    ];
    const p = detectPattern('辛', pillars);
    expect(p?.name).toBe('食神格');
    expect(p?.sub).toBe('食神制杀');
  });

  it('伤官格 + 透印 → 伤官佩印', () => {
    // 辛金：伤官=壬。月支亥本气壬=伤官；年干戊=正印透
    const pillars = [
      { position: 'year' as const, gan: '戊', canggan: ['戊', '乙', '癸'] },
      { position: 'month' as const, gan: '己', canggan: ['壬', '甲'] },
      { position: 'day' as const, gan: '辛', canggan: ['辛'] },
      { position: 'hour' as const, gan: '癸', canggan: ['乙'] },
    ];
    const p = detectPattern('辛', pillars);
    expect(p?.name).toBe('伤官格');
    expect(p?.sub).toBe('伤官佩印');
  });

  it('七杀格无印无食透 → 仅七杀格（无 sub）', () => {
    // 辛日午月，天干无印（戊己）无食神（癸）
    const pillars = [
      { position: 'year' as const, gan: '乙', canggan: ['乙'] },
      { position: 'month' as const, gan: '甲', canggan: ['丁', '己'] },
      { position: 'day' as const, gan: '辛', canggan: ['乙'] },
      { position: 'hour' as const, gan: '乙', canggan: ['乙'] },
    ];
    const p = detectPattern('辛', pillars);
    expect(p?.name).toBe('七杀格');
    expect(p?.sub).toBeUndefined();
  });
});
