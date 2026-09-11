/**
 * guaxiang 测试
 * 覆盖：基准盘（乙辛冲/子午冲/午卯破/子卯刑）、天干五合/冲/生/克、
 *       地支六合/三合/半合/拱合/三会/六冲/三刑/自刑/六破/六害/暗合
 */
import { describe, it, expect } from 'vitest';
import { paipan } from '@/lib/bazi/paipan';
import {
  analyzeTianganRelations,
  analyzeDizhiRelations,
  analyzeRelations,
} from '@/lib/shensha/guaxiang';
import type { LabeledChar } from '@/lib/shensha/guaxiang';

function chars(arr: [string, string][]): LabeledChar[] {
  return arr.map(([position, char]) => ({ position, char }));
}

// ── 天干关系 ────────────────────────────────────────────

describe('guaxiang 天干: 五合', () => {
  it('甲己合化土', () => {
    const r = analyzeTianganRelations(chars([['day', '甲'], ['hour', '己']]));
    const he = r.filter(x => x.type === '合');
    expect(he.length).toBe(1);
    expect(he[0].detail).toBe('天干五合');
    expect(he[0].hua).toBe('土');
  });

  it('乙庚合化金、丙辛合化水、丁壬合化木、戊癸合火 全覆盖', () => {
    const pairs: [string, string, string][] = [
      ['乙', '庚', '金'], ['丙', '辛', '水'], ['丁', '壬', '木'], ['戊', '癸', '火'],
    ];
    for (const [a, b, hua] of pairs) {
      const r = analyzeTianganRelations(chars([['day', a], ['hour', b]]));
      const he = r.filter(x => x.type === '合');
      expect(he.length).toBe(1);
      expect(he[0].hua).toBe(hua);
      // 合则不论克
      expect(r.filter(x => x.type === '克').length).toBe(0);
    }
  });
});

describe('guaxiang 天干: 相冲', () => {
  it('乙辛冲（基准盘年干 vs 日干）', () => {
    const r = analyzeTianganRelations(
      chars([['year', '乙'], ['month', '壬'], ['day', '辛'], ['hour', '戊']]),
    );
    const chong = r.filter(x => x.type === '冲');
    expect(chong.length).toBe(1);
    expect(chong[0].from).toBe('乙');
    expect(chong[0].to).toBe('辛');
    expect(chong[0].fromPosition).toBe('year');
    expect(chong[0].toPosition).toBe('day');
    // 冲不另输出克
    expect(r.filter(x => x.type === '克' &&
      ((x.from === '乙' && x.to === '辛') || (x.from === '辛' && x.to === '乙'))).length).toBe(0);
  });

  it('甲庚/丙壬/丁癸 冲', () => {
    for (const [a, b] of [['甲', '庚'], ['丙', '壬'], ['丁', '癸']]) {
      const r = analyzeTianganRelations(chars([['day', a], ['hour', b]]));
      expect(r.filter(x => x.type === '冲').length).toBe(1);
    }
  });

  it('戊己不参与天干冲', () => {
    const r = analyzeTianganRelations(chars([['day', '戊'], ['hour', '己']]));
    expect(r.filter(x => x.type === '冲').length).toBe(0);
  });
});

describe('guaxiang 天干: 生克有向', () => {
  it('戊生辛（土生金，时干生日干）', () => {
    const r = analyzeTianganRelations(
      chars([['year', '乙'], ['month', '壬'], ['day', '辛'], ['hour', '戊']]),
    );
    const sheng = r.filter(x => x.type === '生');
    // 戊→辛、辛→壬、壬→乙 共3条
    expect(sheng.length).toBe(3);
    const wuXin = sheng.find(x => x.from === '戊' && x.to === '辛');
    expect(wuXin).toBeDefined();
    expect(wuXin!.fromPosition).toBe('hour');
    expect(wuXin!.toPosition).toBe('day');
    expect(sheng.find(x => x.from === '辛' && x.to === '壬')).toBeDefined();
    expect(sheng.find(x => x.from === '壬' && x.to === '乙')).toBeDefined();
  });

  it('戊克壬（土克水）、乙克戊（木克土）', () => {
    const r = analyzeTianganRelations(
      chars([['year', '乙'], ['month', '壬'], ['day', '辛'], ['hour', '戊']]),
    );
    const ke = r.filter(x => x.type === '克');
    // 乙克戊、戊克壬 共2条（乙辛为冲不另克）
    expect(ke.length).toBe(2);
    expect(ke.find(x => x.from === '戊' && x.to === '壬')).toBeDefined();
    expect(ke.find(x => x.from === '乙' && x.to === '戊')).toBeDefined();
  });
});

