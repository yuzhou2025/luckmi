/**
 * src/lib/bazi/timeline.ts
 * 流年 / 流月 / 流日时间轴 —— 全部走 lunar-javascript（规则 4，禁止手写干支递推）。
 * 流月以节气为界（getMonthInGanZhiExact / LiuYue）。
 * 每项含：干支、十神（日干为轴）、藏干、地势、自坐、与大运/本命作用关系。
 * 当前项高亮：注入 now。
 */

import { getShiShen, shishenAbbr } from './shishen';
import { CANGGAN, getDiShi, JIE_START_NAMES } from './constants';
import { analyzeRelations } from '@/lib/shensha/guaxiang';
import type { GanZhiRelation, PaipanResult } from './paipan';
import { JIEQI_MONTH_LABEL } from './constants';

export type TimelineScope = 'dayun' | 'liunian' | 'liuyue' | 'liuri';

export interface TimelineItem {
  scope: TimelineScope;
  /** 展示标签：流年=公历年，流月=七月，流日=M/D */
  label: string;
  ganzhi: string;
  gan: string;
  zhi: string;
  shishen: string;       // 天干十神（日干为轴）
  canggan: string[];
  zhishen: string[];     // 支神（藏干对日干的十神）
  dishi: string;         // 地势（日干在该支的十二长生）
  zizuo: string;         // 自坐（柱天干在柱地支的十二长生）
  ganAbbr: string;       // 天干十神单字（食/才/官/杀…）
  zhiAbbr: string;       // 地支本气十神单字
  isCurrent: boolean;
  relations: GanZhiRelation[]; // 与本命/上级时间柱的作用关系
  /** 流年：公历年份 */
  year?: number;
  /** 流年/大运：虚岁 */
  age?: number;
  /** 流月：节气起点公历日期，如 "8.7" */
  jieqiDate?: string;
  /** 流月：节气名，如 "立秋" */
  jieqiName?: string;
  /** 流月：月名，如 "七月" */
  monthLabel?: string;
}

interface BuildExtra {
  age?: number;
  year?: number;
  jieqiDate?: string;
  jieqiName?: string;
  monthLabel?: string;
}

let _lunar: typeof import('lunar-javascript') | null = null;
async function getLunar() {
  if (!_lunar) _lunar = await import('lunar-javascript');
  return _lunar;
}

/** 为一个时间干支构造完整 TimelineItem */
function buildItem(
  scope: TimelineScope,
  label: string,
  gan: string,
  zhi: string,
  dayGan: string,
  basePillars: { position: string; gan: string; zhi: string }[],
  isCurrent: boolean,
  extra: BuildExtra = {},
): TimelineItem {
  const ganzhi = gan + zhi;
  const canggan = CANGGAN[zhi] ?? [];
  const withSelf = [...basePillars, { position: scope, gan, zhi }];
  const allRels = analyzeRelations(withSelf);
  const relations = allRels.filter(
    r => r.fromPosition === scope || r.toPosition === scope,
  );

  // 流运柱（大运/流年/流月/流日）皆为他柱：同字按比肩论，不作日主
  const ganShiShen = getShiShen(dayGan, gan, true);
  const benqiShiShen = getShiShen(dayGan, canggan[0], true);

  return {
    scope,
    label,
    ganzhi,
    gan,
    zhi,
    shishen: ganShiShen,
    canggan,
    zhishen: canggan.map(cg => getShiShen(dayGan, cg, true)),
    dishi: getDiShi(dayGan, zhi),
    zizuo: getDiShi(gan, zhi),
    ganAbbr: shishenAbbr(ganShiShen),
    zhiAbbr: shishenAbbr(benqiShiShen),
    isCurrent,
    relations,
    ...extra,
  };
}

// ── 大运（复用 dayun 结果，转 TimelineItem）─────────────

export function dayunToItems(
  dayGan: string,
  pillars: PaipanResult['pillars'],
  dayun: { ganzhi: string; isCurrent: boolean; startAge: number; startYear: number }[],
): TimelineItem[] {
  const base = toBasePillars(pillars);
  return dayun.map(d =>
    buildItem('dayun', `${d.startAge}岁`, d.ganzhi[0], d.ganzhi[1], dayGan, base, d.isCurrent,
      { age: d.startAge, year: d.startYear }),
  );
}

