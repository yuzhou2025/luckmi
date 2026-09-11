/**
 * src/lib/bazi/shishen.ts
 * 十神计算 —— 一律以日干（日元）为轴（规则 9），禁止混合年干口径。
 *
 * 十神关系（日干 vs 目标天干）：
 *   同我（同五行）：同阴阳=比肩，异阴阳=劫财
 *   我生：同阴阳=食神，异阴阳=伤官
 *   我克：同阴阳=偏财，异阴阳=正财
 *   克我：同阴阳=七杀(偏官)，异阴阳=正官
 *   生我：同阴阳=偏印，异阴阳=正印
 */

export type ShiShen =
  | '比肩' | '劫财' | '食神' | '伤官' | '偏财' | '正财'
  | '七杀' | '正官' | '偏印' | '正印' | '日主';

const GAN_WUXING: Record<string, '木' | '火' | '土' | '金' | '水'> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
  己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
};

/** 阳干=甲丙戊庚壬，阴干=乙丁己辛癸 */
const YANG_GAN = new Set(['甲', '丙', '戊', '庚', '壬']);

const SHENG: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const KE: Record<string, string> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

/**
 * 以日干为轴，求目标天干的十神。
 * @param dayGan 日干
 * @param targetGan 目标天干（他干或藏干）
 * @param external 目标是否为"他柱/流运"（大运/流年/流月/流日/年月时柱）：
 *   同字时他柱=比肩；仅日柱自身（external=false）返回 '日主'
 * @returns 十神名；targetGan === dayGan 且非他柱时返回 '日主'
 */
export function getShiShen(dayGan: string, targetGan: string, external = false): ShiShen {
  if (targetGan === dayGan) return external ? '比肩' : '日主';

  const wDay = GAN_WUXING[dayGan];
  const wTarget = GAN_WUXING[targetGan];
  const samePolarity =
    YANG_GAN.has(dayGan) === YANG_GAN.has(targetGan); // 同阴阳=true

  // 同五行：比劫
  if (wDay === wTarget) {
    return samePolarity ? '比肩' : '劫财';
  }
  // 我生：食伤
  if (SHENG[wDay] === wTarget) {
    return samePolarity ? '食神' : '伤官';
  }
  // 我克：财
  if (KE[wDay] === wTarget) {
    return samePolarity ? '偏财' : '正财';
  }
  // 克我：官杀
  if (KE[wTarget] === wDay) {
    return samePolarity ? '七杀' : '正官';
  }
  // 生我：印
  if (SHENG[wTarget] === wDay) {
    return samePolarity ? '偏印' : '正印';
  }
  // 理论不可达
  throw new Error(`无法计算十神：日干${dayGan} vs 目标${targetGan}`);
}

/** 十神单字简称（用于大运/流年/流月干支旁注，参考图4：食/才/官/杀/印/枭/劫/比/伤/财） */
export function shishenAbbr(ss: ShiShen): string {
  switch (ss) {
    case '比肩': return '比';
    case '劫财': return '劫';
    case '食神': return '食';
    case '伤官': return '伤';
    case '正财': return '财';
    case '偏财': return '才';
    case '正官': return '官';
    case '七杀': return '杀';
    case '正印': return '印';
    case '偏印': return '枭';
    case '日主': return '主';
  }
}

/**
 * 注：V1.1 模型下十神无独立分数，十神力量 = 对应五行最终得分
 * （见 wuxing.ts / config.WUXING_SCORE），故不再提供十神占比函数。
 */

/** 五行 → 十神分类（用于喜用/格局） */
export const SHISHEN_CATEGORY = {
  比劫: ['比肩', '劫财'],   // 同我（帮身）
  印星: ['正印', '偏印'],   // 生我（生身）
  食伤: ['食神', '伤官'],   // 我生（泄身）
  财星: ['正财', '偏财'],   // 我克（耗身）
  官杀: ['正官', '七杀'],   // 克我（克身）
} as const;

export { GAN_WUXING };
