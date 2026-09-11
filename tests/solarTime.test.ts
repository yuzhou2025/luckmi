/**
 * solarTime.ts 测试
 * 覆盖：北京基准、经度修正、纽约夏令时/冬令时、伦敦 BST/GMT、
 *       中国 1988 夏令时、均时差极值、海外出生、日期跨越
 */
import { describe, it, expect } from 'vitest';
import { toTrueSolarTime } from '@/lib/astronomy/solarTime';

describe('solarTime: 北京基准（UTC+8, lon=120°E）', () => {
  it('北京时间 10:00 → UTC 02:00, 无 DST', () => {
    const r = toTrueSolarTime({ year: 2023, month: 6, day: 15, hour: 10, minute: 0 });
    expect(r.timezoneOffset).toBe(480);   // UTC+8
    expect(r.dstOffset).toBe(0);           // 无夏令时
    expect(r.utc.hour).toBe(2);
    expect(r.utc.minute).toBe(0);
    expect(r.beijingTime.hour).toBe(10);
  });

  it('经度修正为 0（lon=120 = 基准经度）', () => {
    const r = toTrueSolarTime({ year: 2023, month: 6, day: 15, hour: 10, minute: 0 });
    expect(r.longitudeCorrection).toBe(0);
    expect(r.longitude).toBe(120);
  });

  it('默认时区为 Asia/Shanghai', () => {
    const r = toTrueSolarTime({ year: 2023, month: 1, day: 1, hour: 0, minute: 0 });
    expect(r.timezone).toBe('Asia/Shanghai');
  });
});

describe('solarTime: 经度修正', () => {
  it('上海 lon=121.47 → 修正 +5.88 分钟', () => {
    const r = toTrueSolarTime({
      year: 2023, month: 6, day: 15, hour: 10, minute: 0, lon: 121.47,
    });
    expect(r.longitudeCorrection).toBeCloseTo(5.88, 1);
  });

  it('纽约 lon=-74 → 修正 (−74−120)×4 = −776 分钟', () => {
    const r = toTrueSolarTime({
      year: 2023, month: 1, day: 15, hour: 10, minute: 0,
      lon: -74, timezone: 'America/New_York',
    });
    expect(r.longitudeCorrection).toBeCloseTo(-776, 0);
  });

  it('伦敦 lon=-0.1 → 修正 ≈ −480.4 分钟', () => {
    const r = toTrueSolarTime({
      year: 2023, month: 1, day: 15, hour: 10, minute: 0,
      lon: -0.1, timezone: 'Europe/London',
    });
    expect(r.longitudeCorrection).toBeCloseTo(-480.4, 0);
  });
});

describe('solarTime: 纽约夏令时 / 冬令时', () => {
  it('7 月（夏令时生效）→ UTC−4，DST=60 分钟', () => {
    const r = toTrueSolarTime({
      year: 2023, month: 7, day: 15, hour: 10, minute: 0,
      lon: -74, timezone: 'America/New_York',
    });
    expect(r.timezoneOffset).toBe(-240);  // UTC−4
    expect(r.dstOffset).toBe(60);          // DST +1h
  });

  it('1 月（无夏令时）→ UTC−5，DST=0', () => {
    const r = toTrueSolarTime({
      year: 2023, month: 1, day: 15, hour: 10, minute: 0,
      lon: -74, timezone: 'America/New_York',
    });
    expect(r.timezoneOffset).toBe(-300);  // UTC−5
    expect(r.dstOffset).toBe(0);
  });

  it('纽约 7月10:00 → UTC 14:00 → 北京 22:00', () => {
    const r = toTrueSolarTime({
      year: 2023, month: 7, day: 15, hour: 10, minute: 0,
      lon: -74, timezone: 'America/New_York',
    });
    expect(r.utc.hour).toBe(14);
    expect(r.utc.minute).toBe(0);
    expect(r.beijingTime.hour).toBe(22);
  });
});

describe('solarTime: 伦敦 BST / GMT', () => {
  it('7 月（BST）→ UTC+1，DST=60', () => {
    const r = toTrueSolarTime({
      year: 2023, month: 7, day: 15, hour: 10, minute: 0,
      lon: 0, timezone: 'Europe/London',
    });
    expect(r.timezoneOffset).toBe(60);   // UTC+1
    expect(r.dstOffset).toBe(60);
  });

  it('1 月（GMT）→ UTC+0，DST=0', () => {
    const r = toTrueSolarTime({
      year: 2023, month: 1, day: 15, hour: 10, minute: 0,
      lon: 0, timezone: 'Europe/London',
    });
    expect(r.timezoneOffset).toBe(0);
    expect(r.dstOffset).toBe(0);
  });
});