function toBasePillars(pillars: PaipanResult['pillars']) {
  return (['year', 'month', 'day', 'hour'] as const).map(pos => ({
    position: pos,
    gan: pillars[pos].gan,
    zhi: pillars[pos].zhi,
  }));
}

// ── 流年 ────────────────────────────────────────────────

/**
 * 流年时间轴（当前大运覆盖的 10 年）。
 * @param dayunGanzhi 当前大运干支（用于作用关系）
 */
export async function getLiunian(
  result: Pick<PaipanResult, 'trueSolarTime' | 'inputEcho' | 'pillars' | 'dayGan'>,
  dayunGanzhi: string,
  now: Date = new Date(),
): Promise<TimelineItem[]> {
  const lj = await getLunar();
  const ts = result.trueSolarTime;
  const solar = lj.Solar.fromYmdHms(ts.year, ts.month, ts.day, ts.hour, ts.minute, 0);
  const bazi = solar.getLunar().getEightChar();
  const genderCode = result.inputEcho.gender === 'male' ? 1 : 0;
  const dayuns = bazi.getYun(genderCode).getDaYun();

  // 当前流年的节气年干支（立春为界）
  const nowLunar = lj.Solar.fromYmdHms(now.getFullYear(), now.getMonth() + 1, now.getDate(), 12, 0, 0).getLunar();
  const currentYearGZ = nowLunar.getYearInGanZhiExact();

  const base = toBasePillars(result.pillars);
  const items: TimelineItem[] = [];

  // 找到 nowYear 所在大运，返回该运覆盖的流年（10 年）
  let currentDy: any = null;
  for (const dy of dayuns) {
    if (!dy.getGanZhi()) continue;
    const sy = dy.getStartYear();
    const ey = dy.getEndYear();
    if (now.getFullYear() >= sy && now.getFullYear() <= ey) {
      currentDy = dy;
      break;
    }
  }
  // 若尚未起运/超出范围，退而取第一个有效大运
  if (!currentDy) {
    currentDy = dayuns.find((dy: any) => dy.getGanZhi());
  }
  if (!currentDy) return items;

  for (const ln of currentDy.getLiuNian()) {
    const gz = ln.getGanZhi();
    if (!gz) continue;
    const isCurrent = gz === currentYearGZ;
    const liuYear = ln.getYear();
    const age = liuYear - ts.year + 1; // 虚岁
    // 作用关系：本命四柱 + 当前大运
    const withDayun = [...base, { position: 'dayun', gan: dayunGanzhi[0], zhi: dayunGanzhi[1] }];
    items.push(buildItem('liunian', `${liuYear}`, gz[0], gz[1], result.dayGan, withDayun, isCurrent,
      { year: liuYear, age }));
  }
  return items;
}

// ── 流月 ────────────────────────────────────────────────

/**
 * 流月时间轴（指定流年的 12 个节气月）—— 走引擎 LiuNian.getLiuYue()。
 * @param year 公历流年
 */
