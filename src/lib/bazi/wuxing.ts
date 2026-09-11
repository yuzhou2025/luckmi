/**
 * src/lib/bazi/wuxing.ts
 * 五行量化计分 —— V1.1 现代量化模拟模型（曲炜版本二位置权重）。
 *
 * 【模型约束】
 * 1. 本模型为现代量化模拟，古代命理无此数字体系；仅用于程序演算，不替代传统子平论命。
 * 2. 作用优先级：合 > 冲 > 刑 > 害 > 破；
 *    - 有会/合局时，不计冲刑害破的力量；
 *    - 无会合局时，多重关系系数连续相乘（不是相加）。
 * 3. 静态权重无法完全模拟"气势"，结果仅作演算参考。
 * 4. 日干（日主）不参与五行力量累加，只作为参照对象。
 * 5. 十神没有独立分数，十神力量 = 对应五行的最终得分（正/偏只区分阴阳，不改变分值）。
 *
 * 执行流程（与 V1.1 文档 §7 严格一致）：
 *   1. 四柱位置权重（日干不计）；
 *   2. 地支藏干：地支权重 × 藏干比例（60-30-10 / 纯气100 / 午70-30）；
 *   3. 地支作用：合会 → 冲 → 刑 → 害 → 破（系数相乘；有合会则其余不计）；
 *   4. 天干：位置权重 × 通根折扣（本气1.0/中气0.7/余气0.4/虚浮0.3，取最高根）；
 *   5. 同柱盖头（干克支）/ 截脚（支克干）：干支双方 ×0.8；一气/相生不扣；
 *   6. 合并五行 → 月令旺相休囚死乘数（旺1.2/相1.1/休1.0/囚0.7/死0.5）；
 *   7. 归一为百分（最大余数法，合计恰为 100）。
 *
 * 强弱：以日干为轴，生扶（印+比劫）vs 克泄耗（官杀+财+食伤），用最终得分比较。
 * 喜用：扶抑法（config.XIYONG.method='fuyi'），调候仅标注不参与合成。
 */

import { WUXING_SCORE, CANGGAN_RATIO, XIYONG, LUCK_MAP } from './config';
import { GAN_WUXING } from './shishen';
import { analyzeDizhiRelations } from '@/lib/shensha/guaxiang';
import type { Pillar } from './paipan';

export type WuxingKey = 'mu' | 'huo' | 'tu' | 'jin' | 'shui';

export interface WuxingScore {
  mu: number; huo: number; tu: number; jin: number; shui: number;
}

/** 五行名 → 分数 key */
const WUXING_TO_KEY: Record<string, WuxingKey> = {
  木: 'mu', 火: 'huo', 土: 'tu', 金: 'jin', 水: 'shui',
};

/** 五行相生：木→火→土→金→水→木 */
const SHENG: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
/** 五行相克：木→土→水→火→金→木 */
const KE: Record<string, string> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

type PillarPos = 'year' | 'month' | 'day' | 'hour';

/** 地支位置权重（日干不计；月支40最高） */
const POS_ZHI_W: Record<PillarPos, number> = {
  year: WUXING_SCORE.position.yearZhi,
  month: WUXING_SCORE.position.monthZhi,
  day: WUXING_SCORE.position.dayZhi,
  hour: WUXING_SCORE.position.hourZhi,
};
/** 天干位置权重（日柱无：日干不参与计分） */
const POS_GAN_W: Partial<Record<PillarPos, number>> = {
  year: WUXING_SCORE.position.yearGan,
  month: WUXING_SCORE.position.monthGan,
  hour: WUXING_SCORE.position.hourGan,
};

export interface StrengthInput {
  dayGan: string;
  pillars: Pick<Pillar, 'gan' | 'zhi' | 'canggan' | 'position'>[];
}

/** 计入合会局的关系明细（暗合不在 V1.1 §4-1 范围内，不计） */
const HE_DETAILS = new Set(['六合', '三合', '三会', '半合', '拱合']);

