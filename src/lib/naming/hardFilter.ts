/**
 * src/lib/naming/hardFilter.ts
 * 六项硬过滤链（M1-4，一票否决；口径唯一来源 config.HARD_FILTER）。
 *
 * 执行顺序即规则编号：
 * ① 喜用契合：候选字五行 ∈ 忌神 → 否决（喜用/中性放行，分差交给 scorer）
 * ② 数理：五格查 81 表（numerology.checkWuge，人格/总格 ≥ 半吉，地格/外格非凶）
 * ③ 谐音：普通话默认读音音节序列 vs 粗俗谐音黑名单（≥2 音节，防误杀单音节）；
 *    粤语侧仅字面黑名单（jyutping 音节引擎待 M6 语料，不现编）
 * ④ 避讳：用户长辈名（按字）+ 历史负面人物名 + 品牌商标
 * ⑤ 生僻字：freqRank 缺失或 > freqRankMax → 否决（海外输入法可打性）
 * ⑥ 流行度：仅标注不过滤（config.popularityLabelOnly）
 *
 * 纯函数：所有规则收集全部 reason（可审计），不短路。
 */
import { HARD_FILTER } from './config';
import type { CharMeta } from './charMeta';
import { checkWuge, type ShuliLevel } from './numerology';

export interface XiYongInput {
  /** 用神五行（八字引擎 calcXiYong 出参子集） */
  yong: string[];
  /** 喜神五行 */
  xi: string[];
  /** 忌神五行 */
  ji: string[];
}

export type FilterRule = 'xiyong' | 'wuge' | 'homophone' | 'taboo' | 'rare';

export interface FilterReason {
  rule: FilterRule;
  detail: string;
}

export interface HardFilterInput {
  /** 姓氏（②数理需要；缺省跳过②） */
  surname?: CharMeta;
  /** 名候选字 */
  given: CharMeta[];
  /** 八字喜用（缺省跳过①，如生辰未提供） */
  xiYong?: XiYongInput;
  /** 用户避讳（长辈名等，按字避讳） */
  tabooNames?: string[];
}

export interface HardFilterResult {
  pass: boolean;
  reasons: FilterReason[];
  /** ⑥ 流行度标注（仅展示，不参与过滤） */
  popularityLabel: string;
}

// ── ③ 谐音黑名单（普通话，toneless 音节序列；NFD 归一后 ü→u） ──
const HOMOPHONE_BLACKLIST: readonly string[][] = [
  ['sha', 'ren'], ['sha', 'hai'], ['gai', 'si'], ['zhao', 'si'], ['qu', 'si'],
  ['bai', 'chi'], ['ben', 'dan'], ['hun', 'dan'], ['wang', 'ba', 'dan'],
  ['liu', 'mang'], ['fang', 'pi'], ['gou', 'shi'], ['sha', 'gua'], ['sha', 'zi'],
  ['bian', 'tai'], ['se', 'qing'], ['se', 'lang'], ['jian', 'ren'], ['jian', 'huo'],
  ['biao', 'zi'], ['fei', 'wu'], ['la', 'ji'], ['chu', 'sheng'], ['za', 'zhong'],
  ['han', 'jian'], ['ruo', 'zhi'], ['nao', 'can'], ['er', 'bai', 'wu'],
];

/** 粤语粗俗字面黑名单（音节级 jyutping 引擎待 M6，不现编） */
const CANTONESE_CHAR_BLACKLIST: readonly string[] = ['撚', '柒', '鳩', '鸠', '屌', '閪'];

/** ④ 历史负面人物（名部分；单字仅收录无歧义者） */
const NEGATIVE_FIGURES: readonly string[] = ['桧', '精卫', '忠贤', '珅'];

/** ④ 品牌商标（名全等于品牌名 → 否决） */
const BRAND_BLACKLIST: readonly string[] = ['华为', '小米', '苹果', '腾讯', '百度', '阿里', '茅台'];

