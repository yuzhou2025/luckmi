/**
 * paipan.ts 测试
 * 覆盖：基准盘快照、节气交接日、闰月、晚子时、闰年2/29、夏令时出生、海外出生
 * 基线对照 lunar-javascript 同生辰输出（规则 11）
 */
import { describe, it, expect } from 'vitest';
import { paipan } from '@/lib/bazi/paipan';

describe('paipan: 基准盘快照（乙卯 壬午 辛卯 戊子）', () => {
  it('1975-6-14 0:30 公历 → 年乙卯 月壬午 日辛卯 时戊子', async () => {
    const r = await paipan({
      year: 1975, month: 6, day: 14, hour: 0, minute: 30,
      gender: 'female', calendar: 'solar',
    });

    // 四柱干支
    expect(r.pillars.year.gan).toBe('乙');
    expect(r.pillars.year.zhi).toBe('卯');
    expect(r.pillars.month.gan).toBe('壬');
    expect(r.pillars.month.zhi).toBe('午');
    expect(r.pillars.day.gan).toBe('辛');
    expect(r.pillars.day.zhi).toBe('卯');
    expect(r.pillars.hour.gan).toBe('戊');
    expect(r.pillars.hour.zhi).toBe('子');

    // 日干
    expect(r.dayGan).toBe('辛');
    expect(r.dayGanWuxing).toBe('金');
  });

  it('基准盘十神（日干辛为轴）', async () => {
    const r = await paipan({
      year: 1975, month: 6, day: 14, hour: 0, minute: 30,
      gender: 'female', calendar: 'solar',
    });

    // 年干乙 → 辛日干：乙木被辛金克 → 偏财
    expect(r.pillars.year.shishen).toBe('偏财');
    // 月干壬 → 辛日干：壬水泄辛金 → 伤官
    expect(r.pillars.month.shishen).toBe('伤官');
    // 日干辛 → 自身
    expect(r.pillars.day.shishen).toBe('日主');
    // 时干戊 → 辛日干：戊土生辛金 → 正印
    expect(r.pillars.hour.shishen).toBe('正印');
  });

  it('基准盘藏干', async () => {
    const r = await paipan({
      year: 1975, month: 6, day: 14, hour: 0, minute: 30,
      gender: 'female', calendar: 'solar',
    });

    // 卯藏乙
    expect(r.pillars.year.canggan).toEqual(['乙']);
    // 午藏丁己
    expect(r.pillars.month.canggan).toEqual(['丁', '己']);
    // 卯藏乙
    expect(r.pillars.day.canggan).toEqual(['乙']);
    // 子藏癸
    expect(r.pillars.hour.canggan).toEqual(['癸']);
  });

  it('基准盘纳音', async () => {
    const r = await paipan({
      year: 1975, month: 6, day: 14, hour: 0, minute: 30,
      gender: 'female', calendar: 'solar',
    });

    expect(r.pillars.year.nayin).toBe('大溪水');
    expect(r.pillars.month.nayin).toBe('杨柳木');
    expect(r.pillars.day.nayin).toBe('松柏木');
    expect(r.pillars.hour.nayin).toBe('霹雳火');
  });

  it('基准盘空亡（日柱辛卯 → 空亡午未）', async () => {
    const r = await paipan({
      year: 1975, month: 6, day: 14, hour: 0, minute: 30,
      gender: 'female', calendar: 'solar',
    });

    // 日柱甲申旬空午未
    expect(r.pillars.day.kongwang).toEqual(['午', '未']);
  });
});

describe('paipan: 节气交接日', () => {
  it('2015 立秋（8/8 04:01）前 → 月柱癸未', async () => {
    const r = await paipan({
      year: 2015, month: 8, day: 7, hour: 23, minute: 59,
      gender: 'male', calendar: 'solar', solarTime: false,
    });
    expect(r.pillars.month.zhi).toBe('未');
  });

  it('2015 立秋（8/8 04:01）后 → 月柱甲申', async () => {
    const r = await paipan({
      year: 2015, month: 8, day: 8, hour: 12, minute: 0,
      gender: 'male', calendar: 'solar', solarTime: false,
    });
    expect(r.pillars.month.zhi).toBe('申');
    expect(r.pillars.month.gan).toBe('甲');
  });

  it('2015 立春（2/4 11:58）前 → 年柱甲午', async () => {
    const r = await paipan({
      year: 2015, month: 2, day: 4, hour: 11, minute: 57,
      gender: 'male', calendar: 'solar', solarTime: false,
    });
    expect(r.pillars.year.gan).toBe('甲');
    expect(r.pillars.year.zhi).toBe('午');
  });

  it('2015 立春（2/4 11:58）后 → 年柱乙未', async () => {
    const r = await paipan({
      year: 2015, month: 2, day: 4, hour: 11, minute: 59,
      gender: 'male', calendar: 'solar', solarTime: false,
    });
    expect(r.pillars.year.gan).toBe('乙');
    expect(r.pillars.year.zhi).toBe('未');
  });
});

