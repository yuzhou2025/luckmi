/**
 * src/lib/naming/charMeta.ts
 * 汉字元数据类型 + 字库加载（服务端专用）。
 *
 * 数据源：Fate（github.com/babyname/fate, MIT）resources/character.json，
 * 由 Unihan（Unicode 16.0）+ 新华字典 + 人工校对构建（见 fate/data/DATA_SOURCES.md）。
 * 字段映射（导入脚本 scripts/build-char-meta.mjs）：
 *   char          ← char
 *   strokeKangxi  ← kangxi_stroke（五格用：氵=4 辶=7 艹=6，按繁体部首）
 *   strokeSimple  ← simplified_stroke（回退 traditional_stroke）
 *   wuxing        ← wu_xing（喜用过滤核心字段，改动须 PR 说明依据）
 *   radical       ← radical（生肖宜忌用）
 *   nameable      ← nameable
 *   pinyin 系     ← pinyin-pro 构建期推导（derivePhonology，禁止手写映射表）
 *   freqRank / genderPref / styleTags ← Chinese-Names-Corpus + 人工审校（M1-3）
 *
 * 构建产物 data/char-meta/*.json；前端禁止 import 字库（ADR-7），一律走 /api/char-meta。
 */

import fs from 'node:fs';
import path from 'node:path';
import { pinyin } from 'pinyin-pro';

export type WuxingChar = '金' | '木' | '水' | '火' | '土';
export type Tone = 0 | 1 | 2 | 3 | 4;

export interface CharMeta {
  char: string;
  /** 默认读音（pinyin-pro，symbol 形式，如 hào） */
  pinyin: string;
  /** 全部读音（多音字，pinyin-pro multiple:true） */
  pinyinList: string[];
  shengmu: string;
  yunmu: string;
  tone: Tone;
  pingze: '平' | '仄';
  strokeKangxi: number;
  strokeSimple: number;
  wuxing: WuxingChar;
  radical: string;
  /** Fate nameable 标记：是否适合入名 */
  nameable?: boolean;
  /** Fate is_simplified：是否简体字形（候选排名优先） */
  simplified?: boolean;
  /** Fate is_variant：是否异体字（候选排名降权） */
  variant?: boolean;
  freqRank?: number;
  genderPref?: 'm' | 'f' | 'n';
  styleTags?: string[];
  meaning?: string;
}

const WUXING_SET: ReadonlySet<string> = new Set(['金', '木', '水', '火', '土']);

export interface Phonology {
  pinyin: string;
  shengmu: string;
  yunmu: string;
  tone: Tone;
  pingze: '平' | '仄';
}

/**
 * 用 pinyin-pro 推导单字音韵字段（导入脚本与运行时兜底共用）。
 * 零声母字（安/恩等）shengmu 为 ''；轻声/无法识别时 tone=0。
 */
export function derivePhonology(char: string): Phonology {
  const full = pinyin(char, { toneType: 'symbol', type: 'string' });
  const num = pinyin(char, { toneType: 'num', type: 'string' });
  const toneNum = Number(num.match(/(\d)$/)?.[1] ?? 0);
  const normalized = toneNum >= 1 && toneNum <= 4 ? toneNum : 0;
  let shengmu = pinyin(char, { pattern: 'initial', toneType: 'none', type: 'string' });
  if (shengmu === 'none') shengmu = '';
  const yunmu = pinyin(char, { pattern: 'final', toneType: 'none', type: 'string' });
  return {
    pinyin: full,
    shengmu,
    yunmu,
    tone: normalized as Tone,
    pingze: normalized === 1 || normalized === 2 ? '平' : '仄',
  };
}

const DATA_DIR = path.join(process.cwd(), 'data', 'char-meta');
let cache: Map<string, CharMeta> | null = null;

/** 加载构建期生成的字库分片（服务端专用；数据未导入时返回空表，不抛错） */
export function loadCharMeta(): Map<string, CharMeta> {
  if (cache) return cache;
  cache = new Map();
  if (!fs.existsSync(DATA_DIR)) return cache;
  for (const file of fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'))) {
    const rows = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8')) as CharMeta[];
    for (const row of rows) {
      if (!WUXING_SET.has(row.wuxing)) continue;
      cache.set(row.char, row);
    }
  }
  return cache;
}
