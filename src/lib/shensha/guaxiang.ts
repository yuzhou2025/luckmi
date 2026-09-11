/**
 * src/lib/shensha/guaxiang.ts
 * 干支关系引擎 —— 天干五合/冲/克/生；地支六合/三合/半合/拱合/三会/
 * 六冲/三刑/自刑/六破/六害/暗合。
 *
 * 输出用于图1底部作用线与流年/流月作用线。
 * 引擎只列出事实关系（可多重并见，如巳申合+破+刑），优先级解读由上层处理。
 * 暗合由藏干五合动态推导（规则驱动，不硬编码）。
 */

import type { GanZhiRelation } from '@/lib/bazi/paipan';
import { CANGGAN } from '@/lib/bazi/constants';

// ── 输入类型 ────────────────────────────────────────────

export interface LabeledChar {
  position: string;  // year/month/day/hour/dayun/liunian/liuyue/liuri
  char: string;      // 天干或地支字
}

// ── 天干表 ──────────────────────────────────────────────

/** 天干五合（化气） */
const TIANGAN_WUHE: Record<string, { with: string; hua: string }> = {
  甲: { with: '己', hua: '土' }, 己: { with: '甲', hua: '土' },
  乙: { with: '庚', hua: '金' }, 庚: { with: '乙', hua: '金' },
  丙: { with: '辛', hua: '水' }, 辛: { with: '丙', hua: '水' },
  丁: { with: '壬', hua: '木' }, 壬: { with: '丁', hua: '木' },
  戊: { with: '癸', hua: '火' }, 癸: { with: '戊', hua: '火' },
};

/** 天干相冲（方位对冲：甲庚/乙辛/丙壬/丁癸；戊己居中不冲） */
const TIANGAN_CHONG: Record<string, string> = {
  甲: '庚', 庚: '甲',
  乙: '辛', 辛: '乙',
  丙: '壬', 壬: '丙',
  丁: '癸', 癸: '丁',
};

const GAN_WUXING: Record<string, string> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
  己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
};

/** 五行相生：木→火→土→金→水→木 */
const WUXING_SHENG: Record<string, string> = {
  木: '火', 火: '土', 土: '金', 金: '水', 水: '木',
};
/** 五行相克：木→土→水→火→金→木 */
const WUXING_KE: Record<string, string> = {
  木: '土', 土: '水', 水: '火', 火: '金', 金: '木',
};

// ── 地支表 ──────────────────────────────────────────────

/** 六合（化气） */
const LIUHE: Record<string, { with: string; hua: string }> = {
  子: { with: '丑', hua: '土' }, 丑: { with: '子', hua: '土' },
  寅: { with: '亥', hua: '木' }, 亥: { with: '寅', hua: '木' },
  卯: { with: '戌', hua: '火' }, 戌: { with: '卯', hua: '火' },
  辰: { with: '酉', hua: '金' }, 酉: { with: '辰', hua: '金' },
  巳: { with: '申', hua: '水' }, 申: { with: '巳', hua: '水' },
  午: { with: '未', hua: '土' }, 未: { with: '午', hua: '土' },
};

/** 六冲 */
const LIUCHONG: Record<string, string> = {
  子: '午', 午: '子',
  丑: '未', 未: '丑',
  寅: '申', 申: '寅',
  卯: '酉', 酉: '卯',
  辰: '戌', 戌: '辰',
  巳: '亥', 亥: '巳',
};

/** 三合局（三支全） */
const SANHE_JU: { chars: string[]; hua: string }[] = [
  { chars: ['申', '子', '辰'], hua: '水' },
  { chars: ['寅', '午', '戌'], hua: '火' },
  { chars: ['巳', '酉', '丑'], hua: '金' },
  { chars: ['亥', '卯', '未'], hua: '木' },
];

/** 半合（长生-帝旺 / 帝旺-墓库 两支） */
const BANHE_PAIRS: [string, string][] = [
  ['申', '子'], ['子', '辰'],
  ['寅', '午'], ['午', '戌'],
  ['巳', '酉'], ['酉', '丑'],
  ['亥', '卯'], ['卯', '未'],
];

/** 拱合（长生-墓库两支，缺帝旺，力弱） */
const GONGHE_PAIRS: [string, string][] = [
  ['申', '辰'], ['寅', '戌'], ['巳', '丑'], ['亥', '未'],
];

/** 三会方（三支全） */
const SANHUI_FANG: { chars: string[]; hua: string }[] = [
  { chars: ['寅', '卯', '辰'], hua: '木' },
  { chars: ['巳', '午', '未'], hua: '火' },
  { chars: ['申', '酉', '戌'], hua: '金' },
  { chars: ['亥', '子', '丑'], hua: '水' },
];