function stripTones(py: string): string {
  return py.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** ③ 默认读音音节序列（ü 已归作 u，与音译通道同口径） */
function syllableSeq(surname: CharMeta | undefined, given: CharMeta[]): string[] {
  const units = surname ? [surname, ...given] : given;
  return units.map(m => stripTones(m.pinyin));
}

function hitHomophone(seq: string[]): string[] {
  const hits: string[] = [];
  for (const banned of HOMOPHONE_BLACKLIST) {
    for (let i = 0; i + banned.length <= seq.length; i++) {
      if (banned.every((s, k) => seq[i + k] === s)) {
        hits.push(banned.join(' '));
        break;
      }
    }
  }
  return hits;
}

/** ⑥ 流行度标注（仅依据语料频次，不随机不过滤） */
function popularityLabel(given: CharMeta[]): string {
  const ranks = given.map(g => g.freqRank).filter((r): r is number => r !== undefined);
  if (ranks.length === 0) return '生僻';
  const best = Math.min(...ranks);
  if (best <= 500) return '常见';
  if (best <= 3000) return '较常见';
  return '少见';
}

/** config 'zhongji' → 81 表层级（numerology 口径：中吉及以上 = 至少半吉） */
function minLevel(): ShuliLevel {
  return HARD_FILTER.wugeMinLevel === 'zhongji' ? '半吉' : '吉';
}

export function applyHardFilters(input: HardFilterInput): HardFilterResult {
  const { surname, given, xiYong, tabooNames } = input;
  const reasons: FilterReason[] = [];

  // ① 喜用契合：字五行 ∈ 忌神 → 否决（不加重忌神）
  if (HARD_FILTER.xiyongFit && xiYong && xiYong.ji.length > 0) {
    for (const g of given) {
      if (xiYong.ji.includes(g.wuxing)) {
        reasons.push({ rule: 'xiyong', detail: `${g.char}（${g.wuxing}）为忌神五行，加重忌神` });
      }
    }
  }

  // ② 数理：五格 81 表查表
  if (surname) {
    const check = checkWuge(
      { surname: [surname.strokeKangxi], given: given.map(g => g.strokeKangxi) },
      minLevel(),
    );
    if (!check.pass) {
      reasons.push({ rule: 'wuge', detail: check.reasons.join('；') });
    }
  }

  // ③ 谐音
  if (HARD_FILTER.homophone) {
    const seq = syllableSeq(surname, given);
    const hits = hitHomophone(seq);
    for (const h of hits) {
      reasons.push({ rule: 'homophone', detail: `谐音命中「${h}」` });
    }
    for (const g of given) {
      if (CANTONESE_CHAR_BLACKLIST.includes(g.char)) {
        reasons.push({ rule: 'homophone', detail: `${g.char} 为粤语粗俗用字` });
      }
    }
  }

  // ④ 避讳：用户长辈名（按字）/ 负面人物 / 品牌
  if (HARD_FILTER.taboo) {
    const givenStr = given.map(g => g.char).join('');
    const givenChars = new Set(givenStr.split(''));
    for (const t of tabooNames ?? []) {
      if ([...t].some(c => givenChars.has(c))) {
        reasons.push({ rule: 'taboo', detail: `避讳「${t}」用字` });
      }
    }
    for (const f of NEGATIVE_FIGURES) {
      if (givenStr === f || (f.length === 1 && givenChars.has(f))) {
        reasons.push({ rule: 'taboo', detail: `历史负面人物「${f}」` });
      }
    }
    for (const b of BRAND_BLACKLIST) {
      if (givenStr === b) {
        reasons.push({ rule: 'taboo', detail: `品牌商标「${b}」` });
      }
    }
  }

  // ⑤ 生僻字：freqRank 缺失视为超限
  if (HARD_FILTER.freqRankMax > 0) {
    for (const g of given) {
      if (g.freqRank === undefined || g.freqRank > HARD_FILTER.freqRankMax) {
        reasons.push({ rule: 'rare', detail: `${g.char} 语料频次排名超限（${g.freqRank ?? '无记录'} > ${HARD_FILTER.freqRankMax}）` });
      }
    }
  }

  return { pass: reasons.length === 0, reasons, popularityLabel: popularityLabel(given) };
}
