/**
 * src/lib/reports/life.ts
 * 命理报告数据构建（规则：排盘纯函数延伸；流年走 bazi-engine timeline，禁止手写递推）。
 *
 * 断语口径（规则 13/14）：
 * - 格局断语：getDuanyu('pattern', 格局名, 组合名)；pattern=null → 整卡缺省，不写"需人工复核"
 * - 调候断语：按月支所归四季取《穷通宝鉴》寒暖燥湿条
 * - 旺衰断语：强弱五档映射 身弱/身强/中和，取《三命通会》扶抑条
 * - 无匹配断语 → []（绝不编造）
 */
import type { PaipanResult } from '@/lib/bazi/paipan';
import { getLiunian } from '@/lib/bazi/timeline';
import { getDuanyu } from '@/lib/bazi/duanyu';
import { getZodiac } from '@/lib/i18n/zodiac';
import type {
  LifeReportData, ReportLocale, ReportSubject,
  TiaohouSection, DayunSection,
} from './types';

export interface BuildLifeOptions {
  now?: Date;
  locale?: ReportLocale;
}

/** 月支 → 四季（调候断语匹配键） */
const ZHI_SEASON: Record<string, '春' | '夏' | '秋' | '冬'> = {
  寅: '春', 卯: '春', 辰: '春',
  巳: '夏', 午: '夏', 未: '夏',
  申: '秋', 酉: '秋', 戌: '秋',
  亥: '冬', 子: '冬', 丑: '冬',
};

/** 强弱五档 → 旺衰断语匹配键 */
const STRENGTH_KEY: Record<PaipanResult['strength'], '身弱' | '身强' | '中和'> = {
  极弱: '身弱',
  偏弱: '身弱',
  均衡: '中和',
  偏强: '身强',
  极强: '身强',
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function buildSubject(result: PaipanResult): ReportSubject {
  const ts = result.trueSolarTime;
  const echo = result.inputEcho;
  return {
    gender: echo.gender === 'female' ? 'female' : 'male',
    birth: {
      year: echo.year,
      month: echo.month,
      day: echo.day,
      hour: echo.hour,
      minute: echo.minute,
      calendar: echo.calendar === 'lunar' ? 'lunar' : 'solar',
    },
    trueSolarTime: `${ts.year}-${pad(ts.month)}-${pad(ts.day)} ${pad(ts.hour)}:${pad(ts.minute)}`,
    zodiac: getZodiac(result.pillars.year.zhi),
  };
}

function buildTiaohou(result: PaipanResult): TiaohouSection {
  const season = ZHI_SEASON[result.pillars.month.zhi] ?? '春';
  return {
    gods: result.tiaoHou.gods,
    source: result.tiaoHou.source,
    season,
    duanyu: getDuanyu('tiaohou', season),
  };
}

function buildDayun(result: PaipanResult): DayunSection {
  return {
    qiYun: result.qiYun,
    direction: result.dayunDirection,
    list: result.dayun,
    current: result.dayun.find(d => d.isCurrent) ?? null,
  };
}

/**
 * 构建命理报告数据。纯函数（入参 result + now，输出确定）。
 * 流年快照走 bazi-engine timeline.getLiunian（当前大运覆盖 10 年）。
 */
export async function buildLifeReport(
  result: PaipanResult,
  opts: BuildLifeOptions = {},
): Promise<LifeReportData> {
  const now = opts.now ?? new Date();
  const locale: ReportLocale = opts.locale === 'zh' ? 'zh' : 'en';

  const dayun = buildDayun(result);

  // 流年快照：必须走引擎（规则 4）。
  // 未起运（童限期）dayun.current 为 null 时，取首个有效大运干支供作用关系；
  // getLiunian 内部对未起运/超范围有回退取运逻辑。
  const liunianGanzhi = dayun.current?.ganzhi ?? dayun.list.find(d => d.ganzhi)?.ganzhi;
  const liunian = liunianGanzhi
    ? await getLiunian(result, liunianGanzhi, now)
    : [];

  return {
    meta: {
      kind: 'life',
      generatedAt: now.toISOString(),
      engine: 'bazi-engine',
      locale,
    },
    subject: buildSubject(result),
    chart: {
      pillars: result.pillars,
      dayGan: result.dayGan,
      dayGanWuxing: result.dayGanWuxing,
      relations: result.relations,
    },
    wuxing: {
      score: result.wuxingScore,
      strength: result.strength,
    },
    xiyong: result.xiYong,
    pattern: result.pattern
      ? {
          result: result.pattern,
          duanyu: getDuanyu('pattern', result.pattern.name, result.pattern.sub),
        }
      : { result: null, duanyu: [] },
    tiaohou: buildTiaohou(result),
    strengthDuanyu: getDuanyu('strength', STRENGTH_KEY[result.strength]),
    dayun,
    liunian,
  };
}