// ── 地支关系 ────────────────────────────────────────────

describe('guaxiang 地支: 六冲', () => {
  it('子午相冲（基准盘月支 vs 时支）', () => {
    const r = analyzeDizhiRelations(
      chars([['year', '卯'], ['month', '午'], ['day', '卯'], ['hour', '子']]),
    );
    const chong = r.filter(x => x.type === '冲');
    expect(chong.length).toBe(1);
    expect(chong[0].from).toBe('午');
    expect(chong[0].to).toBe('子');
    expect(chong[0].fromPosition).toBe('month');
    expect(chong[0].toPosition).toBe('hour');
  });

  it('六冲全覆盖', () => {
    const pairs: [string, string][] = [
      ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
    ];
    for (const [a, b] of pairs) {
      const r = analyzeDizhiRelations(chars([['day', a], ['hour', b]]));
      expect(r.filter(x => x.type === '冲' && x.detail === '六冲').length).toBe(1);
    }
  });
});

describe('guaxiang 地支: 六破', () => {
  it('午卯相破（基准盘年月、月日各一）', () => {
    const r = analyzeDizhiRelations(
      chars([['year', '卯'], ['month', '午'], ['day', '卯'], ['hour', '子']]),
    );
    const po = r.filter(x => x.type === '破');
    expect(po.length).toBe(2);
    for (const p of po) {
      expect([p.from, p.to].sort()).toEqual(['午', '卯']);
    }
  });

  it('六破表：子酉/丑辰/寅亥/巳申/未戌', () => {
    const pairs: [string, string][] = [
      ['子', '酉'], ['丑', '辰'], ['寅', '亥'], ['巳', '申'], ['未', '戌'],
    ];
    for (const [a, b] of pairs) {
      const r = analyzeDizhiRelations(chars([['day', a], ['hour', b]]));
      expect(r.filter(x => x.type === '破').length).toBe(1);
    }
  });
});

describe('guaxiang 地支: 相刑', () => {
  it('子卯相刑（基准盘年时、日时各一）', () => {
    const r = analyzeDizhiRelations(
      chars([['year', '卯'], ['month', '午'], ['day', '卯'], ['hour', '子']]),
    );
    const xing = r.filter(x => x.type === '刑');
    expect(xing.length).toBe(2);
    for (const x of xing) {
      expect([x.from, x.to].sort()).toEqual(['卯', '子']);
    }
  });

  it('寅巳申三刑（三支全 → 3条三刑边）', () => {
    const r = analyzeDizhiRelations(
      chars([['year', '寅'], ['month', '巳'], ['day', '申'], ['hour', '子']]),
    );
    const sanxing = r.filter(x => x.detail === '三刑');
    expect(sanxing.length).toBe(3);
  });

  it('丑戌未三刑（三支全）', () => {
    const r = analyzeDizhiRelations(
      chars([['year', '丑'], ['month', '戌'], ['day', '未'], ['hour', '子']]),
    );
    expect(r.filter(x => x.detail === '三刑').length).toBe(3);
  });

  it('巳申两支 → 相刑（且与六合/相破多重并见）', () => {
    const r = analyzeDizhiRelations(chars([['day', '巳'], ['hour', '申']]));
    // 巳申：六合化水 + 相破 + 相刑
    expect(r.filter(x => x.detail === '六合').length).toBe(1);
    expect(r.filter(x => x.detail === '相破').length).toBe(1);
    expect(r.filter(x => x.detail === '相刑').length).toBe(1);
  });

  it('自刑：午午/辰辰/酉酉/亥亥', () => {
    for (const c of ['辰', '午', '酉', '亥']) {
      const r = analyzeDizhiRelations(chars([['year', c], ['hour', c]]));
      expect(r.filter(x => x.detail === '自刑').length).toBe(1);
    }
  });

  it('卯卯非自刑（基准盘年日两支卯无刑）', () => {
    const r = analyzeDizhiRelations(
      chars([['year', '卯'], ['day', '卯']]),
    );
    expect(r.filter(x => x.type === '刑').length).toBe(0);
  });
});