/**
 * 同柱盖头/截脚判定：
 * - 干克支 = 盖头、支克干 = 截脚 → 干支双方 ×0.8；
 * - 干支一气（同五行）或相生（天地相合）→ 不扣，返回 1。
 */
function gaitouFactor(gan: string, zhi: string): number {
  const ganWx = GAN_WUXING[gan];
  const benqiGan = CANGGAN_RATIO[zhi]?.[0]?.gan;
  if (!ganWx || !benqiGan) return 1;
  const zhiWx = GAN_WUXING[benqiGan];
  if (ganWx === zhiWx) return 1; // 干支一气
  if (KE[ganWx] === zhiWx || KE[zhiWx] === ganWx) {
    return WUXING_SCORE.gaitouJiejiao; // 盖头 / 截脚
  }
  return 1; // 相生或无涉
}

/**
 * 计算五行最终得分（V1.1 全流程，未归一）。
 */
export function calcWuxingRaw(input: StrengthInput): WuxingScore {
  const { pillars } = input;
  const score: WuxingScore = { mu: 0, huo: 0, tu: 0, jin: 0, shui: 0 };
  const add = (wx: string, v: number) => { score[WUXING_TO_KEY[wx]] += v; };

  // ── 步骤 4（先算关系，供藏干分使用）：地支作用，严格按优先级 ──
  const rels = analyzeDizhiRelations(
    pillars.map(p => ({ position: p.position, char: p.zhi })),
  );

  // 4-1 合会局：参与地支 → 成局五行集合（有合会则冲刑害破全部不计）
  const bureau = new Map<PillarPos, Set<string>>();
  for (const r of rels) {
    if (r.kind === '地支' && r.type === '合' && r.hua && HE_DETAILS.has(r.detail)) {
      for (const pos of [r.fromPosition, r.toPosition] as PillarPos[]) {
        if (!bureau.has(pos)) bureau.set(pos, new Set());
        bureau.get(pos)!.add(r.hua);
      }
    }
  }

  // 4-2~4-5 无合会局时：冲/刑/害/破 系数按关系两两连续相乘
  const relFactor: Record<PillarPos, number> = { year: 1, month: 1, day: 1, hour: 1 };
  if (bureau.size === 0) {
    for (const r of rels) {
      if (r.kind !== '地支') continue;
      let f = 0;
      if (r.type === '冲') f = WUXING_SCORE.interaction.chong;
      else if (r.type === '刑') {
        f = r.detail === '三刑' ? WUXING_SCORE.interaction.xingFull : WUXING_SCORE.interaction.xingPair;
      }
      else if (r.type === '害') f = WUXING_SCORE.interaction.hai;
      else if (r.type === '破') f = WUXING_SCORE.interaction.po;
      if (f) {
        relFactor[r.fromPosition as PillarPos] *= f;
        relFactor[r.toPosition as PillarPos] *= f;
      }
    }
  }

  // ── 步骤 3：地支藏干原始分（位置权重 × 藏干比例 × 作用系数 × 盖头截脚）──
  for (const p of pillars) {
    const pos = p.position as PillarPos;
    const zhiWeight = POS_ZHI_W[pos];
    const huaSet = bureau.get(pos);
    const gFactor = gaitouFactor(p.gan, p.zhi);
    for (const part of CANGGAN_RATIO[p.zhi] ?? []) {
      const wx = GAN_WUXING[part.gan];
      let s = zhiWeight * part.ratio;
      if (huaSet) {
        // 合会局：成局五行 ×1.5，该局内其余藏干 ×0.3
        s *= huaSet.has(wx) ? WUXING_SCORE.interaction.bureau : WUXING_SCORE.interaction.bureauOther;
      } else {
        s *= relFactor[pos];
      }
      s *= gFactor;
      add(wx, s);
    }
  }

  // ── 步骤 5：天干原始分（位置权重 × 通根折扣；日干不计）──
  for (const p of pillars) {
    const pos = p.position as PillarPos;
    const ganWeight = POS_GAN_W[pos];
    if (!ganWeight) continue; // 日干（日主）不参与计分
    const ganWx = GAN_WUXING[p.gan];

    // 通根：扫描全局地支藏干（本/中/余气），取最高根系数，不叠加
    let coef: number = WUXING_SCORE.root.float;
    for (const q of pillars) {
      (CANGGAN_RATIO[q.zhi] ?? []).forEach((part, idx) => {
        if (GAN_WUXING[part.gan] !== ganWx) return;
        const c = idx === 0 ? WUXING_SCORE.root.benqi
          : idx === 1 ? WUXING_SCORE.root.zhongqi
            : WUXING_SCORE.root.yuqi;
        if (c > coef) coef = c;
      });
    }

    let s = ganWeight * coef;
    s *= gaitouFactor(p.gan, p.zhi); // 步骤 6：盖头/截脚扣天干
    add(ganWx, s);
  }

  // ── 步骤 8：月令旺相休囚死乘数（合并后统一乘）──
  const monthZhi = pillars.find(p => p.position === 'month')?.zhi;
  const monthBenqi = monthZhi ? CANGGAN_RATIO[monthZhi]?.[0]?.gan : undefined;
  const monthWx = monthBenqi ? GAN_WUXING[monthBenqi] : undefined;
  if (monthWx) {
    for (const wx of ['木', '火', '土', '金', '水']) {
      let f: number;
      if (wx === monthWx) f = WUXING_SCORE.wangxiang.wang;       // 同月令：旺
      else if (SHENG[monthWx] === wx) f = WUXING_SCORE.wangxiang.xiang; // 令所生：相
      else if (SHENG[wx] === monthWx) f = WUXING_SCORE.wangxiang.xiu;   // 生令：休
      else if (KE[wx] === monthWx) f = WUXING_SCORE.wangxiang.qiu;     // 克令：囚
      else f = WUXING_SCORE.wangxiang.si;                              // 令所克：死
      add(wx, score[WUXING_TO_KEY[wx]] * (f - 1)); // 等价于 ×f（原值 + 增量）
    }
  }

  return score;
}