export async function getLiuyue(
  result: Pick<PaipanResult, 'trueSolarTime' | 'inputEcho' | 'dayGan' | 'pillars'>,
  year: number,
  dayunGanzhi: string,
  liunianGanzhi: string,
  now: Date = new Date(),
): Promise<TimelineItem[]> {
  const lj = await getLunar();
  const ts = result.trueSolarTime;
  const solar = lj.Solar.fromYmdHms(ts.year, ts.month, ts.day, ts.hour, ts.minute, 0);
  const bazi = solar.getLunar().getEightChar();
  const genderCode = result.inputEcho.gender === 'male' ? 1 : 0;
  const dayuns = bazi.getYun(genderCode).getDaYun();

  // 找到目标年的 LiuNian 对象
  let targetLiuNian: any = null;
  for (const dy of dayuns) {
    if (!dy.getGanZhi()) continue;
    for (const ln of dy.getLiuNian()) {
      if (ln.getYear() === year) { targetLiuNian = ln; break; }
    }
    if (targetLiuNian) break;
  }
  if (!targetLiuNian) return [];

  // 当前节气月干支（以节气为界）
  const nowLunar = lj.Solar.fromYmdHms(now.getFullYear(), now.getMonth() + 1, now.getDate(), 12, 0, 0).getLunar();
  const currentMonthGZ = nowLunar.getMonthInGanZhiExact();

  const base = toBasePillars(result.pillars);
  const withUpper = [
    ...base,
    { position: 'dayun', gan: dayunGanzhi[0], zhi: dayunGanzhi[1] },
    { position: 'liunian', gan: liunianGanzhi[0], zhi: liunianGanzhi[1] },
  ];

  // 该流年农历年的节气表（取年中日期构造，覆盖立春至次年立春前的十二节）
  const jieqiTable = lj.Solar.fromYmdHms(year, 6, 15, 12, 0, 0)
    .getLunar().getJieQiTable();

  const items: TimelineItem[] = [];
  const liuYue = targetLiuNian.getLiuYue(); // 12 个节气月（寅月起）
  for (let i = 0; i < liuYue.length; i++) {
    const m = liuYue[i];
    const gz = m.getGanZhi();
    const monthLabel = JIEQI_MONTH_LABEL[i] ?? `${i + 1}月`;
    // 该节气月的起点节气（十二节：立春/惊蛰/…/小寒）与公历日期
    const jieqiName = JIE_START_NAMES[i] ?? '';
    const jieSolar = jieqiTable[jieqiName];
    const jieqiDate = jieSolar ? `${jieSolar.getMonth()}.${jieSolar.getDay()}` : '';
    const isCurrent = gz === currentMonthGZ && now.getFullYear() === year;
    items.push(buildItem('liuyue', monthLabel, gz[0], gz[1], result.dayGan, withUpper, isCurrent,
      { jieqiDate, jieqiName, monthLabel }));
  }
  return items;
}

// ── 流日 ────────────────────────────────────────────────

/**
 * 流日时间轴：now 所在节气月内的每日（按节气为界）。
 */
export async function getLiuri(
  result: Pick<PaipanResult, 'dayGan' | 'pillars'>,
  now: Date = new Date(),
): Promise<TimelineItem[]> {
  const lj = await getLunar();
  const nowY = now.getFullYear();
  const nowM = now.getMonth() + 1;
  const nowD = now.getDate();

  const nowLunar = lj.Solar.fromYmdHms(nowY, nowM, nowD, 12, 0, 0).getLunar();
  const currentMonthGZ = nowLunar.getMonthInGanZhiExact();
  const currentDayGZ = nowLunar.getDayInGanZhi();

  const base = toBasePillars(result.pillars);

  // 统一用本地公历日期（lunar Solar.fromYmdHms 为日期字面量，与时区无关）
  const monthGZof = (d: Date) =>
    lj.Solar.fromYmdHms(d.getFullYear(), d.getMonth() + 1, d.getDate(), 12, 0, 0)
      .getLunar().getMonthInGanZhiExact();
  const dayGZof = (d: Date) =>
    lj.Solar.fromYmdHms(d.getFullYear(), d.getMonth() + 1, d.getDate(), 12, 0, 0)
      .getLunar().getDayInGanZhi();

  // 向前回扫到节气月起点（月干支变化前一天）
  let start = new Date(nowY, nowM - 1, nowD);
  for (let i = 0; i < 40; i++) {
    const prev = new Date(start.getFullYear(), start.getMonth(), start.getDate() - 1);
    if (monthGZof(prev) === currentMonthGZ) start = prev;
    else break;
  }
  // 向后扫描到节气月末点
  let end = new Date(nowY, nowM - 1, nowD);
  for (let i = 0; i < 40; i++) {
    const next = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1);
    if (monthGZof(next) === currentMonthGZ) end = next;
    else break;
  }

  const items: TimelineItem[] = [];
  for (let d = new Date(start); d.getTime() <= end.getTime(); d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    const gz = dayGZof(d);
    const isCurrent =
      gz === currentDayGZ &&
      d.getFullYear() === nowY &&
      d.getMonth() + 1 === nowM &&
      d.getDate() === nowD;
    items.push(
      buildItem('liuri', `${d.getMonth() + 1}/${d.getDate()}`, gz[0], gz[1], result.dayGan, base, isCurrent),
    );
  }
  return items;
}