describe('guaxiang 地支: 六合', () => {
  it('子丑合化土', () => {
    const r = analyzeDizhiRelations(chars([['day', '子'], ['hour', '丑']]));
    const he = r.filter(x => x.detail === '六合');
    expect(he.length).toBe(1);
    expect(he[0].hua).toBe('土');
  });

  it('六合全覆盖', () => {
    const pairs: [string, string, string][] = [
      ['寅', '亥', '木'], ['卯', '戌', '火'], ['辰', '酉', '金'],
      ['巳', '申', '水'], ['午', '未', '土'],
    ];
    for (const [a, b, hua] of pairs) {
      const r = analyzeDizhiRelations(chars([['day', a], ['hour', b]]));
      const he = r.filter(x => x.detail === '六合');
      expect(he.length).toBe(1);
      expect(he[0].hua).toBe(hua);
    }
  });
});

describe('guaxiang 地支: 三合/半合/拱合', () => {
  it('申子辰三支全 → 三合水局（3条边）', () => {
    const r = analyzeDizhiRelations(
      chars([['year', '申'], ['month', '子'], ['hour', '辰']]),
    );
    const sanhe = r.filter(x => x.detail === '三合');
    expect(sanhe.length).toBe(3);
    for (const s of sanhe) expect(s.hua).toBe('水');
    // 三支全时不重复输出半合
    expect(r.filter(x => x.detail === '半合').length).toBe(0);
  });

  it('亥卯未三支全 → 三合木局', () => {
    const r = analyzeDizhiRelations(
      chars([['year', '亥'], ['day', '卯'], ['hour', '未']]),
    );
    const sanhe = r.filter(x => x.detail === '三合');
    expect(sanhe.length).toBe(3);
    for (const s of sanhe) expect(s.hua).toBe('木');
  });

  it('申子两支 → 半合水局', () => {
    const r = analyzeDizhiRelations(chars([['year', '申'], ['hour', '子']]));
    const banhe = r.filter(x => x.detail === '半合');
    expect(banhe.length).toBe(1);
    expect(banhe[0].hua).toBe('水');
  });

  it('卯未两支 → 半合木局', () => {
    const r = analyzeDizhiRelations(chars([['day', '卯'], ['hour', '未']]));
    const banhe = r.filter(x => x.detail === '半合');
    expect(banhe.length).toBe(1);
    expect(banhe[0].hua).toBe('木');
  });

  it('申辰两支 → 拱合水局（缺帝旺子）', () => {
    const r = analyzeDizhiRelations(chars([['year', '申'], ['hour', '辰']]));
    expect(r.filter(x => x.detail === '拱合').length).toBe(1);
    expect(r.filter(x => x.detail === '半合').length).toBe(0);
  });

  it('基准盘卯子两支不成合（无亥未/无申辰）', () => {
    const r = analyzeDizhiRelations(
      chars([['year', '卯'], ['month', '午'], ['day', '卯'], ['hour', '子']]),
    );
    expect(r.filter(x => x.type === '合').length).toBe(0);
  });
});

describe('guaxiang 地支: 三会', () => {
  it('寅卯辰三支 → 会木方', () => {
    const r = analyzeDizhiRelations(
      chars([['year', '寅'], ['month', '卯'], ['day', '辰']]),
    );
    const sanhui = r.filter(x => x.detail === '三会');
    expect(sanhui.length).toBe(3);
    for (const s of sanhui) expect(s.hua).toBe('木');
  });

  it('巳午未三支 → 会火方', () => {
    const r = analyzeDizhiRelations(
      chars([['year', '巳'], ['month', '午'], ['day', '未']]),
    );
    expect(r.filter(x => x.detail === '三会' && x.hua === '火').length).toBe(3);
  });
});

describe('guaxiang 地支: 六害', () => {
  it('子未相害', () => {
    const r = analyzeDizhiRelations(chars([['day', '子'], ['hour', '未']]));
    expect(r.filter(x => x.type === '害' && x.detail === '相害').length).toBe(1);
  });

  it('六害全覆盖', () => {
    const pairs: [string, string][] = [
      ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
    ];
    for (const [a, b] of pairs) {
      const r = analyzeDizhiRelations(chars([['day', a], ['hour', b]]));
      expect(r.filter(x => x.type === '害').length).toBe(1);
    }
  });
});

