/**
 * src/lib/astronomy/solarTime.ts
 * 真太阳时 + 夏令时处理 —— 唯一实现处（规则 5/6/7）。
 * 业务/组件不得含经度或时区硬编码。
 *
 * 流程：
 *   1. 本地钟面时间 → UTC（按出生当日实际时区偏移，含 DST）
 *   2. UTC → 北京时间（UTC+8 标准时）
 *   3. 北京时间 + 经度修正 + 均时差 = 真太阳时
 *
 * 真太阳时 = UTC + 8h + (lon - 120°) × 4min/° + EoT
 */

import { SOLAR_TIME } from '@/lib/bazi/config';

// ── 类型 ────────────────────────────────────────────────

export interface SolarTimeInput {
  year: number;
  month: number;       // 1-12
  day: number;
  hour: number;        // 0-23
  minute: number;      // 0-59
  /** 出生地经度（东正西负）。未提供则用 120°E */
  lon?: number;
  /** 出生地纬度（暂未参与时间计算，保留） */
  lat?: number;
  /** IANA 时区名，如 'America/New_York'。未提供则按 'Asia/Shanghai'（UTC+8） */
  timezone?: string;
}

export interface DateTimeParts {
  year: number;
  month: number;       // 1-12
  day: number;
  hour: number;        // 0-23
  minute: number;      // 0-59
}

export interface SolarTimeResult {
  /** 原始输入本地钟面时间 */
  inputLocal: DateTimeParts;
  /** UTC 时间 */
  utc: DateTimeParts;
  /** UTC+8 标准时（未做真太阳时修正） */
  beijingTime: DateTimeParts;
  /** 真太阳时（最终用于排盘） */
  trueSolarTime: DateTimeParts;
  /** 均时差（分钟）。正值 = 真太阳时比平太阳时快 */
  equationOfTime: number;
  /** 经度修正（分钟） */
  longitudeCorrection: number;
  /** 夏令时偏移（分钟，0 = 无夏令时） */
  dstOffset: number;
  /** 时区总偏移（分钟，含夏令时）。UTC+8 → 480 */
  timezoneOffset: number;
  /** 使用的经度 */
  longitude: number;
  /** 使用的时区 */
  timezone: string;
}

// ── 均时差（Equation of Time）────────────────────────────

/**
 * NOAA 近似公式，误差 < 0.5 分钟。
 * @returns 均时差（分钟），正值表示真太阳时比平太阳时快
 */
function calcEquationOfTime(year: number, month: number, day: number): number {
  const date = new Date(Date.UTC(year, month - 1, day));
  const start = new Date(Date.UTC(year, 0, 1));
  const dayOfYear =
    Math.floor((date.getTime() - start.getTime()) / 86_400_000) + 1;

  const B = (2 * Math.PI * (dayOfYear - 1)) / 365; // radians
  return (
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(B) -
      0.032077 * Math.sin(B) -
      0.014615 * Math.cos(2 * B) -
      0.040849 * Math.sin(2 * B))
  );
}

// ── 时区偏移 ────────────────────────────────────────────

/**
 * 获取指定时区在给定 UTC 时刻的偏移量（含夏令时）。
 * @returns 偏移量（分钟）。UTC+8 → 480，UTC-5 → -300
 */
function getTimezoneOffsetAtUtc(timezone: string, utcMs: number): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = dtf.formatToParts(new Date(utcMs));
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;

  const ly = parseInt(map.year);
  const lM = parseInt(map.month) - 1;
  const ld = parseInt(map.day);
  const lh = parseInt(map.hour === '24' ? '0' : map.hour);
  const lmin = parseInt(map.minute);
  const ls = parseInt(map.second);

  const localMs = Date.UTC(ly, lM, ld, lh, lmin, ls);
  return (localMs - utcMs) / 60_000;
}

/**
 * 将本地钟面时间转换为 UTC。
 * 处理夏令时：偏移按出生当日实际值取（规则 7）。
 * 迭代两次以处理 DST 边界。
 */
function localToUtc(
  timezone: string,
  year: number, month: number, day: number,
  hour: number, minute: number,
): { utcMs: number; offset: number } {
  // 假设 offset=0，得到 tentative UTC
  const tentativeMs = Date.UTC(year, month - 1, day, hour, minute);

  // 第一次获取偏移
  let offset = getTimezoneOffsetAtUtc(timezone, tentativeMs);
  let utcMs = tentativeMs - offset * 60_000;

  // 验证并修正（DST 边界处偏移可能不同）
  const offset2 = getTimezoneOffsetAtUtc(timezone, utcMs);
  if (offset2 !== offset) {
    offset = offset2;
    utcMs = tentativeMs - offset * 60_000;
  }

  return { utcMs, offset };
}

/**
 * 计算夏令时偏移。
 * 对比该时区在该年 1 月（北半球冬）与 7 月（北半球夏）的偏移，
 * 取较小绝对偏移为标准时，差值即 DST。
 */
function calcDstOffset(timezone: string, utcMs: number, totalOffset: number): number {
  const year = new Date(utcMs).getUTCFullYear();
  const janOff = getTimezoneOffsetAtUtc(timezone, Date.UTC(year, 0, 15, 12, 0, 0));
  const julOff = getTimezoneOffsetAtUtc(timezone, Date.UTC(year, 6, 15, 12, 0, 0));
  const standardOffset = Math.min(janOff, julOff);
  return totalOffset - standardOffset;
}

// ── 工具 ────────────────────────────────────────────────

function extractParts(ms: number): DateTimeParts {
  const d = new Date(ms);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  };
}

// ── 主函数 ──────────────────────────────────────────────

/**
 * 将本地钟面时间转换为东八区真太阳时（规则 6）。
 *
 * 传给排盘库的必须是此函数输出的 trueSolarTime，禁止用用户原始当地时间直接排盘。
 */
export function toTrueSolarTime(input: SolarTimeInput): SolarTimeResult {
  const { year, month, day, hour, minute } = input;
  const longitude = input.lon ?? SOLAR_TIME.baseLongitude; // 默认 120°E
  const timezone = input.timezone ?? 'Asia/Shanghai';       // 默认 UTC+8

  // 1. 本地 → UTC（含 DST）
  const { utcMs, offset: timezoneOffset } = localToUtc(
    timezone, year, month, day, hour, minute,
  );

  // 2. DST 偏移
  const dstOffset = calcDstOffset(timezone, utcMs, timezoneOffset);

  // 3. UTC → 北京时间（UTC+8）
  const beijingMs = utcMs + 8 * 3_600_000;

  // 4. 经度修正（分钟）：每度 4 分钟
  const longitudeCorrection = (longitude - SOLAR_TIME.baseLongitude) * 4;

  // 5. 均时差（基于北京时间日期近似）
  const bjParts = extractParts(beijingMs);
  const equationOfTime = calcEquationOfTime(bjParts.year, bjParts.month, bjParts.day);

  // 6. 真太阳时 = 北京时间 + 经度修正 + 均时差
  const trueSolarMs =
    beijingMs + (longitudeCorrection + equationOfTime) * 60_000;

  return {
    inputLocal: { year, month, day, hour, minute },
    utc: extractParts(utcMs),
    beijingTime: extractParts(beijingMs),
    trueSolarTime: extractParts(trueSolarMs),
    equationOfTime,
    longitudeCorrection,
    dstOffset,
    timezoneOffset,
    longitude,
    timezone,
  };
}
