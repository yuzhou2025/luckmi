/**
 * src/lib/bazi/paipan.ts
 * 纯函数排盘（规则 3）。
 *
 * 入参 {y,m,d,h,min,gender,lon,lat,calendar,timezone,solarTime}
 * 出参 {pillars, strength, xiYongShen, wuxingScore, pattern, dayun, relations}
 *
 * 流程：
 *   1. 本地时间 → 东八区真太阳时（solarTime.ts，规则 6）
 *   2. 真太阳时 → lunar-javascript 排四柱
 *   3. 提取：天干/地支/藏干/十神/纳音/空亡/地势/自坐
 *   4. 神煞/干支关系/五行/格局/大运在后续步骤接入
 */

import { toTrueSolarTime } from '@/lib/astronomy/solarTime';
import { getDiShi, getWangXiang } from '@/lib/bazi/constants';
import type { WangXiangItem } from '@/lib/bazi/constants';

// ── lunar-javascript 动态引入 ────────────────────────────
let _lunar: typeof import('lunar-javascript') | null = null;
async function getLunar() {
  if (!_lunar) _lunar = await import('lunar-javascript');
  return _lunar;
}

// ── 类型定义 ────────────────────────────────────────────

export interface PaipanInput {
  year: number;
  month: number;       // 1-12
  day: number;
  hour: number;        // 0-23
  minute: number;      // 0-59
  gender: 'male' | 'female';
  /** 'solar'=公历, 'lunar'=农历 */
  calendar: 'solar' | 'lunar';
  /** 闰月标记，仅 lunar 模式有效。true=该月为闰月 */
  lunarLeap?: boolean;
  /** 出生地经度（东正西负） */
  lon?: number;
  /** 出生地纬度 */
  lat?: number;
  /** IANA 时区名 */
  timezone?: string;
  /** 是否转真太阳时，默认 true（规则 6） */
  solarTime?: boolean;
  /** 当前时间（用于大运/流年高亮），默认 new Date() */
  now?: Date;
}

export interface ShenSha {
  name: string;
  level: '大' | '小' | null;  // 大=年干/年支查, 小=日干/日支查, null=月支/日柱类
  source: '年干' | '日干' | '年支' | '日支' | '月支' | '日柱';
}

export interface Pillar {
  position: 'year' | 'month' | 'day' | 'hour';
  gan: string;          // 天干
  zhi: string;          // 地支
  canggan: string[];    // 藏干
  shishen: string;      // 干神（天干对日干的十神；日柱=日主/女主）
  zhishen: string[];    // 支神（地支各藏干对日干的十神）
  nayin: string;        // 纳音
  kongwang: string[];   // 空亡（两个地支）
  dishi: string;        // 地势（日干在该柱地支的十二长生）
  zizuo: string;        // 自坐（柱天干在柱地支的十二长生，如 乙卯→临官）
  shensha: ShenSha[];    // 神煞（后续步骤填充）
}

export interface GanZhiRelation {
  kind: '天干' | '地支';
  /** 关系大类。泄/耗为生克的反向有向解读，不重复输出 */
  type: '合' | '冲' | '生' | '克' | '刑' | '破' | '害';
  /** 关系明细：天干五合/天干相冲/天干相生/天干相克/六合/三合/半合/拱合/三会/六冲/三刑/相刑/自刑/相破/相害/暗合 */
  detail: string;
  from: string;         // 源干支字
  to: string;           // 目标干支字
  fromPosition: string; // 源柱位 year/month/day/hour（流年流月可为 liunian/liuyue/liuri/dayun）
  toPosition: string;
  /** 合化五行（仅合关系） */
  hua?: string;
}

export interface PaipanResult {
  trueSolarTime: {
    year: number; month: number; day: number;
    hour: number; minute: number;
  };
  inputEcho: PaipanInput;
  pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar;
  };
  dayGan: string;       // 日干（十神轴）
  dayGanWuxing: string; // 日干五行
  relations: GanZhiRelation[];
  wuxingScore: {
    mu: number; huo: number; tu: number; jin: number; shui: number;
  };
  /** 强弱五档：极强/偏强/均衡/偏弱/极弱 */
  strength: '极强' | '偏强' | '均衡' | '偏弱' | '极弱';
  /** 月令旺相休囚死（五行四时状态，用于标注日元旺相休囚死） */
  wangxiang: WangXiangItem[];
  xiYong: {
    yong: string[]; xi: string[]; ji: string[];
    colors: string[]; directions: string[]; numbers: number[];
  };
  pattern: { name: string; sub?: string; source: string } | null;
  /** 调候用神（仅标注，不参与喜用合成；出处《穷通宝鉴》） */
  tiaoHou: { gods: string[]; source: string };
  dayun: {
    startAge: number; startYear: number; endAge: number; endYear: number;
    ganzhi: string; isCurrent: boolean;
  }[];
  /** 起运：公历日期（YYYY-MM-DD）与起运虚岁 */
  qiYun: { solar: string; age: number };
  /** 大运顺逆排 */
  dayunDirection?: '顺排' | '逆排';
}

