/**
 * src/lib/bazi/dayun.ts
 * 大运 —— 全部走 lunar-javascript（bazi-engine），禁止手写干支递推（规则 4）。
 *
 * 顺逆：阳年男/阴年女顺排，阴年男/阳年女逆排（引擎 getYun 处理）。
 * 起运岁数/年份由引擎按出生距节气天数精确计算。
 * 当前大运高亮：注入 now（默认当前时间）。
 */

import type { PaipanResult } from './paipan';

export interface DayunEntry {
  index: number;        // 第几步大运（从 1 起，不含童限）
  ganzhi: string;
  gan: string;
  zhi: string;
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;
  isCurrent: boolean;
}

export interface DayunResult {
  /** 起运岁数（虚岁） */
  startAge: number;
  /** 起运公历年 */
  startYear: number;
  /** 起运公历日期 YYYY-MM-DD（引擎 lunar-javascript 计算） */
  startSolar: string;
  /** 童限（起运前）：岁数区间与出生年，无干支 */
  preYun: { startAge: number; endAge: number; year: number };
  /** 顺排 / 逆排 */
  direction: '顺排' | '逆排';
  dayun: DayunEntry[];
}

let _lunar: typeof import('lunar-javascript') | null = null;
async function getLunar() {
  if (!_lunar) _lunar = await import('lunar-javascript');
  return _lunar;
}

/**
 * 计算大运。
 * @param result 排盘结果（取真太阳时出生时间 + 性别 + 年干阴阳）
 * @param now 当前时间（默认 new Date()），用于高亮当前大运
 */
export async function getDayun(
  result: Pick<PaipanResult, 'trueSolarTime' | 'inputEcho' | 'pillars'>,
  now: Date = new Date(),
): Promise<DayunResult> {
  const lj = await getLunar();
  const ts = result.trueSolarTime;
  const solar = lj.Solar.fromYmdHms(ts.year, ts.month, ts.day, ts.hour, ts.minute, 0);
  const bazi = solar.getLunar().getEightChar();

  // lunar getYun：1=男，0=女
  const genderCode = result.inputEcho.gender === 'male' ? 1 : 0;
  const yun = bazi.getYun(genderCode);

  // 年干阴阳 + 性别 → 顺逆（仅用于标注，实际排列由引擎完成）
  const yearGan = result.pillars.year.gan;
  const yangGan = new Set(['甲', '丙', '戊', '庚', '壬']);
  const yearYang = yangGan.has(yearGan);
  const male = result.inputEcho.gender === 'male';
  const forward = male ? yearYang : !yearYang; // 阳男阴女顺
  const direction: '顺排' | '逆排' = forward ? '顺排' : '逆排';

  const nowYear = now.getFullYear();
  const rawDayuns = yun.getDaYun();

  // 起运公历日期（引擎：出生时间 + 起运年/月/日）
  const startSolar = typeof yun.getStartSolar === 'function'
    ? yun.getStartSolar().toYmd()
    : '';

  // 第 0 步为童限（ganzhi 为空）：记录岁数区间，干支留空
  const tongxian = rawDayuns[0];
  const firstReal = rawDayuns.find((d: any) => d.getGanZhi());
  const preYun = {
    startAge: tongxian.getStartAge(),
    endAge: firstReal ? firstReal.getStartAge() - 1 : tongxian.getEndAge(),
    year: ts.year,
  };

  const dayun: DayunEntry[] = [];
  let idx = 0;
  for (const dy of rawDayuns) {
    const ganzhi = dy.getGanZhi();
    // 第 0 步为童限（ganzhi 为空），跳过
    if (!ganzhi) continue;
    idx += 1;
    const startYear = dy.getStartYear();
    const endYear = dy.getEndYear();
    dayun.push({
      index: idx,
      ganzhi,
      gan: ganzhi[0],
      zhi: ganzhi[1],
      startAge: dy.getStartAge(),
      endAge: dy.getEndAge(),
      startYear,
      endYear,
      isCurrent: nowYear >= startYear && nowYear <= endYear,
    });
  }

  return {
    startAge: yun.getStartYear(), // 起运岁数（lunar 以年计）
    startYear: ts.year + yun.getStartYear(),
    startSolar,
    preYun,
    direction,
    dayun,
  };
}
