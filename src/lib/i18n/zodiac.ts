/**
 * src/lib/i18n/zodiac.ts
 * 十二生肖数据表（v7 §M2：生肖并入排盘主卡）。
 * 年支 → 生肖映射；EN/zh 双语名 + SVG path + 性格简述（双语）。
 * 数据锁定，不随机；扩充须改此文件 + 测试。
 */

export interface ZodiacEntry {
  /** 年支（子/丑/寅...） */
  branch: string;
  /** 生肖汉字 */
  animal: string;
  /** 生肖英文 */
  en: string;
  /** 生肖中文 */
  zh: string;
  /** emoji */
  emoji: string;
  /** SVG path（简化轮廓，viewBox 0 0 64 64） */
  svg: string;
  /** 英文简述 */
  traitsEn: string;
  /** 中文简述 */
  traitsZh: string;
}

export const ZODIAC: readonly ZodiacEntry[] = [
  { branch: '子', animal: '鼠', en: 'Rat', zh: '鼠', emoji: '🐭',
    svg: 'M32 8c-6 0-10 4-10 10 0 4 2 7 5 9-3 2-5 5-5 9v8c0 2 1 4 4 4h12c3 0 4-2 4-4v-8c0-4-2-7-5-9 3-2 5-5 5-9 0-6-4-10-10-10z',
    traitsEn: 'Quick-witted, resourceful, adaptable', traitsZh: '机智灵活，适应力强' },
  { branch: '丑', animal: '牛', en: 'Ox', zh: '牛', emoji: '🐂',
    svg: 'M20 30c-4 0-8 4-8 10v8c0 3 2 5 5 5h30c3 0 5-2 5-5v-8c0-6-4-10-8-10-2-4-6-6-12-6s-10 2-12 6z',
    traitsEn: 'Diligent, dependable, strong', traitsZh: '勤勉踏实，坚韧有力' },
  { branch: '寅', animal: '虎', en: 'Tiger', zh: '虎', emoji: '🐯',
    svg: 'M32 6c-8 0-14 6-14 14 0 6 3 10 7 13-4 3-7 7-7 13v8c0 2 2 4 4 4h20c2 0 4-2 4-4v-8c0-6-3-10-7-13 4-3 7-7 7-13 0-8-6-14-14-14z',
    traitsEn: 'Brave, confident, competitive', traitsZh: '勇敢自信，竞争心强' },
  { branch: '卯', animal: '兔', en: 'Rabbit', zh: '兔', emoji: '🐰',
    svg: 'M22 12c-4 0-6 4-4 8 2 4 6 6 14 6s12-2 14-6c2-4 0-8-4-8-2 4-4 6-10 6s-8-2-10-6z M32 24c-6 0-10 4-10 10v10c0 2 2 4 4 4h12c2 0 4-2 4-4V34c0-6-4-10-10-10z',
    traitsEn: 'Gentle, elegant, alert', traitsZh: '温柔优雅，机敏细心' },
  { branch: '辰', animal: '龙', en: 'Dragon', zh: '龙', emoji: '🐲',
    svg: 'M32 4c-4 0-6 3-6 6-4-2-8 0-8 4 0 2 1 4 3 5-2 2-3 5-3 8v18c0 3 2 5 5 5h18c3 0 5-2 5-5V27c0-3-1-6-3-8 2-1 3-3 3-5 0-4-4-6-8-4 0-3-2-6-6-6z',
    traitsEn: 'Ambitious, charismatic, bold', traitsZh: '雄心勃勃，魅力四射' },
  { branch: '巳', animal: '蛇', en: 'Snake', zh: '蛇', emoji: '🐍',
    svg: 'M32 8c-6 0-10 4-10 10 0 5 3 8 7 10-4 2-7 5-7 10v8c0 2 2 4 4 4h12c2 0 4-2 4-4v-8c0-5 3-8 7-10 4-2 7-5 7-10 0-6-4-10-10-10-2 0-4 0-4 0z',
    traitsEn: 'Wise, intuitive, graceful', traitsZh: '智慧深邃，直觉敏锐' },
  { branch: '午', animal: '马', en: 'Horse', zh: '马', emoji: '🐴',
    svg: 'M16 28c-2 0-4 2-4 4v12c0 2 2 4 4 4h32c2 0 4-2 4-4V32c0-2-2-4-4-4H16z M24 16c-4 0-6 4-4 8 2 4 6 4 12 4s10 0 12-4c2-4 0-8-4-8-2-4-6-4-8-4s-6 0-8 4z',
    traitsEn: 'Energetic, free, sociable', traitsZh: '精力充沛，自由奔放' },
  { branch: '未', animal: '羊', en: 'Goat', zh: '羊', emoji: '🐐',
    svg: 'M20 20c-2 0-4 2-4 4v8c0 2 2 4 4 4-4 0-8 4-8 10v8c0 2 2 4 4 4h32c2 0 4-2 4-4v-8c0-6-4-10-8-10 2 0 4-2 4-4v-8c0-2-2-4-4-4-4 0-8 4-8 8s4 8 8 8h8c4 0 8-4 8-8s-4-8-8-8z',
    traitsEn: 'Gentle, creative, perseverant', traitsZh: '温和善良，富有创意' },
  { branch: '申', animal: '猴', en: 'Monkey', zh: '猴', emoji: '🐵',
    svg: 'M32 8c-8 0-12 6-12 14 0 4 2 7 4 9-4 3-6 7-6 12v8c0 2 2 4 4 4h20c2 0 4-2 4-4v-8c0-5-2-9-6-12 2-2 4-5 4-9 0-8-4-14-12-14z',
    traitsEn: 'Clever, curious, playful', traitsZh: '聪明好奇，活泼好动' },
  { branch: '酉', animal: '鸡', en: 'Rooster', zh: '鸡', emoji: '🐔',
    svg: 'M32 6c-3 0-5 2-5 5 0 2 1 3 2 4-4 1-7 5-7 10v12c0 3 2 5 5 5h10c3 0 5-2 5-5V35c0-5-3-9-7-10 1-1 2-2 2-4 0-3-2-5-5-5z',
    traitsEn: 'Observant, confident, honest', traitsZh: '观察敏锐，自信坦率' },
  { branch: '戌', animal: '狗', en: 'Dog', zh: '狗', emoji: '🐶',
    svg: 'M20 16c-4 0-6 4-4 8 2 4 4 4 8 4v16c0 2 2 4 4 4h12c2 0 4-2 4-4V28c4 0 6 0 8-4 2-4 0-8-4-8-2-4-6-4-8-4h-8c-2 0-6 0-8 4z',
    traitsEn: 'Loyal, brave, responsible', traitsZh: '忠诚勇敢，尽责守信' },
  { branch: '亥', animal: '猪', en: 'Pig', zh: '猪', emoji: '🐷',
    svg: 'M32 10c-6 0-10 4-10 10v4c-4 1-6 5-6 10v12c0 2 2 4 4 4h24c2 0 4-2 4-4V34c0-5-2-9-6-10v-4c0-6-4-10-10-10z',
    traitsEn: 'Kind, generous, content', traitsZh: '善良宽厚，知足常乐' },
];

const ZODIAC_MAP: Record<string, ZodiacEntry> =
  Object.fromEntries(ZODIAC.map(z => [z.branch, z]));

/** 年支 → 生肖（子→鼠，丑→牛...）；未收录返回 null */
export function getZodiac(yearBranch: string): ZodiacEntry | null {
  return ZODIAC_MAP[yearBranch] ?? null;
}