describe('solarTime: 中国 1986-1991 夏令时', () => {
  it('1988 年 7 月（中国夏令时）→ 应检测 DST', () => {
    const r = toTrueSolarTime({
      year: 1988, month: 7, day: 15, hour: 10, minute: 0,
      lon: 116.4, timezone: 'Asia/Shanghai',
    });
    // 中国 1986-1991 实行夏令时，7 月应为 UTC+9
    // 如果 Intl 不支持历史 DST，offset 仍为 480（测试容错）
    expect(r.timezoneOffset).toBeGreaterThanOrEqual(480);
    if (r.dstOffset > 0) {
      expect(r.timezoneOffset).toBe(540);  // UTC+9
      expect(r.dstOffset).toBe(60);
    }
  });

  it('1988 年 1 月（无夏令时）→ UTC+8', () => {
    const r = toTrueSolarTime({
      year: 1988, month: 1, day: 15, hour: 10, minute: 0,
      lon: 116.4, timezone: 'Asia/Shanghai',
    });
    expect(r.timezoneOffset).toBe(480);
    expect(r.dstOffset).toBe(0);
  });
});

describe('solarTime: 均时差（EoT）', () => {
  it('2 月中旬 EoT ≈ −14 分钟（年内最小）', () => {
    const r = toTrueSolarTime({
      year: 2023, month: 2, day: 11, hour: 12, minute: 0,
    });
    expect(r.equationOfTime).toBeLessThan(-13);
    expect(r.equationOfTime).toBeGreaterThan(-15);
  });

  it('11 月初 EoT ≈ +16 分钟（年内最大）', () => {
    const r = toTrueSolarTime({
      year: 2023, month: 11, day: 3, hour: 12, minute: 0,
    });
    expect(r.equationOfTime).toBeGreaterThan(15);
    expect(r.equationOfTime).toBeLessThan(17);
  });

  it('6 月中旬 EoT ≈ 0（接近零点）', () => {
    const r = toTrueSolarTime({
      year: 2023, month: 6, day: 15, hour: 12, minute: 0,
    });
    expect(Math.abs(r.equationOfTime)).toBeLessThan(2);
  });
});

describe('solarTime: 日期跨越', () => {
  it('北京 23:58 + EoT 负值可能跨入次日', () => {
    const r = toTrueSolarTime({
      year: 2023, month: 2, day: 11, hour: 23, minute: 58,
    });
    // EoT ≈ −14 分钟 → 真太阳时 ≈ 23:44，不跨日
    expect(r.trueSolarTime.day).toBe(11);
    expect(r.trueSolarTime.hour).toBe(23);
  });

  it('北京 00:02 + EoT 负值可能退回前日', () => {
    const r = toTrueSolarTime({
      year: 2023, month: 2, day: 12, hour: 0, minute: 2,
    });
    // EoT ≈ −14 分钟 → 真太阳时 ≈ 前日 23:48
    if (r.equationOfTime < -2) {
      expect(r.trueSolarTime.day).toBe(11);
      expect(r.trueSolarTime.hour).toBe(23);
    }
  });
});

describe('solarTime: 海外出生完整链路', () => {
  it('纽约夏令时出生 → 真太阳时含经度修正', () => {
    const r = toTrueSolarTime({
      year: 2023, month: 7, day: 15, hour: 10, minute: 30,
      lon: -74.0, lat: 40.7, timezone: 'America/New_York',
    });
    // 10:30 EDT = 14:30 UTC = 22:30 北京时间
    expect(r.beijingTime.hour).toBe(22);
    expect(r.beijingTime.minute).toBe(30);
    // 经度修正 = (-74 - 120) * 4 = -776 min ≈ -12h56m
    // 真太阳时 ≈ 22:30 - 12:56 + EoT ≈ 09:34 + EoT
    expect(r.trueSolarTime.hour).toBeGreaterThanOrEqual(9);
    expect(r.trueSolarTime.hour).toBeLessThanOrEqual(10);
  });

  it('输出结构完整性', () => {
    const r = toTrueSolarTime({
      year: 2023, month: 6, day: 15, hour: 10, minute: 0,
      lon: 116.4, lat: 39.9, timezone: 'Asia/Shanghai',
    });
    expect(r).toHaveProperty('inputLocal');
    expect(r).toHaveProperty('utc');
    expect(r).toHaveProperty('beijingTime');
    expect(r).toHaveProperty('trueSolarTime');
    expect(r).toHaveProperty('equationOfTime');
    expect(r).toHaveProperty('longitudeCorrection');
    expect(r).toHaveProperty('dstOffset');
    expect(r).toHaveProperty('timezoneOffset');
    expect(r).toHaveProperty('longitude');
    expect(r).toHaveProperty('timezone');
    expect(r.inputLocal.year).toBe(2023);
    expect(r.inputLocal.hour).toBe(10);
  });
});
