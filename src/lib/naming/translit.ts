/**
 * src/lib/naming/translit.ts
 * 音译通道（M1-3）：英文名 → 普通话音节 → 音近汉字簇。
 *
 * 三级策略（确定性，零随机）：
 * 1. TRANSLIT_SEED 命中 → 直接用表内音节（音译表，人工审校种子，M6 由语料扩充）
 * 2. 未命中 → 元音组切分音节（连续元音为一个韵腹组）；单元音音节经 VOWEL_FALLBACK 映射
 * 3. 每音节先取 toneless 精确匹配字，不足 clusterMax 时以 string-similarity
 *    （Sørensen-Dice）≥ TRANSLIT.syllableThreshold 补足
 *
 * 任一音节零候选 → 整体返回 null（不产出废名，v7 §7.1④）。
 * 注：inventory 键由 pinyinList（symbol）NFD 去音符归一，ü 归作 u；
 *     与 phonology 内部的 v 写法互不交叉，各自体系内自洽。
 */
import { compareTwoStrings } from 'string-similarity';
import { TRANSLIT } from './config';
import type { CharMeta } from './charMeta';

export interface TranslitSeedEntry {
  /** 普通话音节（toneless，均为合法音节） */
  syllables: string[];
  /** 经典译名用字（人工审校，与 syllables 一一对应）：命中时校验读音后置顶入簇 */
  chars?: string[];
}

/**
 * 音译表（种子，人工审校）：英文名 → 普通话音节序列（toneless）。
 * 收录 US 高频名（对齐 SSA 流行榜），扩充时保持「音节均为合法普通话音节」。
 */
export const TRANSLIT_SEED: Record<string, TranslitSeedEntry> = {
  ethan: { syllables: ['yi', 'sen'], chars: ['伊', '森'] },
  emma: { syllables: ['ai', 'ma'] },
  olivia: { syllables: ['ao', 'li', 'ya'] },
  noah: { syllables: ['nuo', 'ya'] },
  ava: { syllables: ['ai', 'wa'] },
  sophia: { syllables: ['suo', 'fei', 'ya'] },
  mason: { syllables: ['mei', 'sen'] },
  isabella: { syllables: ['yi', 'sha', 'bei', 'la'] },
  lucas: { syllables: ['lu', 'ka', 'si'] },
  mia: { syllables: ['mi', 'ya'] },
  oliver: { syllables: ['ao', 'li', 'fu'] },
  amelia: { syllables: ['ai', 'mi', 'li', 'ya'] },
  elijah: { syllables: ['yi', 'lai', 'ya'] },
  harper: { syllables: ['ha', 'po'] },
  james: { syllables: ['zhan', 'mu', 'si'] },
  evelyn: { syllables: ['yi', 'fu', 'lin'] },
  benjamin: { syllables: ['ben', 'jie', 'ming'] },
  abigail: { syllables: ['a', 'bi', 'gai', 'er'] },
  henry: { syllables: ['heng', 'li'] },
  emily: { syllables: ['ai', 'mi', 'li'] },
  alexander: { syllables: ['ya', 'li', 'shan', 'da'] },
  elizabeth: { syllables: ['yi', 'li', 'sha', 'bai'] },
  charlotte: { syllables: ['xia', 'luo', 'te'] },
  daniel: { syllables: ['dan', 'ni', 'er'] },
  grace: { syllables: ['ge', 'lei', 'si'] },
  chloe: { syllables: ['ke', 'luo', 'yi'] },
  leo: { syllables: ['li', 'ao'] },
  luna: { syllables: ['lu', 'na'] },
  aiden: { syllables: ['ai', 'deng'] },
  ryan: { syllables: ['rui', 'en'] },
  ella: { syllables: ['ai', 'la'] },
  vivian: { syllables: ['wei', 'wei', 'an'] },
  stella: { syllables: ['si', 'te', 'la'] },
  nora: { syllables: ['nuo', 'la'] },
  hannah: { syllables: ['han', 'na'] },
  jack: { syllables: ['jie', 'ke'] },
  lily: { syllables: ['li', 'li'] },
  zoe: { syllables: ['zuo', 'yi'] },
  william: { syllables: ['wei', 'lian'] },
  aria: { syllables: ['a', 'li', 'ya'] },
  hazel: { syllables: ['hai', 'ze', 'er'] },
  victoria: { syllables: ['wei', 'duo', 'li', 'ya'] },
  carter: { syllables: ['ka', 'te'] },
  michael: { syllables: ['mai', 'ke', 'er'] },
  sarah: { syllables: ['sha', 'la'] },
  aaron: { syllables: ['ya', 'lun'] },
  adam: { syllables: ['ya', 'dang'] },
};

/** 单元音音节回退映射（英文短元音 → 最近普通话音节） */
const VOWEL_FALLBACK: Record<string, string> = {
  a: 'a', e: 'e', i: 'yi', o: 'ao', u: 'wu', y: 'yi',
};

const VOWELS = 'aeiouy';

/** 普通话韵母（纯元音串，含 y 起零声母写法）：整段元音恰为其一时不再拆分 */
const VOWEL_FINALS = new Set([
  'a', 'o', 'e', 'i', 'u',
  'ai', 'ei', 'ao', 'ou',
  'ia', 'ie', 'iao', 'iou', 'iu',
  'ua', 'uo', 'uai', 'uei', 'ui', 'ue',
  'ya', 'ye', 'yi', 'yo', 'yu',
  'ay', 'ey', 'oy', 'uy',
]);

/** 元音组切分：整段元音为合法韵母则成一组，否则逐元音拆组（noah → no+ah）；
 *  组间辅音并入下一音节；尾部辅音并入上一音节 */