describe('guaxiang 地支: 暗合（藏干五合动态推导）', () => {
  it('卯申暗合（卯藏乙，申藏庚 → 乙庚合金）', () => {
    const r = analyzeDizhiRelations(chars([['day', '卯'], ['hour', '申']]));
    const anhe = r.filter(x => x.detail === '暗合');
    expect(anhe.length).toBe(1);
    expect(anhe[0].hua).toBe('金');
  });

  it('午亥暗合（午藏丁己，亥藏壬甲 → 丁壬合木/甲己合土）', () => {
    const r = analyzeDizhiRelations(chars([['day', '午'], ['hour', '亥']]));
    expect(r.filter(x => x.detail === '暗合').length).toBe(1);
  });

  it('寅丑暗合（甲己/丙辛/戊癸 三对藏干合）', () => {
    const r = analyzeDizhiRelations(chars([['day', '寅'], ['hour', '丑']]));
    expect(r.filter(x => x.detail === '暗合').length).toBe(1);
  });

  it('基准盘无暗合', () => {
    const r = analyzeDizhiRelations(
      chars([['year', '卯'], ['month', '午'], ['day', '卯'], ['hour', '子']]),
    );
    expect(r.filter(x => x.detail === '暗合').length).toBe(0);
  });
});

// ── 组合入口 + 基准盘集成 ───────────────────────────────

describe('guaxiang: analyzeRelations 组合入口', () => {
  it('同时返回天干与地支关系', () => {
    const r = analyzeRelations([
      { position: 'year', gan: '乙', zhi: '卯' },
      { position: 'month', gan: '壬', zhi: '午' },
      { position: 'day', gan: '辛', zhi: '卯' },
      { position: 'hour', gan: '戊', zhi: '子' },
    ]);
    expect(r.some(x => x.kind === '天干')).toBe(true);
    expect(r.some(x => x.kind === '地支')).toBe(true);
  });
});

describe('guaxiang: 基准盘 paipan 集成', () => {
  it('1975-6-14 → 乙辛冲/子午冲/午卯破×2/子卯刑×2', async () => {
    const r = await paipan({
      year: 1975, month: 6, day: 14, hour: 0, minute: 30,
      gender: 'female', calendar: 'solar',
    });
    const rels = r.relations;

    // 天干：乙辛冲
    const yiXin = rels.filter(x => x.kind === '天干' && x.type === '冲');
    expect(yiXin.length).toBe(1);
    expect([yiXin[0].from, yiXin[0].to].sort()).toEqual(['乙', '辛']);

    // 地支：子午冲
    const ziWu = rels.filter(x => x.kind === '地支' && x.type === '冲');
    expect(ziWu.length).toBe(1);
    expect([ziWu[0].from, ziWu[0].to].sort()).toEqual(['午', '子']);

    // 地支：午卯破 ×2
    const po = rels.filter(x => x.kind === '地支' && x.type === '破');
    expect(po.length).toBe(2);

    // 地支：子卯刑 ×2
    const xing = rels.filter(x => x.kind === '地支' && x.type === '刑');
    expect(xing.length).toBe(2);

    // 天干生克：戊生辛、戊克壬
    expect(rels.some(x => x.kind === '天干' && x.type === '生' &&
      x.from === '戊' && x.to === '辛')).toBe(true);
    expect(rels.some(x => x.kind === '天干' && x.type === '克' &&
      x.from === '戊' && x.to === '壬')).toBe(true);
  });

  it('关系结构含 kind/type/detail/from/to/位置', async () => {
    const r = await paipan({
      year: 1975, month: 6, day: 14, hour: 0, minute: 30,
      gender: 'female', calendar: 'solar',
    });
    for (const rel of r.relations) {
      expect(rel).toHaveProperty('kind');
      expect(rel).toHaveProperty('type');
      expect(rel).toHaveProperty('detail');
      expect(rel).toHaveProperty('from');
      expect(rel).toHaveProperty('to');
      expect(rel).toHaveProperty('fromPosition');
      expect(rel).toHaveProperty('toPosition');
      expect(['year', 'month', 'day', 'hour']).toContain(rel.fromPosition);
      expect(['year', 'month', 'day', 'hour']).toContain(rel.toPosition);
    }
  });
});