/** 简版排盘（ADR-3 权限裁剪）：无神煞/大运/起运，guest/registered/single_paid 档 */
export type SimplePaipanResult = Omit<PaipanResult, 'dayun' | 'qiYun' | 'dayunDirection'>;
/** API 返回的排盘：按角色可能是全量或简版 */
export type MaybeSimplePaipanResult = PaipanResult | SimplePaipanResult;

// ── 天干/地支五行映射 ───────────────────────────────────
const GAN_WUXING: Record<string, string> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
  己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
};

const ZHI_WUXING: Record<string, string> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
  午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水',
};

// ── 主函数 ──────────────────────────────────────────────

/**
 * 纯函数排盘。
 * 入参 {y,m,d,h,min,gender,lon,lat} → 出参含 pillars/strength/xiYongShen/wuxingScore
 */
export async function paipan(input: PaipanInput): Promise<PaipanResult> {
  const useSolarTime = input.solarTime !== false;
  const now = input.now ?? new Date();

  // 1. 转真太阳时
  let tsYear = input.year;
  let tsMonth = input.month;
  let tsDay = input.day;
  let tsHour = input.hour;
  let tsMinute = input.minute;

  if (useSolarTime) {
    const st = toTrueSolarTime({
      year: input.year,
      month: input.month,
      day: input.day,
      hour: input.hour,
      minute: input.minute,
      lon: input.lon,
      lat: input.lat,
      timezone: input.timezone,
    });
    const ts = st.trueSolarTime;
    tsYear = ts.year;
    tsMonth = ts.month;
    tsDay = ts.day;
    tsHour = ts.hour;
    tsMinute = ts.minute;
  }

  // 2. lunar-javascript 排盘
  const lj = await getLunar();
  let lunar;

  if (input.calendar === 'lunar') {
    // 农历输入：Lunar.fromYmdHms(year, month, day, hour, min, sec)
    // 闰月用负数表示，如闰二月 = -2
    const lunarMonth = input.lunarLeap ? -input.month : input.month;
    lunar = lj.Lunar.fromYmdHms(tsYear, lunarMonth, tsDay, tsHour, tsMinute, 0);
  } else {
    // 公历输入：Solar → Lunar
    const solar = lj.Solar.fromYmdHms(tsYear, tsMonth, tsDay, tsHour, tsMinute, 0);
    lunar = solar.getLunar();
  }

  const bazi = lunar.getEightChar();

  // 3. 提取四柱
  const positions: ('year' | 'month' | 'day' | 'hour')[] = ['year', 'month', 'day', 'hour'];
  const methods = {
    year: { gan: 'getYearGan', zhi: 'getYearZhi', hideGan: 'getYearHideGan',
            shishenGan: 'getYearShiShenGan', shishenZhi: 'getYearShiShenZhi',
            nayin: 'getYearNaYin', dishi: 'getYearDiShi',
            xun: 'getYearXun', xunkong: 'getYearXunKong' },
    month: { gan: 'getMonthGan', zhi: 'getMonthZhi', hideGan: 'getMonthHideGan',
             shishenGan: 'getMonthShiShenGan', shishenZhi: 'getMonthShiShenZhi',
             nayin: 'getMonthNaYin', dishi: 'getMonthDiShi',
             xun: 'getMonthXun', xunkong: 'getMonthXunKong' },
    day: { gan: 'getDayGan', zhi: 'getDayZhi', hideGan: 'getDayHideGan',
          shishenGan: 'getDayShiShenGan', shishenZhi: 'getDayShiShenZhi',
          nayin: 'getDayNaYin', dishi: 'getDayDiShi',
          xun: 'getDayXun', xunkong: 'getDayXunKong' },
    hour: { gan: 'getTimeGan', zhi: 'getTimeZhi', hideGan: 'getTimeHideGan',
            shishenGan: 'getTimeShiShenGan', shishenZhi: 'getTimeShiShenZhi',
            nayin: 'getTimeNaYin', dishi: 'getTimeDiShi',
            xun: 'getTimeXun', xunkong: 'getTimeXunKong' },
  } as const;

  const dayGan = bazi.getDayGan();
  const dayGanWuxing = GAN_WUXING[dayGan];

  const pillars: Record<string, Pillar> = {};
  for (const pos of positions) {
    const m = methods[pos];
    const gan = (bazi as any)[m.gan]() as string;
    const zhi = (bazi as any)[m.zhi]() as string;
    const canggan = (bazi as any)[m.hideGan]() as string[];
    const shishen = (bazi as any)[m.shishenGan]() as string;
    const nayin = (bazi as any)[m.nayin]() as string;
    const dishi = (bazi as any)[m.dishi]() as string;
    const xunkong = (bazi as any)[m.xunkong]() as string;
    const shishenZhi = (bazi as any)[m.shishenZhi]() as string[];

    // 空亡：lunar-javascript 返回两个字如 "戌亥"，拆为数组
    const kongwangList = xunkong.length === 2
      ? [xunkong[0], xunkong[1]]
      : xunkong.split('').filter((c: string) => c.trim());

    // 自坐：柱天干在柱地支的十二长生（乙卯→临官、壬午→胎、辛卯→绝、戊子→胎）
    const zizuo = getDiShi(gan, zhi);

    pillars[pos] = {
      position: pos,
      gan,
      zhi,
      canggan,
      shishen,
      zhishen: shishenZhi,
      nayin,
      kongwang: kongwangList,
      dishi,
      zizuo,
      shensha: [],  // 后续步骤填充
    };
  }

  // 4. 神煞查表（步骤 4 接入）
  const pillarList = (['year', 'month', 'day', 'hour'] as const).map(pos => ({
    position: pos,
    gan: pillars[pos].gan,
    zhi: pillars[pos].zhi,
  }));

  const yearZhi = pillars.year.zhi;
  const monthZhi = pillars.month.zhi;
  const dayZhi = pillars.day.zhi;

  // 动态 import 神煞模块（避免循环依赖）
  const { findTianganShensha } = await import('@/lib/shensha/tiangan');
  const { findDizhiShensha } = await import('@/lib/shensha/dizhi');
  const { analyzeRelations } = await import('@/lib/shensha/guaxiang');

  const tianganHits = findTianganShensha(pillars.year.gan, dayGan, monthZhi, pillarList);
  const dizhiHits = findDizhiShensha(yearZhi, dayZhi, pillarList);

  // 将神煞命中分配到各柱
  for (const hit of [...tianganHits, ...dizhiHits]) {
    pillars[hit.pillar].shensha.push(hit.shensha);
  }

  // 干支关系（冲合刑破害，步骤 5 接入）
  const relations = analyzeRelations(
    pillarList.map(p => ({ position: p.position, gan: p.gan, zhi: p.zhi })),
  );

  // 五行/强弱/喜用/格局（步骤 6 接入）
  const { calcWuxingRaw, normalizeToPercent, calcStrength, calcXiYong, calcTiaoHou } =
    await import('@/lib/bazi/wuxing');
  const { detectPattern } = await import('@/lib/bazi/pattern');

  const pillarForCalc = (['year', 'month', 'day', 'hour'] as const).map(pos => ({
    position: pos,
    gan: pillars[pos].gan,
    zhi: pillars[pos].zhi,
    canggan: pillars[pos].canggan,
  }));

  const rawScore = calcWuxingRaw({ dayGan, pillars: pillarForCalc });
  const wuxingScore = normalizeToPercent(rawScore);
  const strength = calcStrength(dayGan, rawScore);
  const xiYong = calcXiYong(dayGan, strength);
  const pattern = detectPattern(dayGan, pillarForCalc);
  const tiaoHou = calcTiaoHou(dayGan, monthZhi);

  // 大运（步骤 7 接入；流年/流月/流日用 timeline 模块按需获取）
  const { getDayun } = await import('@/lib/bazi/dayun');
  const dayunResult = await getDayun(
    { trueSolarTime: { year: tsYear, month: tsMonth, day: tsDay, hour: tsHour, minute: tsMinute },
      inputEcho: input, pillars: {
        year: pillars.year, month: pillars.month, day: pillars.day, hour: pillars.hour,
      } },
    now,
  );
  const dayun = dayunResult.dayun.map(d => ({
    startAge: d.startAge,
    startYear: d.startYear,
    endYear: d.endYear,
    endAge: d.endAge,
    ganzhi: d.ganzhi,
    isCurrent: d.isCurrent,
  }));

  // 5. 构建结果（dayun 步骤 7 接入）
  const result: PaipanResult = {
    trueSolarTime: { year: tsYear, month: tsMonth, day: tsDay, hour: tsHour, minute: tsMinute },
    inputEcho: input,
    pillars: {
      year: pillars.year,
      month: pillars.month,
      day: pillars.day,
      hour: pillars.hour,
    },
    dayGan,
    dayGanWuxing,
    relations,          // 步骤 5 接入
    wuxingScore,
    strength,
    wangxiang: getWangXiang(pillars.month.zhi),
    xiYong,
    pattern,
    tiaoHou,
    dayun,
    /** 起运信息（公历日期 + 虚岁；日期以引擎 lunar-javascript 计算为准） */
    qiYun: {
      solar: dayunResult.startSolar,
      age: dayunResult.dayun[0]?.startAge ?? 0,
    },
    dayunDirection: dayunResult.direction,
  };

  return result;
}

// ── 辅助导出（供后续步骤使用）─────────────────────────
export { GAN_WUXING, ZHI_WUXING };
