/**
 * src/lib/naming/numerology.ts
 * 五格剖象法 + 81 数理吉凶表（M1-2）。
 *
 * 口径锁定（单一来源，改动须跑 tests/naming/numerology.test.ts 快照并说明依据）：
 * - 笔画一律用康熙笔画（CharMeta.strokeKangxi：氵=4 辶=7 艹=6，按繁体部首）
 * - 81 数理表采用通行版（吉34 / 半吉18 / 凶29），仅查表展示，不生成不改写
 * - 数按 81 循环取余（0/81/162 → 81）
 * - 三才五行按 天/人/地 格个位取：1,2木 3,4火 5,6土 7,8金 9,0水
 * - checkWuge 过滤口径（对应 config.HARD_FILTER.wugeMinLevel='zhongji'）：
 *   人格、总格 ≥ 半吉，且地格、外格不为凶
 */

export type ShuliLevel = '吉' | '半吉' | '凶';
export type Wuxing5 = '金' | '木' | '水' | '火' | '土';

export interface ShuliEntry {
  n: number;
  level: ShuliLevel;
  phrase: string;
}

type RawEntry = readonly [ShuliLevel, string];

const RAW: readonly RawEntry[] = [
  ['吉', '万物开泰'], ['凶', '混沌未开'], ['吉', '天地人和'], ['凶', '待于生发'],
  ['吉', '循环相生'], ['吉', '安稳余庆'], ['吉', '刚健果断'], ['吉', '意志坚强'],
  ['凶', '大成之数'], ['凶', '万事终局'], ['吉', '早苗逢雨'], ['凶', '意志薄弱'],
  ['吉', '智略超群'], ['凶', '家庭缘薄'], ['吉', '福寿共照'], ['吉', '贵人相助'],
  ['吉', '突破万难'], ['吉', '有志竟成'], ['凶', '遮云蔽月'], ['凶', '非业破运'],
  ['吉', '明月中天'], ['凶', '秋草逢霜'], ['吉', '旭日东升'], ['吉', '家门余庆'],
  ['吉', '资性英敏'], ['凶', '波澜重叠'], ['凶', '欲望无止'], ['凶', '遭难之数'],
  ['吉', '智谋优秀'], ['半吉', '绝处逢生'], ['吉', '智勇得志'], ['吉', '侥幸多望'],
  ['吉', '旭日升天'], ['凶', '破家亡身'], ['吉', '温和平安'], ['凶', '波澜万丈'],
  ['吉', '权威显达'], ['半吉', '磨铁成针'], ['吉', '富贵荣华'], ['半吉', '谨慎保安'],
  ['吉', '德望高大'], ['半吉', '寒蝉在柳'], ['半吉', '雨夜之花'], ['凶', '愁眉难展'],
  ['吉', '新生泰和'], ['凶', '载宝沉舟'], ['吉', '开花结果'], ['吉', '青松立鹤'],
  ['半吉', '吉凶参半'], ['半吉', '小舟入海'], ['半吉', '盛衰交加'], ['吉', '先见之明'],
  ['半吉', '外祥内苦'], ['凶', '多难悲运'], ['半吉', '先盛后衰'], ['凶', '浪里行舟'],
  ['吉', '寒雪青松'], ['半吉', '先苦后甘'], ['凶', '寒蝉悲风'], ['凶', '无谋之数'],
  ['半吉', '名利双收'], ['凶', '衰败之数'], ['吉', '万物化育'], ['凶', '骨肉分离'],
  ['吉', '富贵长寿'], ['凶', '内外不和'], ['吉', '天赋幸运'], ['吉', '智虑周密'],
  ['凶', '非业之数'], ['凶', '残菊经霜'], ['半吉', '养神耐劳'], ['半吉', '未雨绸缪'],
  ['半吉', '志高力微'], ['凶', '残花经春'], ['半吉', '退安可守'], ['凶', '倾覆之数'],
  ['半吉', '乐天知命'], ['半吉', '宜守不宜进'], ['凶', '挽回乏力'], ['凶', '遁世之数'],
  ['吉', '还本归元'],
];

export const SHULI_TABLE: readonly ShuliEntry[] =
  RAW.map(([level, phrase], i) => ({ n: i + 1, level, phrase }));

