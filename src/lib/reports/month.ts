/**
 * src/lib/reports/month.ts
 * 月度报告数据构建（骨架：数据结构 + snapshot；渲染层后续里程碑接入）。
 *
 * 口径（规则 4）：
 * - 流年/流月/流日全部走 bazi-engine timeline（getLiunian/getLiuyue/getLiuri）
 * - 流月、流日均以节气为界
 */
import type { PaipanResult } from '@/lib/bazi/paipan';
import { getLiunian, getLiuyue, getLiuri } from '@/lib/bazi/timeline';
import type { MonthReportData, ReportLocale } from './types';
import { buildSubject } from './life';

export interface BuildMonthOptions {
  now?: Date;
  locale?: ReportLocale;
}

/**
 * 构建月度报告。纯函数（result + now 确定输出）。
 */
export async function buildMonthReport(
  result: PaipanResult,
  opts: BuildMonthOptions = {},
): Promise<MonthReportData> {
  const now = opts.now ?? new Date();
  const locale: ReportLocale = opts.locale === 'zh' ? 'zh' : 'en';

  const currentDayun = result.dayun.find(d => d.isCurrent)
    ?? result.dayun.find(d => d.ganzhi)
    ?? null;
  const dayunGanzhi = currentDayun?.ganzhi ?? '';

  // 当前流年
  const liunianAll = dayunGanzhi
    ? await getLiunian(result, dayunGanzhi, now)
    : [];
  const liunian = liunianAll.find(i => i.isCurrent) ?? null;

  // 当前流月（当年 12 节气月中 now 所在月）
  const liuyueAll = liunian?.year
    ? await getLiuyue(result, liunian.year, dayunGanzhi, liunian.ganzhi, now)
    : [];
  const liuyue = liuyueAll.find(i => i.isCurrent) ?? null;

  // 流日（引擎）：now 所在节气月内每日
  const liuri = await getLiuri(result, now);

  return {
    meta: {
      kind: 'month',
      generatedAt: now.toISOString(),
      engine: 'bazi-engine',
      locale,
    },
    subject: buildSubject(result),
    liunian: liunian ? { year: liunian.year!, ganzhi: liunian.ganzhi } : null,
    liuyue,
    liuri,
  };
}