/** 三刑组（三支全为三刑，两支为相刑） */
const XING_GROUPS: string[][] = [
  ['寅', '巳', '申'],  // 无恩之刑
  ['丑', '戌', '未'],  // 恃势之刑
];

/** 无礼之刑（子卯互刑） */
const ZIMAO_XING: Record<string, string> = { 子: '卯', 卯: '子' };

/** 自刑（同字相见） */
const ZI_XING = new Set(['辰', '午', '酉', '亥']);

/** 六破 */
const LIU_PO: Record<string, string> = {
  子: '酉', 酉: '子',
  丑: '辰', 辰: '丑',
  寅: '亥', 亥: '寅',
  卯: '午', 午: '卯',
  巳: '申', 申: '巳',
  未: '戌', 戌: '未',
};

/** 六害 */
const LIU_HAI: Record<string, string> = {
  子: '未', 未: '子',
  丑: '午', 午: '丑',
  寅: '巳', 巳: '寅',
  卯: '辰', 辰: '卯',
  申: '亥', 亥: '申',
  酉: '戌', 戌: '酉',
};

/** 地支藏干统一引自 constants.ts（暗合动态推导用） */

// ── 工具 ────────────────────────────────────────────────

function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|');
}

function makeRelation(
  kind: '天干' | '地支',
  type: GanZhiRelation['type'],
  detail: string,
  from: LabeledChar,
  to: LabeledChar,
  hua?: string,
): GanZhiRelation {
  return {
    kind, type, detail,
    from: from.char, to: to.char,
    fromPosition: from.position, toPosition: to.position,
    ...(hua ? { hua } : {}),
  };
}

// ── 天干关系 ────────────────────────────────────────────

/**
 * 天干两两关系：五合（合则不克）、相冲、相生（有向）、相克（有向）。
 * 泄/耗为生克反向，不重复输出。
 */
export function analyzeTianganRelations(gans: LabeledChar[]): GanZhiRelation[] {
  const out: GanZhiRelation[] = [];

  for (let i = 0; i < gans.length; i++) {
    for (let j = i + 1; j < gans.length; j++) {
      const a = gans[i];
      const b = gans[j];

      // 1. 天干五合（合则不论克）
      const he = TIANGAN_WUHE[a.char];
      if (he && he.with === b.char) {
        out.push(makeRelation('天干', '合', '天干五合', a, b, he.hua));
        continue;
      }

      // 2. 天干相冲
      if (TIANGAN_CHONG[a.char] === b.char) {
        out.push(makeRelation('天干', '冲', '天干相冲', a, b));
        continue; // 冲含克意，不另输出克
      }

      // 3. 相生（有向）
      const wa = GAN_WUXING[a.char];
      const wb = GAN_WUXING[b.char];
      if (WUXING_SHENG[wa] === wb) {
        out.push(makeRelation('天干', '生', '天干相生', a, b));
      } else if (WUXING_SHENG[wb] === wa) {
        out.push(makeRelation('天干', '生', '天干相生', b, a));
      }

      // 4. 相克（有向）
      if (WUXING_KE[wa] === wb) {
        out.push(makeRelation('天干', '克', '天干相克', a, b));
      } else if (WUXING_KE[wb] === wa) {
        out.push(makeRelation('天干', '克', '天干相克', b, a));
      }
    }
  }

  return out;
}

// ── 地支关系 ────────────────────────────────────────────

/** 判断两支藏干间是否存在天干五合（暗合） */
function findAnheGanPair(zhiA: string, zhiB: string): { gan: string; hua: string } | null {
  const cangA = CANGGAN[zhiA] ?? [];
  const cangB = CANGGAN[zhiB] ?? [];
  for (const ga of cangA) {
    const he = TIANGAN_WUHE[ga];
    if (he && cangB.includes(he.with)) {
      return { gan: `${ga}${he.with}`, hua: he.hua };
    }
  }
  return null;
}

/**
 * 地支两两 + 全局组合关系：
 * 六合/六冲/六破/六害/相刑/自刑/暗合（两两）；
 * 三合/半合/拱合/三会/三刑（全局组合）。
 */
