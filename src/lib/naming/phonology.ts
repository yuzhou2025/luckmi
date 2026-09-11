/**
 * src/lib/naming/phonology.ts
 * 音律评分（M1-3，权重 NAMING_WEIGHT.yinlv = 0.20）。
 *
 * 口径：
 * - 读音唯一事实源 = pinyin-pro（config.POLYPHONE.canonicalSource，多音字仲裁已锁死；
 *   内部 toneless 采用 pinyin-pro num 形式，ü 记作 v，与音译通道的 NFD 归一互不交叉）
 * - 评分在「读音组合」空间取最优（多音字按最优读法计），组合数超 POLYPHONE.comboCap
 *   时仅用各字默认读音组合
 * - 扣分/加分项全部来自 config.PHONOLOGY，本文件零魔法数字
 */
import { pinyin } from 'pinyin-pro';
import { PHONOLOGY, POLYPHONE } from './config';
import type { CharMeta } from './charMeta';

export interface Reading {
  /** 带调（如 hào） */
  full: string;
  /** 去调（如 hao） */
  toneless: string;
  shengmu: string;
  yunmu: string;
  /** 1-4；0=轻声/未知 */
  tone: number;
}

export interface PhonologyResult {
  /** 0..1（已截断） */
  score: number;
  /** 如 仄仄平 */
  toneFlow: string;
  toneVariety: number;
  /** 选定的最优读音组合（带调） */
  readings: string[];
  issues: string[];
}

const INITIALS = ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's', 'y', 'w'] as const;

function splitSyllable(syl: string): { shengmu: string; yunmu: string } {
  for (const ini of INITIALS) {
    if (syl.startsWith(ini)) return { shengmu: ini, yunmu: syl.slice(ini.length) };
  }
  return { shengmu: '', yunmu: syl };
}

const readingsCache = new Map<string, Reading[]>();

/** 单字全部读音（pinyin-pro multiple，与构建期 pinyinList 同源） */
export function getReadings(char: string): Reading[] {
  const cached = readingsCache.get(char);
  if (cached) return cached;
  const symbols = pinyin(char, { multiple: true, toneType: 'symbol', type: 'array' }) ?? [];
  const nums = pinyin(char, { multiple: true, toneType: 'num', type: 'array' }) ?? [];
  const list: Reading[] = symbols.map((full, i) => {
    const numStr = nums[i] ?? '';
    const toneNum = Number(numStr.match(/(\d)$/)?.[1] ?? 0);
    const toneless = numStr
      ? numStr.replace(/\d$/, '')
      : full.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const { shengmu, yunmu } = splitSyllable(toneless);
    return { full, toneless, shengmu, yunmu, tone: toneNum >= 1 && toneNum <= 4 ? toneNum : 0 };
  });
  readingsCache.set(char, list);
  return list;
}

function product(arrays: Reading[][]): Reading[][] {
  return arrays.reduce<Reading[][]>(
    (acc, cur) => acc.flatMap(prefix => cur.map(item => [...prefix, item])),
    [[]],
  );
}

function scoreCombo(readings: Reading[]): PhonologyResult {
  const issues: string[] = [];
  let score = 1;
  const tones = readings.map(r => r.tone);
  const toneVariety = new Set(tones).size;
  if (toneVariety < PHONOLOGY.toneVarietyMin) {
    score -= PHONOLOGY.toneVarietyPenalty * (PHONOLOGY.toneVarietyMin - toneVariety);
    issues.push(`声调种类${toneVariety}（不足${PHONOLOGY.toneVarietyMin}）`);
  }
  for (let i = 0; i < readings.length - 1; i++) {
    const a = readings[i];
    const b = readings[i + 1];
    if (a.shengmu && a.shengmu === b.shengmu) {
      score -= PHONOLOGY.sameShengmuPenalty;
      issues.push(`双声：第${i + 1}-${i + 2}字同声母 ${a.shengmu}`);
    }
    if (a.yunmu === b.yunmu) {
      score -= PHONOLOGY.sameYunmuPenalty;
      issues.push(`叠韵：第${i + 1}-${i + 2}字同韵母 ${a.yunmu}`);
    }
  }
  const firstTone = tones[0];
  const lastTone = tones[tones.length - 1];
  if ((firstTone === 3 || firstTone === 4) && (lastTone === 1 || lastTone === 2)) {
    score += PHONOLOGY.levelEndBonus;
  }
  return {
    score: Math.round(Math.min(1, Math.max(0, score)) * 1000) / 1000,
    toneFlow: tones.map(t => (t === 1 || t === 2 ? '平' : '仄')).join(''),
    toneVariety,
    readings: readings.map(r => r.full),
    issues,
  };
}

/** 音律评分：姓 + 名（多音字在组合空间取最优读法） */
export function scorePhonology(surname: CharMeta, given: CharMeta[]): PhonologyResult {
  const units = [surname, ...given];
  const perUnit = units.map(u => {
    const rs = getReadings(u.char);
    if (rs.length === 0) throw new Error(`phonology: 字库字「${u.char}」无读音`);
    return rs;
  });
  let combos = product(perUnit);
  if (combos.length > POLYPHONE.comboCap) {
    combos = [perUnit.map(rs => rs[0])];
  }
  let best: PhonologyResult | null = null;
  for (const combo of combos) {
    const r = scoreCombo(combo);
    if (!best || r.score > best.score) best = r;
  }
  return best!;
}
