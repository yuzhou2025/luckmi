/**
 * i18n 组件未翻译中文硬编码扫描
 * 扫描 src/app/[locale]/components/*.tsx 与 HomeClient.tsx，检测
 * 直接渲染中文文本而未经 t() / termT() 翻译的**展示型**字符串。
 *
 * 检测范围（仅展示型文本）：
 *   1. JSX 文本节点：>中文<
 *   2. 展示型属性：aria-label / title / alt / placeholder 中的中文字面量
 *
 * 不检测（允许中文残留）：
 *   - 注释、import/export
 *   - 对象属性值（{ wx: '火' }）— 命理符号化数据，匹配引擎输出
 *   - 比较表达式（=== '白'）— 数据匹配，非展示
 *   - 数组数据（['七杀', '正官']）— 经 termT() 在渲染处翻译
 *   - 天干/地支/纳音/甲子等符号标识符
 *   - className / key / id / d(SVG path) 等非展示属性
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const COMPONENTS_DIR = path.resolve(__dirname, '../../src/app/[locale]');
const COMPONENTS_SUB = path.join(COMPONENTS_DIR, 'components');

/** 收集目录下所有 .tsx 文件 */
function collectTsx(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectTsx(full));
    else if (entry.name.endsWith('.tsx')) out.push(full);
  }
  return out;
}

const CJK = /[\u4e00-\u9fff]/;

/** 展示型属性名（其值会渲染给用户看/听） */
const DISPLAY_PROPS = /(?:aria-label|title|alt|placeholder|label)\s*=\s*["'`]([^"'`]*[\u4e00-\u9fff][^"'`]*)["'`]/g;

/**
 * 从一行代码中提取"被直接渲染的中文展示文本"。
 * 仅检测 JSX 文本节点与展示型属性，不检测数据结构/比较/非展示属性。
 */
function findHardcodedChinese(line: string): string[] {
  // 去除注释
  const noComment = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
  if (!CJK.test(noComment)) return [];

  const hits: string[] = [];

  // 1. 展示型属性中的中文字面量（aria-label="中文" 等）
  for (const m of noComment.matchAll(DISPLAY_PROPS)) {
    const literal = m[1];
    // 排除：t()/termT() 调用本身的参数（{t('x')} 形式不会是字面量，但防御性检查）
    hits.push(literal.trim());
  }

  // 2. JSX 文本节点 >中文< （排除表达式容器 {} 内的内容）
  // 先移除所有 {...} 表达式容器，避免把 {termT('七杀')} 里的中文误判
  const noExpr = noComment.replace(/\{[^{}]*\}/g, '');
  for (const m of noExpr.matchAll(/>\s*([\u4e00-\u9fff][\u4e00-\u9fff\w\s·、，：；。·\-—…（）【】《》]+)/g)) {
    const text = m[1].trim();
    if (text) hits.push(text);
  }

  return hits;
}

describe('i18n: 组件无中文硬编码', () => {
  const files = [
    ...collectTsx(COMPONENTS_SUB),
    path.join(COMPONENTS_DIR, 'HomeClient.tsx'),
  ].filter(f => fs.existsSync(f));

  it('待扫描的组件文件存在', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    const rel = path.relative(COMPONENTS_DIR, file);
    it(`${rel} 无未翻译中文展示文本`, () => {
      const src = fs.readFileSync(file, 'utf8').split('\n');
      const offenders: { line: number; text: string }[] = [];
      src.forEach((line, i) => {
        const hits = findHardcodedChinese(line);
        if (hits.length) offenders.push(...hits.map(text => ({ line: i + 1, text })));
      });
      if (offenders.length) {
        const msg = offenders.map(o => `  L${o.line}: "${o.text}"`).join('\n');
        throw new Error(`\n${msg}\n（展示型文本应使用 t() / termT() 包裹）`);
      }
      expect(offenders).toEqual([]);
    });
  }
});
