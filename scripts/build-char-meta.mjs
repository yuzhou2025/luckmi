#!/usr/bin/env node
/**
 * scripts/build-char-meta.mjs
 * Fate（github.com/babyname/fate, MIT）resources/character.json → data/char-meta/shard-*.json
 *
 * 数据溯源（fate/data/DATA_SOURCES.md）：character.json 由 Unihan（Unicode 16.0,
 * Unicode License）+ 新华字典（pwxcoo/chinese-xinhua, open data）+ 人工校对构建，
 * 约 12MB，随 Fate 仓库 git 跟踪。v7 diffpatch 中提到的旧版 gua.data 已被该文件取代。
 *
 * 字段映射：
 *   char          ← char
 *   strokeKangxi  ← kangxi_stroke（五格用）
 *   strokeSimple  ← simplified_stroke（缺省回退 traditional_stroke）
 *   wuxing        ← wu_xing（喜用过滤核心字段）
 *   radical       ← radical
 *   nameable      ← nameable（能否入名标记）
 *   meaning       ← meaning（截断 200 字）
 *   pinyin 系     ← pinyin-pro 构建期推导（多音字保留全部读音）
 *
 * 用法：node scripts/build-char-meta.mjs --src fate [--out data/char-meta]
 * 或：npm run build:char-meta
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
// 字频表（vendored）：guo-yong-zhi/CharMap chinese_char_frequency.txt（整理自公开语料字频统计，10029 字）
// 用途：freqRank 排名（候选去生僻/独特性评分基线）。缺文件时构建仍可进行，freqRank 留空。
const FREQ_FILE = path.join(SCRIPT_DIR, 'data', 'char-frequency.txt');

const args = process.argv.slice(2);
const getOpt = (name, def = null) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : def;
};
const SRC = getOpt('src');
const OUT = getOpt('out', path.join(process.cwd(), 'data', 'char-meta'));
const SHARD_SIZE = 4000;

if (!SRC || !fs.existsSync(SRC)) {
  console.error('用法：node scripts/build-char-meta.mjs --src <fate仓库路径> [--out data/char-meta]');
  process.exit(1);
}

let pinyin;
try {
  ({ pinyin } = await import('pinyin-pro'));
} catch {
  console.error('缺少依赖：请先 npm install pinyin-pro');
  process.exit(1);
}

// ── pinyin-pro 推导（与 src/lib/naming/charMeta.ts derivePhonology 保持同一口径） ──
function derivePhonology(char) {
  const symbolList = pinyin(char, { multiple: true, toneType: 'symbol', type: 'array' }) ?? [];
  const full = pinyin(char, { toneType: 'symbol', type: 'string' });
  const num = pinyin(char, { toneType: 'num', type: 'string' });
  const toneNum = Number(num.match(/(\d)$/)?.[1] ?? 0);
  const tone = toneNum >= 1 && toneNum <= 4 ? toneNum : 0;
  let shengmu = pinyin(char, { pattern: 'initial', toneType: 'none', type: 'string' });
  if (shengmu === 'none') shengmu = '';
  const yunmu = pinyin(char, { pattern: 'final', toneType: 'none', type: 'string' });
  return {
    full,
    list: symbolList.length > 0 ? symbolList : [full],
    shengmu,
    yunmu,
    tone,
    pingze: tone === 1 || tone === 2 ? '平' : '仄',
  };
}

const WUXING_SET = new Set(['金', '木', '水', '火', '土']);
const srcFile = path.join(SRC, 'resources', 'character.json');
if (!fs.existsSync(srcFile)) {
  console.error(`未找到 ${srcFile} —— 请确认 fate 仓库完整（resources/character.json 约 12MB）。`);
  process.exit(1);
}

console.error(`读取 ${srcFile} ...`);
const rows = JSON.parse(fs.readFileSync(srcFile, 'utf8'));
console.error(`源记录：${rows.length}`);

// 字频排名：1 = 最高频。语料外字符 freqRank 留空（视为极低频）。
const freqMap = new Map();
if (fs.existsSync(FREQ_FILE)) {
  const lines = fs.readFileSync(FREQ_FILE, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const m = line.trim().match(/^(\S)\s+(\d+)\s*$/);
    if (m && !freqMap.has(m[1])) freqMap.set(m[1], freqMap.size + 1);
  }
  console.error(`字频表：${freqMap.size} 字`);
} else {
  console.error(`警告：未找到 ${FREQ_FILE}，freqRank 将为空（候选排名退化）`);
}

const out = [];
let skipped = 0;
let pinyinMismatch = 0;

for (const row of rows) {
  const ch = row.char;
  if (!ch || [...ch].length !== 1 || !WUXING_SET.has(row.wu_xing)) { skipped++; continue; }
  if (!Number.isFinite(row.kangxi_stroke) || row.kangxi_stroke <= 0) { skipped++; continue; }
  const phon = derivePhonology(ch);
  if (!phon.full || phon.full === 'none') { skipped++; continue; }
  if (Array.isArray(row.pinyin) && row.pinyin.length > 0 && row.pinyin.length !== phon.list.length) {
    pinyinMismatch++; // 仅记录：Fate(Unihan) 与 pinyin-pro 多音字口径差异，M1-3 音律阶段再仲裁
  }
  out.push({
    char: ch,
    pinyin: phon.full,
    pinyinList: phon.list,
    shengmu: phon.shengmu,
    yunmu: phon.yunmu,
    tone: phon.tone,
    pingze: phon.pingze,
    strokeKangxi: row.kangxi_stroke,
    strokeSimple: Number.isFinite(row.simplified_stroke) && row.simplified_stroke > 0
      ? row.simplified_stroke
      : row.traditional_stroke,
    wuxing: row.wu_xing,
    radical: row.radical ?? '',
    nameable: row.nameable === true,
    // is_simplified 字段 Fate 语义为"属于简体字集"（含繁简同形字，所有字均 true），无法区分繁体形式。
    // 改用 simplified_of_char 字段：有值=该字是简体形式（有对应繁体），空=繁体或繁简同形。
    // dute 评分依据此字段对"非简体形式+低频"组合降权（海外输入法可打性）。
    simplified: typeof row.simplified_of_char === 'string' && row.simplified_of_char.length > 0,
    variant: row.is_variant === true,
    freqRank: freqMap.get(ch),
    meaning: typeof row.meaning === 'string' && row.meaning.length > 0
      ? row.meaning.slice(0, 200)
      : undefined,
  });
}

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT).filter(f => f.startsWith('shard-') && f.endsWith('.json'))) {
  fs.unlinkSync(path.join(OUT, f));
}
let shards = 0;
for (let i = 0; i < out.length; i += SHARD_SIZE) {
  const file = path.join(OUT, `shard-${String(shards).padStart(2, '0')}.json`);
  fs.writeFileSync(file, JSON.stringify(out.slice(i, i + SHARD_SIZE)));
  shards++;
}

console.error(`保留 ${out.length} 字 → ${shards} 个分片（每片 ${SHARD_SIZE}）`);
console.error(`跳过 ${skipped} 条（缺笔画/无五行/非单字/无读音）`);
console.error(`Fate 与 pinyin-pro 多音字数量不一致：${pinyinMismatch} 字（已记录，M1-3 仲裁）`);
console.log(`BUILD_OK chars=${out.length} shards=${shards} out=${OUT}`);
