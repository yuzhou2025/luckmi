/**
 * src/app/components/ui-utils.ts
 * 前端展示工具：干支/十神/纳音 → 五行配色（颜色仅来自五行映射，不随机）。
 */
import { GAN_WUXING, ZHI_WUXING } from '@/lib/bazi/constants';

/** 五行配色（参考图1.2/图3：木绿、火紅、土棕、金橙、水蓝） */
export const WX_COLOR: Record<string, string> = {
  木: '#2f9e5f',
  火: '#d43a2f',
  土: '#9c7638',
  金: '#e08a1e',
  水: '#2f7fd4',
};

export const ganColor = (g: string): string => WX_COLOR[GAN_WUXING[g]] ?? '#333';
export const zhiColor = (z: string): string => WX_COLOR[ZHI_WUXING[z]] ?? '#333';

const SHENG: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const KE: Record<string, string> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

/**
 * 十神 → 所属五行（以日主五行为轴）：
 * 比劫/日主=同我；印=生我者；食伤=我生者；财=我克者；官杀=克我者。
 */
export function shishenWuxing(dayWx: string, ss: string): string {
  if (ss.includes('日主') || ss.includes('女主') || ss.includes('男主') || ss === '比肩' || ss === '劫财') {
    return dayWx;
  }
  if (ss.includes('印')) return Object.entries(SHENG).find(([, v]) => v === dayWx)?.[0] ?? dayWx;
  if (ss.includes('食') || ss.includes('伤')) return SHENG[dayWx];
  if (ss.includes('财')) return KE[dayWx];
  if (ss.includes('官') || ss.includes('杀')) return Object.entries(KE).find(([, v]) => v === dayWx)?.[0] ?? dayWx;
  return dayWx;
}

export const ssColor = (dayWx: string, ss: string): string =>
  WX_COLOR[shishenWuxing(dayWx, ss)] ?? '#666';

/** 纳音配色：取末字五行（大溪水→水蓝、霹雳火→火红） */
export const nayinColor = (nayin: string): string => {
  const last = nayin.trim().slice(-1);
  return WX_COLOR[last] ?? '#8a6d4b';
};
