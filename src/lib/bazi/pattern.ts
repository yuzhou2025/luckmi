/**
 * src/lib/bazi/pattern.ts
 * 八正格识别（config.PATTERN：仅输出可确定八正格；复杂/从格/化格/专旺 → null）。
 *
 * 取格：以月支本气十神为主格（《子平真诠》“八字用神，专求月令”）。
 * 组合格：看天干透出的相神（杀印相生/食神制杀/伤官佩印/财官双美等）。
 * 月支本气为比劫（建禄/月刃）属变格，不在八正格 → 输出 null。
 * 断语出处仅标《子平真诠》，不编造原文。
 */

import { PATTERN } from './config';
import { getShiShen, GAN_WUXING } from './shishen';
import type { Pillar } from './paipan';

export interface PatternResult {
  name: string;       // 主格，如 七杀格
  sub?: string;       // 组合，如 杀印相生
  source: string;     // 出处书名
}

/** 十神 → 正格名（仅八正格；比劫不入正格） */
const ZHENG_GE: Record<string, string> = {
  正官: '正官格',
  七杀: '七杀格',
  正财: '正财格',
  偏财: '偏财格',
  正印: '正印格',
  偏印: '偏印格',
  食神: '食神格',
  伤官: '伤官格',
};

const SHISHEN_SET = new Set([
  '比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印',
]);

/**
 * 识别格局。不确定/复杂时返回 null（规则：不输出格局，也不写“需人工复核”）。
 */
export function detectPattern(
  dayGan: string,
  pillars: Pick<Pillar, 'gan' | 'canggan' | 'position'>[],
): PatternResult | null {
  if (!PATTERN.enableBazheng || !PATTERN.outputNullWhenUncertain) return null;

  const month = pillars.find(p => p.position === 'month');
  if (!month || month.canggan.length === 0) return null;

  // 月支本气（藏干第一个）
  const benqi = month.canggan[0];
  // 月支藏干为"他柱"口径：与日干同字=比肩（建禄/月刃），不作日主
  const benqiShen = getShiShen(dayGan, benqi, true);
  if (!SHISHEN_SET.has(benqiShen)) return null;

  // 本气为比劫 → 建禄/月刃，属变格，不输出
  if (benqiShen === '比肩' || benqiShen === '劫财') return null;

  const mainGe = ZHENG_GE[benqiShen];
  if (!mainGe) return null;

  // 天干透出十神（年干/月干/时干，日干为日主不算）
  const touTouanShen = pillars
    .filter(p => p.position !== 'day')
    .map(p => getShiShen(dayGan, p.gan, true));

  const has = (names: string[]) => touTouanShen.some(s => names.includes(s));

  let sub: string | undefined;

  switch (mainGe) {
    case '七杀格':
      // 杀印相生：天干透印（正印/偏印）化杀生身
      if (has(['正印', '偏印'])) sub = '杀印相生';
      // 食神制杀：天干透食神制杀（印优先，印透则取杀印相生）
      else if (has(['食神'])) sub = '食神制杀';
      break;
    case '食神格':
      // 食神制杀：天干透七杀
      if (has(['七杀'])) sub = '食神制杀';
      break;
    case '伤官格':
      // 伤官佩印：天干透印制伤
      if (has(['正印', '偏印'])) sub = '伤官佩印';
      // 伤官生财：天干透财
      else if (has(['正财', '偏财'])) sub = '伤官生财';
      break;
    case '正官格':
      // 财官双美：天干透财生官
      if (has(['正财', '偏财'])) sub = '财官双美';
      // 官印相生：天干透印
      else if (has(['正印', '偏印'])) sub = '官印相生';
      break;
    case '偏财格':
    case '正财格':
      // 财生官杀：天干透官杀
      if (has(['正官'])) sub = '财官双美';
      else if (has(['七杀'])) sub = '财滋弱杀';
      break;
    case '正印格':
    case '偏印格':
      // 印格用官：天干透官
      if (has(['正官'])) sub = '官印相生';
      break;
    default:
      break;
  }

  return { name: mainGe, ...(sub ? { sub } : {}), source: '子平真诠' };
}

/** 供测试/调试：日干五行导出（复用 shishen） */
export { GAN_WUXING };