export function splitSyllables(name: string): string[] {
  const s = name.toLowerCase().replace(/[^a-z]/g, '');
  const out: string[] = [];
  let cons = '';
  let i = 0;
  while (i < s.length) {
    if (VOWELS.includes(s[i]!)) {
      let run = '';
      while (i < s.length && VOWELS.includes(s[i]!)) { run += s[i]!; i += 1; }
      if (VOWEL_FINALS.has(run)) {
        out.push(cons + run);
      } else {
        out.push(cons + run[0]!);
        for (let k = 1; k < run.length; k += 1) out.push(run[k]!);
      }
      cons = '';
    } else {
      cons += s[i]!;
      i += 1;
    }
  }
  if (cons && out.length > 0) out[out.length - 1] += cons;
  return out;
}

function stripTones(py: string): string {
  return py.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

interface Inventory {
  byToneless: Map<string, InventoryEntry[]>;
}

interface InventoryEntry {
  m: CharMeta;
  /** 该字默认读音（pinyin 字段）是否即此音节：音译场景优先 */
  isDefault: boolean;
}

const invCache = new WeakMap<Map<string, CharMeta>, Inventory>();

function byEntryWorthiness(a: InventoryEntry, b: InventoryEntry): number {
  return (a.isDefault ? 0 : 1) - (b.isDefault ? 0 : 1)
    || (a.m.freqRank ?? Number.MAX_SAFE_INTEGER) - (b.m.freqRank ?? Number.MAX_SAFE_INTEGER)
    || (a.m.variant === true ? 1 : 0) - (b.m.variant === true ? 1 : 0)
    || (a.m.simplified === true ? 0 : 1) - (b.m.simplified === true ? 0 : 1)
    || a.m.strokeKangxi - b.m.strokeKangxi
    || (a.m.char.codePointAt(0) ?? 0) - (b.m.char.codePointAt(0) ?? 0);
}

/** toneless → 可入名字簇（只建一次，WeakMap 随字库缓存；同字同音节去重） */
function getInventory(meta: Map<string, CharMeta>): Inventory {
  const cached = invCache.get(meta);
  if (cached) return cached;
  const byToneless = new Map<string, InventoryEntry[]>();
  for (const m of meta.values()) {
    if (m.nameable === false) continue;
    const defaultKey = stripTones(m.pinyin);
    const keys = new Set(m.pinyinList.map(stripTones));
    for (const key of keys) {
      let arr = byToneless.get(key);
      if (!arr) { arr = []; byToneless.set(key, arr); }
      if (!arr.some(e => e.m.char === m.char)) {
        arr.push({ m, isDefault: key === defaultKey });
      }
    }
  }
  for (const arr of byToneless.values()) arr.sort(byEntryWorthiness);
  const inv: Inventory = { byToneless };
  invCache.set(meta, inv);
  return inv;
}

function candidatesFor(toneless: string, inv: Inventory): CharMeta[] {
  const exact = (inv.byToneless.get(toneless) ?? []).map(e => e.m);
  if (exact.length >= TRANSLIT.clusterMax) return exact.slice(0, TRANSLIT.clusterMax);
  const have = new Set(exact.map(c => c.char));
  const fuzzy: Array<{ m: CharMeta; s: number }> = [];
  for (const [key, arr] of inv.byToneless) {
    if (key === toneless || arr.length === 0) continue;
    const sim = compareTwoStrings(toneless, key);
    if (sim >= TRANSLIT.syllableThreshold) fuzzy.push({ m: arr[0].m, s: sim });
  }
  fuzzy.sort((a, b) => b.s - a.s || byEntryWorthiness(
    { m: a.m, isDefault: false },
    { m: b.m, isDefault: false },
  ));
  for (const f of fuzzy) {
    if (exact.length >= TRANSLIT.clusterMax) break;
    if (!have.has(f.m.char)) { exact.push(f.m); have.add(f.m.char); }
  }
  return exact;
}

export interface SyllableCluster {
  /** 原始音节（英文侧） */
  raw: string;
  /** 普通话音节（toneless） */
  mandarin: string;
  /** seed=音译表；vowel=单元音映射；fuzzy=切分+模糊匹配 */
  source: 'seed' | 'vowel' | 'fuzzy';
  candidates: CharMeta[];
}

/** 英文名 → 每音节候选汉字簇；不可音译（任一音节零候选）返回 null */
export function translitName(englishName: string, meta: Map<string, CharMeta>): SyllableCluster[] | null {
  const norm = englishName.toLowerCase().replace(/[^a-z]/g, '');
  if (!norm) return null;
  const inv = getInventory(meta);
  const seed = TRANSLIT_SEED[norm];
  if (seed) {
    const clusters = seed.syllables.map((syl, i) => {
      const candidates = candidatesFor(syl, inv);
      const pin = seed.chars?.[i];
      const m = pin ? meta.get(pin) : undefined;
      if (m && m.nameable !== false && m.pinyinList.some(p => stripTones(p) === syl)) {
        const idx = candidates.findIndex(c => c.char === pin);
        if (idx >= 0) candidates.splice(idx, 1);
        candidates.unshift(m);
        if (candidates.length > TRANSLIT.clusterMax) candidates.pop();
      }
      return { raw: syl, mandarin: syl, source: 'seed' as const, candidates };
    });
    return clusters.every(c => c.candidates.length > 0) ? clusters : null;
  }
  const clusters: SyllableCluster[] = [];
  for (const raw of splitSyllables(norm)) {
    const mandarin = raw.length === 1 ? VOWEL_FALLBACK[raw] ?? raw : raw;
    const candidates = candidatesFor(mandarin, inv);
    if (candidates.length === 0) return null;
    clusters.push({ raw, mandarin, source: raw.length === 1 ? 'vowel' : 'fuzzy', candidates });
  }
  return clusters;
}
