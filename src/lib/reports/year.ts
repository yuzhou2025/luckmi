/**
 * src/lib/reports/year.ts
 * 流年报告数据构建（骨架：数据结构 + snapshot；渲染层后续里程碑接入）。
 *
 * 口径（规则 4/13）：
 * - 流年/流月全部走 bazi-engine timeline（getLiunian/getLiuyue），禁止手写干支递推
 * - 流月以节气为界（getMonthInGanZhiExact / LiuYue）
 * - 断语仅取流年天干十神义理（《渊海子平》），无匹配 → []
 */
import type { PaipanResult } from '@/lib/bazi/paipan';
import { getLiunian, getLiuyue } from '@/lib/bazi/timeline';
import { getDuanyu } from '@/lib/bazi/duanyu';
import type { YearReportData, ReportLocale } from './types';
import { buildSubject } from './life';

export interface BuildYearOptions {
  now?: Date;
  locale?: ReportLocale;
}

/**
 * 构建流年报告。纯函数（result + now 确定输出）。
 */
export async function buildYearReport(
  result: PaipanResult,
  opts: BuildYearOptions = {},
): Promise<YearReportData> {
  const now = opts.now ?? new Date();
  const locale: ReportLocale = opts.locale === 'zh' ? 'zh' : 'en';

  const currentDayun = result.dayun.find(d => d.isCurrent)
    ?? result.dayun.find(d => d.ganzhi)
    ?? null;
  const dayunGanzhi = currentDayun?.ganzhi ?? '';

  // 流年（引擎）：当前大运覆盖 10 年，取 now 所在流年
  const liunianAll = dayunGanzhi
    ? await getLiunian(result, dayunGanzhi, now)
    : [];
  const liunian = liunianAll.find(i => i.isCurrent) ?? null;

  // 流月（引擎，节气为界）：当年 12 个节气月
  const liuyue = liunian?.year
    ? await getLiuyue(result, liunian.year, dayunGanzhi, liunian.ganzhi, now)
    : [];

  return {
    meta: {
      kind: 'year',
      generatedAt: now.toISOString(),
      engine: 'bazi-engine',
      locale,
    },
    subject: buildSubject(result),
    dayun: currentDayun
      ? {
          ganzhi: currentDayun.ganzhi,
          isCurrent: currentDayun.isCurrent,
          startAge: currentDayun.startAge,
          startYear: currentDayun.startYear,
        }
      : null,
    liunian,
    liuyue,
    duanyu: {
      shishen: liunian ? getDuanyu('shishen', liunian.shishen) : [],
    },
  };
}
