/**
 * src/lib/shensha/dizhi.ts
 * 地支类神煞 —— 年支查=大, 日支查=小，大小并存（规则 8B）。
 * 输出带 level（大/小）与 source（年支/日支）。
 *
 * 包含：桃花、驿马、华盖、将星、红鸾
 */

import type { ShenSha } from '@/lib/bazi/paipan';
import type { ShenshaHit } from './tiangan';

// ── 三合局分组 ──────────────────────────────────────────

/** 三合局：申子辰(水), 寅午戌(火), 巳酉丑(金), 亥卯未(木) */
const SANHE_GROUPS: Record<string, string[]> = {
  申: ['申', '子', '辰'], 子: ['申', '子', '辰'], 辰: ['申', '子', '辰'],
  寅: ['寅', '午', '戌'], 午: ['寅', '午', '戌'], 戌: ['寅', '午', '戌'],
  巳: ['巳', '酉', '丑'], 酉: ['巳', '酉', '丑'], 丑: ['巳', '酉', '丑'],
  亥: ['亥', '卯', '未'], 卯: ['亥', '卯', '未'], 未: ['亥', '卯', '未'],
};

// ── 神煞查表（按三合局）──────────────────────────────

/**
 * 桃花（咸池）：
 * 申子辰→酉, 寅午戌→卯, 巳酉丑→午, 亥卯未→子
 */
const TAOHUA: Record<string, string> = {
  申: '酉', 子: '酉', 辰: '酉',
  寅: '卯', 午: '卯', 戌: '卯',
  巳: '午', 酉: '午', 丑: '午',
  亥: '子', 卯: '子', 未: '子',
};

/**
 * 驿马：
 * 申子辰→寅, 寅午戌→申, 巳酉丑→亥, 亥卯未→巳
 */
const YIMA: Record<string, string> = {
  申: '寅', 子: '寅', 辰: '寅',
  寅: '申', 午: '申', 戌: '申',
  巳: '亥', 酉: '亥', 丑: '亥',
  亥: '巳', 卯: '巳', 未: '巳',
};

/**
 * 华盖：
 * 申子辰→辰, 寅午戌→戌, 巳酉丑→丑, 亥卯未→未
 */
const HUAGAI: Record<string, string> = {
  申: '辰', 子: '辰', 辰: '辰',
  寅: '戌', 午: '戌', 戌: '戌',
  巳: '丑', 酉: '丑', 丑: '丑',
  亥: '未', 卯: '未', 未: '未',
};

/**
 * 将星：
 * 申子辰→子, 寅午戌→午, 巳酉丑→酉, 亥卯未→卯
 */
const JIANGXING: Record<string, string> = {
  申: '子', 子: '子', 辰: '子',
  寅: '午', 午: '午', 戌: '午',
  巳: '酉', 酉: '酉', 丑: '酉',
  亥: '卯', 卯: '卯', 未: '卯',
};

/**
 * 红鸾（年支查）：
 * 子→卯, 丑→寅, 寅→丑, 卯→子, 辰→亥, 巳→戌,
 * 午→酉, 未→申, 申→未, 酉→午, 戌→巳, 亥→辰
 */
const HONGLUAN: Record<string, string> = {
  子: '卯', 丑: '寅', 寅: '丑', 卯: '子',
  辰: '亥', 巳: '戌', 午: '酉', 未: '申',
  申: '未', 酉: '午', 戌: '巳', 亥: '辰',
};

/**
 * 天喜（红鸾之六冲位）：
 * 子→酉, 丑→申, 寅→未, 卯→午, 辰→巳, 巳→辰,
 * 午→卯, 未→寅, 申→丑, 酉→子, 戌→亥, 亥→戌
 */
const TIANXI: Record<string, string> = {
  子: '酉', 丑: '申', 寅: '未', 卯: '午',
  辰: '巳', 巳: '辰', 午: '卯', 未: '寅',
  申: '丑', 酉: '子', 戌: '亥', 亥: '戌',
};

/**
 * 六厄（三合局之死地，《三命通会》）：
 * 申子辰→卯, 寅午戌→酉, 巳酉丑→子, 亥卯未→午
 */
const LIUE: Record<string, string> = {
  申: '卯', 子: '卯', 辰: '卯',
  寅: '酉', 午: '酉', 戌: '酉',
  巳: '子', 酉: '子', 丑: '子',
  亥: '午', 卯: '午', 未: '午',
};

// ── 查表主函数 ──────────────────────────────────────────

/**
 * 地支类神煞查表：年支查=大, 日支查=小，大小并存。
 *
 * @param yearZhi 年支（大基准）
 * @param dayZhi 日支（小基准）
 * @param pillars 四柱干支
 * @returns 命中神煞列表
 */
export function findDizhiShensha(
  yearZhi: string,
  dayZhi: string,
  pillars: { position: 'year' | 'month' | 'day' | 'hour'; gan: string; zhi: string }[],
): ShenshaHit[] {
  const hits: ShenshaHit[] = [];

  // 通用查表函数：对每个地支类神煞，分别用年支(大)和日支(小)查
  function checkDizhiShensha(
    name: string,
    table: Record<string, string>,
    keyZhi: string,
    level: '大' | '小',
    source: '年支' | '日支',
  ) {
    const target = table[keyZhi];
    if (!target) return;
    for (const p of pillars) {
      if (p.zhi === target) {
        hits.push({
          pillar: p.position,
          shensha: { name, level, source },
        });
      }
    }
  }

  // 桃花
  checkDizhiShensha('桃花', TAOHUA, yearZhi, '大', '年支');
  checkDizhiShensha('桃花', TAOHUA, dayZhi, '小', '日支');

  // 驿马
  checkDizhiShensha('驿马', YIMA, yearZhi, '大', '年支');
  checkDizhiShensha('驿马', YIMA, dayZhi, '小', '日支');

  // 华盖
  checkDizhiShensha('华盖', HUAGAI, yearZhi, '大', '年支');
  checkDizhiShensha('华盖', HUAGAI, dayZhi, '小', '日支');

  // 将星
  checkDizhiShensha('将星', JIANGXING, yearZhi, '大', '年支');
  checkDizhiShensha('将星', JIANGXING, dayZhi, '小', '日支');

  // 红鸾
  checkDizhiShensha('红鸾', HONGLUAN, yearZhi, '大', '年支');
  checkDizhiShensha('红鸾', HONGLUAN, dayZhi, '小', '日支');

  // 天喜（红鸾之冲）
  checkDizhiShensha('天喜', TIANXI, yearZhi, '大', '年支');
  checkDizhiShensha('天喜', TIANXI, dayZhi, '小', '日支');

  // 六厄
  checkDizhiShensha('六厄', LIUE, yearZhi, '大', '年支');
  checkDizhiShensha('六厄', LIUE, dayZhi, '小', '日支');

  return hits;
}
