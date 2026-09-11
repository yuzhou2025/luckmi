/**
 * src/lib/naming/pipeline.ts
 * 起名主管线（M1-4）：音译 + 意译双通道 → 六项硬过滤 → 六维加权评分 → TopN。
 *
 * 口径：
 * - 通道汇合去重（键 = 名字用字串；translit 先到先得）
 * - 音译簇笛卡尔积组合上限 MAX_COMBOS（截断即止，簇内已按 worthiness 排序）
 * - 意译通道：种子字 2 字有序对 + 前 2 字单名，上限 SEMANTIC_COMBOS
 * - 不可音译且无意译 → 返回空数组（不产出废名，v7 §7.1④）
 * - 排序：total 降序 → freqRank 均值升序 → 用字码点串（全确定性）
 * - 纯函数：零副作用、零随机；喜用入参来自 bazi-engine calcXiYong 出参。
 */
import { OUTPUT } from './config';
import type { CharMeta } from './charMeta';
import { translitName } from './translit';
import { semanticName } from './semantic';
import { applyHardFilters, type XiYongInput } from './hardFilter';
import { scoreName, type ScoreResult } from './scorer';

const MAX_COMBOS = 512;
const SEMANTIC_COMBOS = 32;

export interface NamingRequest {
  englishName: string;
  surname: CharMeta;
  /** 八字喜用（bazi-engine 出参；缺省 = 不做喜用过滤/评分取中性档） */
  xiYong?: XiYongInput;
  /** 用户避讳（长辈名等） */
  tabooNames?: string[];
  /** 输出条数，缺省 OUTPUT.quickTopN */
  topN?: number;
}

export interface NameCandidateResult {
  given: CharMeta[];
  full: string;
  source: 'translit' | 'semantic';
  /** 意译通道语义标签 */
  meaning?: string;
  /** 音译通道普通话音节 */
  syllables?: string[];
  score: ScoreResult;
  popularityLabel: string;
}

function combosOf<T>(lists: T[][], cap: number): T[][] {
  const out: T[][] = [];
  const walk = (idx: number, prefix: T[]) => {
    if (out.length >= cap) return;
    if (idx === lists.length) { out.push(prefix); return; }
    for (const item of lists[idx]!) {
      walk(idx + 1, [...prefix, item]);
      if (out.length >= cap) return;
    }
  };
  walk(0, []);
  return out;
}

type ChannelCandidate = Omit<NameCandidateResult, 'score' | 'popularityLabel'>;

function translitCandidates(name: string, meta: Map<string, CharMeta>): ChannelCandidate[] {
  const clusters = translitName(name, meta);
  if (!clusters) return [];
  const out: ChannelCandidate[] = [];
  for (const combo of combosOf(clusters.map(c => c.candidates), MAX_COMBOS)) {
    out.push({
      given: combo,
      full: combo.map(c => c.char).join(''),
      source: 'translit',
      syllables: clusters.map(c => c.mandarin),
    });
  }
  return out;
}

function semanticCandidates(name: string, meta: Map<string, CharMeta>): ChannelCandidate[] {
  const match = semanticName(name, meta);
  if (!match) return [];
  const cs = match.candidates;
  const out: ChannelCandidate[] = [];
  // 2 字有序对（i<j，按种子契合度排序）
  for (let i = 0; i < cs.length && out.length < SEMANTIC_COMBOS; i++) {
    for (let j = i + 1; j < cs.length && out.length < SEMANTIC_COMBOS; j++) {
      out.push({
        given: [cs[i]!, cs[j]!],
        full: `${cs[i]!.char}${cs[j]!.char}`,
        source: 'semantic',
        meaning: match.meaning,
      });
    }
  }
  // 单名（前 2 字）
  for (let i = 0; i < Math.min(2, cs.length); i++) {
    out.push({
      given: [cs[i]!],
      full: cs[i]!.char,
      source: 'semantic',
      meaning: match.meaning,
    });
  }
  return out;
}

/** 英文名 + 八字喜用 → 候选名（硬过滤后评分排序 TopN）；无可产名返回 [] */
export function generateNameCandidates(req: NamingRequest, meta: Map<string, CharMeta>): NameCandidateResult[] {
  const topN = req.topN ?? OUTPUT.quickTopN;
  const name = req.englishName.toLowerCase().replace(/[^a-z]/g, '');
  if (!name) return [];

  const merged: ChannelCandidate[] = [];
  const seen = new Set<string>();
  for (const c of [...translitCandidates(name, meta), ...semanticCandidates(name, meta)]) {
    const key = c.full;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(c);
  }

  const scored: NameCandidateResult[] = [];
  for (const c of merged) {
    const filter = applyHardFilters({
      surname: req.surname,
      given: c.given,
      xiYong: req.xiYong,
      tabooNames: req.tabooNames,
    });
    if (!filter.pass) continue;
    const score = scoreName({
      surname: req.surname,
      given: c.given,
      xiYong: req.xiYong,
      semanticMeaning: c.meaning,
    });
    scored.push({ ...c, full: req.surname.char + c.full, score, popularityLabel: filter.popularityLabel });
  }

  const avgRank = (r: NameCandidateResult) =>
    avg(r.given.map(g => g.freqRank ?? Number.MAX_SAFE_INTEGER));
  const avg = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);

  scored.sort((a, b) =>
    b.score.total - a.score.total
    || avgRank(a) - avgRank(b)
    || a.full.localeCompare(b.full, 'zh-Hans-CN')
    || (a.full.codePointAt(0) ?? 0) - (b.full.codePointAt(0) ?? 0),
  );
  return scored.slice(0, topN);
}