export function analyzeDizhiRelations(zhis: LabeledChar[]): GanZhiRelation[] {
  const out: GanZhiRelation[] = [];
  const charSet = new Set(zhis.map(z => z.char));

  // ── 全局组合：三合局 ──
  const sanheFullPairs = new Set<string>();
  for (const ju of SANHE_JU) {
    const present = ju.chars
      .map(c => zhis.filter(z => z.char === c))
      .filter(list => list.length > 0);
    const allPresent = ju.chars.every(c => charSet.has(c));
    if (allPresent) {
      // 三支全：三合局，输出两两三条边
      for (let i = 0; i < ju.chars.length; i++) {
        for (let j = i + 1; j < ju.chars.length; j++) {
          sanheFullPairs.add(pairKey(ju.chars[i], ju.chars[j]));
        }
      }
      const members = zhis.filter(z => ju.chars.includes(z.char));
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          out.push(makeRelation('地支', '合', '三合', members[i], members[j], ju.hua));
        }
      }
    }
  }

  // ── 全局组合：三会方 ──
  for (const fang of SANHUI_FANG) {
    const allPresent = fang.chars.every(c => charSet.has(c));
    if (allPresent) {
      const members = zhis.filter(z => fang.chars.includes(z.char));
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          out.push(makeRelation('地支', '合', '三会', members[i], members[j], fang.hua));
        }
      }
    }
  }

  // ── 全局组合：三刑（三支全）──
  const sanxingFullPairs = new Set<string>();
  for (const group of XING_GROUPS) {
    const allPresent = group.every(c => charSet.has(c));
    if (allPresent) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          sanxingFullPairs.add(pairKey(group[i], group[j]));
        }
      }
      const members = zhis.filter(z => group.includes(z.char));
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          out.push(makeRelation('地支', '刑', '三刑', members[i], members[j]));
        }
      }
    }
  }

  // ── 两两关系 ──
  for (let i = 0; i < zhis.length; i++) {
    for (let j = i + 1; j < zhis.length; j++) {
      const a = zhis[i];
      const b = zhis[j];
      const key = pairKey(a.char, b.char);

      // 1. 六合
      const he = LIUHE[a.char];
      if (he && he.with === b.char) {
        out.push(makeRelation('地支', '合', '六合', a, b, he.hua));
      }

      // 2. 六冲
      if (LIUCHONG[a.char] === b.char) {
        out.push(makeRelation('地支', '冲', '六冲', a, b));
      }

      // 3. 刑（三刑两支且非三支全 / 子卯刑 / 自刑）
      if (!sanxingFullPairs.has(key)) {
        let inXingGroup = false;
        for (const group of XING_GROUPS) {
          if (group.includes(a.char) && group.includes(b.char)) {
            inXingGroup = true;
            break;
          }
        }
        if (inXingGroup) {
          out.push(makeRelation('地支', '刑', '相刑', a, b));
        }
      }
      if (ZIMAO_XING[a.char] === b.char) {
        out.push(makeRelation('地支', '刑', '相刑', a, b));
      }
      if (a.char === b.char && ZI_XING.has(a.char)) {
        out.push(makeRelation('地支', '刑', '自刑', a, b));
      }

      // 4. 六破
      if (LIU_PO[a.char] === b.char) {
        out.push(makeRelation('地支', '破', '相破', a, b));
      }

      // 5. 六害
      if (LIU_HAI[a.char] === b.char) {
        out.push(makeRelation('地支', '害', '相害', a, b));
      }

      // 6. 暗合（藏干五合动态推导）
      const anhe = findAnheGanPair(a.char, b.char);
      if (anhe) {
        out.push(makeRelation('地支', '合', '暗合', a, b, anhe.hua));
      }

      // 7. 半合 / 拱合（三支不全时）
      if (!sanheFullPairs.has(key) && a.char !== b.char) {
        const isBanhe = BANHE_PAIRS.some(
          ([x, y]) => (x === a.char && y === b.char) || (x === b.char && y === a.char),
        );
        const isGonghe = GONGHE_PAIRS.some(
          ([x, y]) => (x === a.char && y === b.char) || (x === b.char && y === a.char),
        );
        if (isBanhe) {
          const ju = SANHE_JU.find(j => j.chars.includes(a.char) && j.chars.includes(b.char));
          out.push(makeRelation('地支', '合', '半合', a, b, ju?.hua));
        } else if (isGonghe) {
          const ju = SANHE_JU.find(j => j.chars.includes(a.char) && j.chars.includes(b.char));
          out.push(makeRelation('地支', '合', '拱合', a, b, ju?.hua));
        }
      }
    }
  }

  return out;
}

// ── 组合入口 ────────────────────────────────────────────

/**
 * 分析四柱（或含大运/流年/流月/流日）的全部干支关系。
 * @param pillars 四柱干支：[{position, gan, zhi}, ...]
 */
export function analyzeRelations(
  pillars: { position: string; gan: string; zhi: string }[],
): GanZhiRelation[] {
  const gans: LabeledChar[] = pillars.map(p => ({ position: p.position, char: p.gan }));
  const zhis: LabeledChar[] = pillars.map(p => ({ position: p.position, char: p.zhi }));
  return [
    ...analyzeTianganRelations(gans),
    ...analyzeDizhiRelations(zhis),
  ];
}