const LEVEL_RANK: Record<ShuliLevel, number> = { 凶: 0, 半吉: 1, 吉: 2 };

/** 查表：n 按 81 循环（0 → 81），禁止表外自造 */
export function getShuli(n: number): ShuliEntry {
  const idx = (((n - 1) % 81) + 81) % 81;
  return SHULI_TABLE[idx];
}

// 下标 = 数个位（n%10）：0→水, 1,2→木, 3,4→火, 5,6→土, 7,8→金, 9→水
const GE_WUXING: readonly Wuxing5[] = ['水', '木', '木', '火', '火', '土', '土', '金', '金', '水'];

function geToWuxing(n: number): Wuxing5 {
  return GE_WUXING[((n % 10) + 10) % 10];
}

export interface WugeInput {
  /** 姓氏各字康熙笔画（复姓传两字） */
  surname: number[];
  /** 名各字康熙笔画 */
  given: number[];
}

export interface WugeResult {
  tian: number;
  ren: number;
  di: number;
  wai: number;
  zong: number;
  entries: {
    tian: ShuliEntry;
    ren: ShuliEntry;
    di: ShuliEntry;
    wai: ShuliEntry;
    zong: ShuliEntry;
  };
  sancai: [Wuxing5, Wuxing5, Wuxing5];
}

/** 五格计算（康熙笔画入参，五格剖象法标准公式） */
export function calcWuge(input: WugeInput): WugeResult {
  const { surname, given } = input;
  if (surname.length < 1 || given.length < 1) {
    throw new Error('wuge: surname/given 至少各一字');
  }
  const sum = (arr: number[]) => arr.reduce((s, v) => s + v, 0);

  const tian = surname.length === 1 ? surname[0] + 1 : surname[0] + surname[1];
  const ren = surname[surname.length - 1] + given[0];
  const di = given.length === 1 ? given[0] + 1 : sum(given);
  let wai: number;
  if (surname.length === 1 && given.length === 1) wai = 2;
  else if (surname.length === 1) wai = given[given.length - 1] + 1;
  else if (given.length === 1) wai = surname[0] + 1;
  else wai = surname[0] + given[given.length - 1];
  const zong = sum(surname) + sum(given);

  return {
    tian, ren, di, wai, zong,
    entries: {
      tian: getShuli(tian),
      ren: getShuli(ren),
      di: getShuli(di),
      wai: getShuli(wai),
      zong: getShuli(zong),
    },
    sancai: [geToWuxing(tian), geToWuxing(ren), geToWuxing(di)],
  };
}

export interface WugeCheck {
  pass: boolean;
  reasons: string[];
}

/**
 * 数理硬过滤（minLevel 默认 半吉，对应 config 'zhongji' 口径）。
 *
 * 单名（given.length === 1）口径：外格不成立（公式恒=2，命理信息不足），
 * 跳过外格检查，流派口径依据见文件头注释；地格仍按原口径（名+1 仍有意义）。
 */
export function checkWuge(input: WugeInput, minLevel: ShuliLevel = '半吉'): WugeCheck {
  const wuge = calcWuge(input);
  const min = LEVEL_RANK[minLevel];
  const reasons: string[] = [];

  const strict: Array<[string, number, ShuliEntry]> = [
    ['人格', wuge.ren, wuge.entries.ren],
    ['总格', wuge.zong, wuge.entries.zong],
  ];
  for (const [name, n, entry] of strict) {
    if (LEVEL_RANK[entry.level] < min) {
      reasons.push(`${name}${n}（${entry.level}·${entry.phrase}）低于${minLevel}`);
    }
  }
  const loose: Array<[string, number, ShuliEntry]> = [
    ['地格', wuge.di, wuge.entries.di],
  ];
  // 单名外格不成立（流派口径）：跳过；复名仍查
  if (input.given.length > 1) {
    loose.push(['外格', wuge.wai, wuge.entries.wai]);
  }
  for (const [name, n, entry] of loose) {
    if (entry.level === '凶') {
      reasons.push(`${name}${n}（凶·${entry.phrase}）`);
    }
  }
  return { pass: reasons.length === 0, reasons };
}
