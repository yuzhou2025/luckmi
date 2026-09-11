/**
 * src/lib/naming/scorer.ts
 * 六维加权评分（M1-4，权重 NAMING_WEIGHT 锁死：.35喜用/.20音律/.15字义/.10字形/.10数理/.10独特）。
 *
 * 口径：
 * - 喜用：字五行 ∈ 用神=100 喜神=85 中性=55 忌神=10；喜用入参缺省（均衡/未提供生辰）→ 75 中性档
 * - 音律：phonology.scorePhonology（多音字组合空间取最优），0..1 → 0..100
 * - 字义：M1 启发式（有释义=80 无=60；意译通道语义标签命中 +15），M6 接字义语料后重校
 * - 字形：康熙笔画极差分层（≤4=100 / ≤8=88 / ≤12=75 / 其余=60）
 * - 数理：五格 81 表层级分（吉100/半吉75/凶40），人格.35+总格.35+地格.15+外格.15
 * - 独特性：freqRank 均值/80 截断 [20,100]（越靠后越独特）
 * - 全部确定性，零随机；同入参同出参。
 */
import { NAMING_WEIGHT } from './config';
import { scorePhonology, type PhonologyResult } from './phonology';
import { calcWuge } from './numerology';
import type { CharMeta } from './charMeta';
import type { XiYongInput } from './hardFilter';

export interface ScoreInput {
  surname: CharMeta;
  given: CharMeta[];
  xiYong?: XiYongInput;
  /** 意译通道语义标签（字义加分依据） */
  semanticMeaning?: string;
}

export interface ScoreResult {
  xiyong: number;
  yinlv: number;
  ziyi: number;
  zixing: number;
  shuli: number;
  dute: number;
  /** 加权总分 0..100（1 位小数） */
  total: number;
  phonology: PhonologyResult;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const avg = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);

function scoreXiyong(given: CharMeta[], xiYong?: XiYongInput): number {
  if (!xiYong || (xiYong.yong.length === 0 && xiYong.xi.length === 0 && xiYong.ji.length === 0)) {
    return 75; // 均衡档：无喜用取向，中性分
  }
  const per = given.map(g => {
    if (xiYong.yong.includes(g.wuxing)) return 100;
    if (xiYong.xi.includes(g.wuxing)) return 85;
    if (xiYong.ji.includes(g.wuxing)) return 10;
    return 55;
  });
  return Math.round(avg(per));
}

function scoreZiyi(given: CharMeta[], semanticMeaning?: string): number {
  const per = given.map(g => {
    const base = g.meaning ? 80 : 60;
    return semanticMeaning ? Math.min(100, base + 15) : base;
  });
  return Math.round(avg(per));
}

function scoreZixing(given: CharMeta[]): number {
  const strokes = given.map(g => g.strokeKangxi);
  const spread = Math.max(...strokes) - Math.min(...strokes);
  if (spread <= 4) return 100;
  if (spread <= 8) return 88;
  if (spread <= 12) return 75;
  return 60;
}

const SHULI_SCORE: Record<string, number> = { 吉: 100, 半吉: 75, 凶: 40 };

function scoreShuli(surname: CharMeta, given: CharMeta[]): number {
  const wuge = calcWuge({
    surname: [surname.strokeKangxi],
    given: given.map(g => g.strokeKangxi),
  });
  const e = wuge.entries;
  // 单名外格不成立（numerology 流派口径）：其 0.15 权重并入总格
  if (given.length === 1) {
    const raw = 0.35 * SHULI_SCORE[e.ren.level] + 0.50 * SHULI_SCORE[e.zong.level] + 0.15 * SHULI_SCORE[e.di.level];
    return Math.round(raw);
  }
  const raw =
    0.35 * SHULI_SCORE[e.ren.level] +
    0.35 * SHULI_SCORE[e.zong.level] +
    0.15 * SHULI_SCORE[e.di.level] +
    0.15 * SHULI_SCORE[e.wai.level];
  return Math.round(raw);
}

function scoreDute(given: CharMeta[]): number {
  const ranks = given.map(g => g.freqRank).filter((r): r is number => r !== undefined);
  if (ranks.length === 0) return 40;
  // 非简体形式（繁体/繁简同形）且低频（freqRank > 3000）→ 封顶 15
  // 避免奖励海外输入法打不出的繁体字（如 開/鐦）；繁简同形常用字（王/一）freqRank 低不受影响
  const per = given.map(g => {
    if (g.freqRank === undefined) return 40;
    if (g.simplified !== true && g.freqRank > 3000) return 15;
    return Math.min(100, Math.max(20, Math.round(g.freqRank / 80)));
  });
  return Math.round(avg(per));
}

export function scoreName(input: ScoreInput): ScoreResult {
  const { surname, given, xiYong, semanticMeaning } = input;
  const phonology = scorePhonology(surname, given);

  const xiyong = scoreXiyong(given, xiYong);
  const yinlv = Math.round(phonology.score * 100);
  const ziyi = scoreZiyi(given, semanticMeaning);
  const zixing = scoreZixing(given);
  const shuli = scoreShuli(surname, given);
  const dute = scoreDute(given);

  const total = round1(
    NAMING_WEIGHT.xiyong * xiyong +
    NAMING_WEIGHT.yinlv * yinlv +
    NAMING_WEIGHT.ziyi * ziyi +
    NAMING_WEIGHT.zixing * zixing +
    NAMING_WEIGHT.shuli * shuli +
    NAMING_WEIGHT.dute * dute,
  );

  return { xiyong, yinlv, ziyi, zixing, shuli, dute, total, phonology };
}