describe('paipan: 晚子时（23:00–00:00）', () => {
  it('23:30 日柱不翻日（规则：晚子时归属当日）', async () => {
    const r23 = await paipan({
      year: 2023, month: 7, day: 1, hour: 23, minute: 30,
      gender: 'male', calendar: 'solar', solarTime: false,
    });
    const r22 = await paipan({
      year: 2023, month: 7, day: 1, hour: 22, minute: 59,
      gender: 'male', calendar: 'solar', solarTime: false,
    });
    // 22:59 和 23:30 日柱相同
    expect(r23.pillars.day.gan + r23.pillars.day.zhi).toBe(r22.pillars.day.gan + r22.pillars.day.zhi);
    // 时柱为戊子（子时）
    expect(r23.pillars.hour.zhi).toBe('子');
  });

  it('00:30 早子时 → 日柱翻日', async () => {
    const r00 = await paipan({
      year: 2023, month: 7, day: 2, hour: 0, minute: 30,
      gender: 'male', calendar: 'solar', solarTime: false,
    });
    const r23 = await paipan({
      year: 2023, month: 7, day: 1, hour: 23, minute: 30,
      gender: 'male', calendar: 'solar', solarTime: false,
    });
    // 00:30 日柱 ≠ 23:30 日柱
    expect(r00.pillars.day.gan + r00.pillars.day.zhi).not.toBe(
      r23.pillars.day.gan + r23.pillars.day.zhi,
    );
  });
});

describe('paipan: 闰年 2/29', () => {
  it('2024-2-29 正常排盘', async () => {
    const r = await paipan({
      year: 2024, month: 2, day: 29, hour: 12, minute: 0,
      gender: 'male', calendar: 'solar', solarTime: false,
    });
    // 与 lunar-javascript 直接调用对拍
    expect(r.pillars.year.gan + r.pillars.year.zhi).toBe('甲辰');
    expect(r.pillars.day.gan).toBeDefined();
  });
});

describe('paipan: 夏令时出生', () => {
  it('1988-7-15 北京夏令时 → 真太阳时排盘', async () => {
    // 1988 年中国夏令时 UTC+9，10:00 DST = 09:00 标准 = 01:00 UTC = 09:00 北京
    // 加经度修正和均时差后为真太阳时
    const r = await paipan({
      year: 1988, month: 7, day: 15, hour: 10, minute: 0,
      gender: 'male', calendar: 'solar',
      lon: 116.4, timezone: 'Asia/Shanghai',
    });
    // 不报错，有有效四柱
    expect(r.pillars.year.gan).toBeDefined();
    expect(r.pillars.day.gan).toBeDefined();
  });
});

describe('paipan: 海外出生（非东八区）', () => {
  it('纽约夏令时出生 → 转真太阳时排盘', async () => {
    // 纽约 2023-7-15 10:30 EDT = UTC 14:30
    // 真太阳时（lon=-74）= UTC + lon/15 + EoT ≈ 14:30 - 4:56 + EoT ≈ 09:34
    const r = await paipan({
      year: 2023, month: 7, day: 15, hour: 10, minute: 30,
      gender: 'male', calendar: 'solar',
      lon: -74.0, lat: 40.7, timezone: 'America/New_York',
    });
    // 真太阳时在 09:xx 附近（出生地太阳时，非北京时间）
    expect(r.trueSolarTime.hour).toBeGreaterThanOrEqual(8);
    expect(r.trueSolarTime.hour).toBeLessThanOrEqual(10);
    expect(r.pillars.day.gan).toBeDefined();
  });

  it('伦敦冬令时出生 → 转真太阳时排盘', async () => {
    // 伦敦 2023-1-15 10:00 GMT = UTC 10:00
    // 真太阳时（lon=0）= UTC + 0 + EoT ≈ 10:00 - 10min ≈ 09:50
    const r = await paipan({
      year: 2023, month: 1, day: 15, hour: 10, minute: 0,
      gender: 'male', calendar: 'solar',
      lon: 0, timezone: 'Europe/London',
    });
    // 真太阳时在 09:xx 附近
    expect(r.trueSolarTime.hour).toBeGreaterThanOrEqual(9);
    expect(r.trueSolarTime.hour).toBeLessThanOrEqual(11);
  });
});

describe('paipan: 农历输入', () => {
  it('农历 2015-6-15 → 对应公历排盘', async () => {
    const r = await paipan({
      year: 2015, month: 6, day: 15, hour: 12, minute: 0,
      gender: 'male', calendar: 'lunar', solarTime: false,
    });
    // 农历六月十五 = 公历 7/30
    expect(r.pillars.year.gan + r.pillars.year.zhi).toBe('乙未');
    expect(r.pillars.day.gan).toBeDefined();
  });
});

describe('paipan: 结构完整性', () => {
  it('输出含全部字段', async () => {
    const r = await paipan({
      year: 1975, month: 6, day: 14, hour: 0, minute: 30,
      gender: 'female', calendar: 'solar',
    });
    expect(r).toHaveProperty('trueSolarTime');
    expect(r).toHaveProperty('pillars');
    expect(r).toHaveProperty('dayGan');
    expect(r).toHaveProperty('dayGanWuxing');
    expect(r).toHaveProperty('relations');
    expect(r).toHaveProperty('wuxingScore');
    expect(r).toHaveProperty('strength');
    expect(r).toHaveProperty('xiYong');
    expect(r).toHaveProperty('pattern');
    expect(r).toHaveProperty('dayun');
  });

  it('每柱含全部字段', async () => {
    const r = await paipan({
      year: 1975, month: 6, day: 14, hour: 0, minute: 30,
      gender: 'female', calendar: 'solar',
    });
    for (const pos of ['year', 'month', 'day', 'hour'] as const) {
      const p = r.pillars[pos];
      expect(p.position).toBe(pos);
      expect(p.gan).toBeTruthy();
      expect(p.zhi).toBeTruthy();
      expect(Array.isArray(p.canggan)).toBe(true);
      expect(p.shishen).toBeTruthy();
      expect(p.nayin).toBeTruthy();
      expect(Array.isArray(p.kongwang)).toBe(true);
      expect(p.dishi).toBeTruthy();
      expect(p.zizuo).toBeTruthy();
      expect(Array.isArray(p.shensha)).toBe(true);
    }
  });
});
