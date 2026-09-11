/**
 * src/lib/bazi/constants.ts
 * 纯数据常量（无逻辑、无依赖）：地支藏干、十二长生地势、干支五行。
 * 与 lunar-javascript 对拍一致（基准盘地势 绝/病/绝/长生 验证通过）。
 */

/** 天干五行 */
export const GAN_WUXING: Record<string, '木' | '火' | '土' | '金' | '水'> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
  己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
};

/** 地支五行 */
export const ZHI_WUXING: Record<string, '木' | '火' | '土' | '金' | '水'> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
  午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水',
};

/** 地支藏干（本气/中气/余气顺序，与 lunar-javascript 一致） */
export const CANGGAN: Record<string, string[]> = {
  子: ['癸'],
  丑: ['己', '癸', '辛'],
  寅: ['甲', '丙', '戊'],
  卯: ['乙'],
  辰: ['戊', '乙', '癸'],
  巳: ['丙', '戊', '庚'],
  午: ['丁', '己'],
  未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'],
  酉: ['辛'],
  戌: ['戊', '辛', '丁'],
  亥: ['壬', '甲'],
};

/** 十二地支序号 */
export const ZHI_ORDER = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/** 十二长生地势顺序 */
export const CHANGSHENG_STATES = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];

const ZHI_IDX: Record<string, number> = Object.fromEntries(ZHI_ORDER.map((z, i) => [z, i]));

/** 阳干长生支序号（甲亥/丙戊寅/庚巳/壬申） */
const YANG_START: Record<string, number> = { 甲: 11, 丙: 2, 戊: 2, 庚: 5, 壬: 8 };
/** 阴干长生支序号（乙午/丁己酉/辛子/癸卯） */
const YIN_START: Record<string, number> = { 乙: 6, 丁: 9, 己: 9, 辛: 0, 癸: 3 };
const YANG_GAN = new Set(['甲', '丙', '戊', '庚', '壬']);

/**
 * 地势（十二长生）：日干在某地支的旺衰状态。
 * 阳干顺行、阴干逆行；与 lunar-javascript getXxxDiShi 对拍一致。
 */
export function getDiShi(dayGan: string, zhi: string): string {
  const yang = YANG_GAN.has(dayGan);
  const start = yang ? YANG_START[dayGan] : YIN_START[dayGan];
  const target = ZHI_IDX[zhi];
  for (let step = 0; step < 12; step++) {
    const idx = yang ? (start + step) % 12 : (start - step + 12) % 12;
    if (idx === target) return CHANGSHENG_STATES[step];
  }
  return '';
}

/** 节气月序号 → 中文月名 */
export const JIEQI_MONTH_LABEL = [
  '正月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '冬月', '腊月',
];

/** 十二节（节气月起点）→ 月支序（寅月起） */
export const JIE_START_NAMES = ['立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪', '小寒'];

/** 五行相生/相克 */
const SHENG5: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const KE5: Record<string, string> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

export type WangXiangState = '旺' | '相' | '休' | '囚' | '死';
export type WangXiangItem = { wuxing: '木' | '火' | '土' | '金' | '水'; state: WangXiangState };

/**
 * 月令旺相休囚死（《渊海子平》四时五行）：
 * 当令者旺、令生者相、生令者休、克令者囚、令克者死。
 * 例：午月（火当令）→ 火旺、土相、木休、水囚、金死。
 */
export function getWangXiang(monthZhi: string): WangXiangItem[] {
  const w = ZHI_WUXING[monthZhi];
  const shengWo = Object.entries(SHENG5).find(([, v]) => v === w)![0];
  const keWo = Object.entries(KE5).find(([, v]) => v === w)![0];
  return [
    { wuxing: w as WangXiangItem['wuxing'], state: '旺' },
    { wuxing: SHENG5[w] as WangXiangItem['wuxing'], state: '相' },
    { wuxing: shengWo as WangXiangItem['wuxing'], state: '休' },
    { wuxing: keWo as WangXiangItem['wuxing'], state: '囚' },
    { wuxing: KE5[w] as WangXiangItem['wuxing'], state: '死' },
  ];
}