/** 归一为百分（最大余数法，保证五项之和恰为 100） */
export function normalizeToPercent(raw: WuxingScore): WuxingScore {
  const keys: WuxingKey[] = ['mu', 'huo', 'tu', 'jin', 'shui'];
  const total = keys.reduce((s, k) => s + raw[k], 0);
  if (total === 0) return { mu: 0, huo: 0, tu: 0, jin: 0, shui: 0 };

  // 精确百分比 + 向下取整
  const exact = new Map<WuxingKey, number>();
  const floor = new Map<WuxingKey, number>();
  for (const k of keys) {
    const pct = (raw[k] / total) * 100;
    exact.set(k, pct);
    floor.set(k, Math.floor(pct));
  }

  // 已分配点数与余数
  let assigned = keys.reduce((s, k) => s + (floor.get(k) ?? 0), 0);
  const remainder = 100 - assigned;

  // 按小数部分从大到小，把剩余点数逐个 +1
  const byFraction = [...keys].sort(
    (a, b) => (exact.get(b)! - Math.floor(exact.get(b)!)) - (exact.get(a)! - Math.floor(exact.get(a)!)),
  );
  for (let i = 0; i < remainder; i++) {
    const k = byFraction[i % byFraction.length];
    floor.set(k, (floor.get(k) ?? 0) + 1);
  }

  return {
    mu: floor.get('mu')!,
    huo: floor.get('huo')!,
    tu: floor.get('tu')!,
    jin: floor.get('jin')!,
    shui: floor.get('shui')!,
  };
}

export type Strength = '极强' | '偏强' | '均衡' | '偏弱' | '极弱';

/**
 * 强弱五档判定（V1.1 §9）：生扶（印星+比劫）vs 克泄耗（官杀+财星+食伤）。
 * 用月令乘数后的最终得分比较。
 */
export function calcStrength(dayGan: string, raw: WuxingScore): Strength {
  const dayWuxing = GAN_WUXING[dayGan]; // 日干五行（比劫）
  // 生我者（印）
  const shengWo = Object.entries(SHENG)
    .find(([, sheng]) => sheng === dayWuxing)?.[0] ?? '';

  const key = (wx: string) => WUXING_TO_KEY[wx];
  const bang = raw[key(dayWuxing)] + raw[key(shengWo)];          // 比劫 + 印
  const hao =
    raw.mu + raw.huo + raw.tu + raw.jin + raw.shui - bang;        // 其余 = 财官食

  const ratio = bang / hao; // <1 身弱，>1 身强
  if (ratio < 0.55) return '极弱';
  if (ratio < WUXING_SCORE.strengthThreshold - 0.2) return '偏弱'; // <0.9
  if (ratio <= WUXING_SCORE.strengthThreshold) return '均衡';      // 0.9~1.1
  if (ratio <= 1.8) return '偏强';
  return '极强';
}

export interface XiYongResult {
  yong: string[];   // 用神五行
  xi: string[];     // 喜神五行
  ji: string[];     // 忌神五行
  colors: string[];
  directions: string[];
  numbers: number[];
}

/**
 * 扶抑法喜用（规则：扶抑为主，调候仅标注）。
 * 偏弱：用印（生我）、喜比劫（同我）；忌财官食。
 * 偏强：用官杀（克我）、喜食伤（我生）/财（我克）；忌印比。
 */
export function calcXiYong(dayGan: string, strength: Strength): XiYongResult {
  const dayWx = GAN_WUXING[dayGan];
  // 生我者
  const shengWo = Object.entries(SHENG).find(([, v]) => v === dayWx)?.[0] ?? '';
  // 克我者
  const keWo = Object.entries(KE).find(([, v]) => v === dayWx)?.[0] ?? '';
  const woSheng = SHENG[dayWx]; // 我生
  const woKe = KE[dayWx];       // 我克

  let yong: string[];
  let xi: string[];
  let ji: string[];

  if (strength === '偏弱' || strength === '极弱') {
    yong = [shengWo];       // 印
    xi = [dayWx];           // 比劫
    ji = [keWo, woKe, woSheng]; // 官杀、财、食伤
  } else if (strength === '偏强' || strength === '极强') {
    yong = [keWo];          // 官杀
    xi = [woSheng, woKe];   // 食伤、财
    ji = [shengWo, dayWx];  // 印、比劫
  } else {
    // 均衡：取调候/通关为用，但扶抑法下保守取中和，喜用为空（由调候标注补充）
    yong = [];
    xi = [];
    ji = [];
  }

  // 幸运映射（颜色/方位/数字仅来自配置，不随机）
  const luckyWx = [...yong, ...xi];
  const colors = Array.from(new Set(luckyWx.flatMap(w => LUCK_MAP[w]?.colors ?? [])));
  const directions = Array.from(new Set(luckyWx.flatMap(w => LUCK_MAP[w]?.directions ?? [])));
  const numbers = Array.from(new Set(luckyWx.flatMap(w => LUCK_MAP[w]?.numbers ?? [])));

  return { yong, xi, ji, colors, directions, numbers };
}

/**
 * 调候用神（仅标注，不参与喜用合成；出处《穷通宝鉴》）。
 * 返回该日干在当月的调候用神天干列表与出处。
 */
export function calcTiaoHou(dayGan: string, monthZhi: string): { gods: string[]; source: string } {
  // 《穷通宝鉴》调候用神简表（按月令地支）。
  // 仅覆盖可确定条目；不确定返回空。
  const TABLE: Record<string, Record<string, string[]>> = {
    辛: {
      午: ['壬', '己'],   // 辛金午月：壬水淘洗 + 己土生身
      巳: ['壬', '甲', '癸'],
      未: ['壬', '甲'],
      申: ['壬', '甲'],
      酉: ['壬'],
      戌: ['壬', '甲'],
      亥: ['壬', '丙'],
      子: ['丙', '戊'],
      丑: ['丙', '戊', '壬'],
      寅: ['己', '壬', '庚'],
      卯: ['己', '甲'],
      辰: ['甲', '壬'],
    },
  };
  const gods = TABLE[dayGan]?.[monthZhi] ?? [];
  return { gods, source: '穷通宝鉴' };
}
