/**
 * dayun + timeline 测试
 * 大运起运/顺逆/高亮；流年2026丙午；流月节气（2026立秋后丙申）；流日；
 * 全部走 lunar-javascript，禁止手写递推（规则 4）。
 */
import { describe, it, expect } from 'vitest';
import { paipan } from '@/lib/bazi/paipan';
import { getDayun } from '@/lib/bazi/dayun';
import { getLiunian, getLiuyue, getLiuri, dayunToItems } from '@/lib/bazi/timeline';

// 基准盘：1975-6-14 0:30 女
const BASE = {
  year: 1975, month: 6, day: 14, hour: 0, minute: 30,
  gender: 'female' as const, calendar: 'solar' as const,
};
// 当前时刻 2026-9-3（立秋后白露前 → 申月）
const NOW = new Date(2026, 8, 3, 12, 0, 0);

describe('dayun: 大运顺逆与起运', () => {
  it('女命（乙年阴）顺排：癸未→甲申→…→丁亥(49岁/2023)', async () => {
    const r = await paipan(BASE);
    const dy = await getDayun(r, NOW);
    expect(dy.direction).toBe('顺排');
    const gz = dy.dayun.map(d => d.ganzhi);
    // 月柱壬午顺推
    expect(gz.slice(0, 5)).toEqual(['癸未', '甲申', '乙酉', '丙戌', '丁亥']);
    const dingHai = dy.dayun.find(d => d.ganzhi === '丁亥')!;
    expect(dingHai.startAge).toBe(49);
    expect(dingHai.startYear).toBe(2023);
  });

  it('男命（乙年阴）逆排：辛巳→庚辰→己卯…', async () => {
    const r = await paipan({ ...BASE, gender: 'male' });
    const dy = await getDayun(r, NOW);
    expect(dy.direction).toBe('逆排');
    const gz = dy.dayun.map(d => d.ganzhi);
    expect(gz.slice(0, 3)).toEqual(['辛巳', '庚辰', '己卯']);
  });

  it('起运岁数为正数（引擎按节气天数计算）', async () => {
    const r = await paipan(BASE);
    const dy = await getDayun(r, NOW);
    expect(dy.startAge).toBeGreaterThan(0);
  });
});

describe('dayun: 当前大运高亮', () => {
  it('2026 年 → 丁亥大运 isCurrent（2023–2032）', async () => {
    const r = await paipan(BASE);
    const dy = await getDayun(r, NOW);
    const current = dy.dayun.filter(d => d.isCurrent);
    expect(current.length).toBe(1);
    expect(current[0].ganzhi).toBe('丁亥');
  });

  it('2023 年 → 丁亥；2013 年 → 丙戌', async () => {
    const r = await paipan(BASE);
    const dy2023 = await getDayun(r, new Date(2023, 5, 1));
    expect(dy2023.dayun.find(d => d.isCurrent)?.ganzhi).toBe('丁亥');
    const dy2013 = await getDayun(r, new Date(2013, 5, 1));
    expect(dy2013.dayun.find(d => d.isCurrent)?.ganzhi).toBe('丙戌');
  });
});

describe('timeline: 流年', () => {
  it('2026 流年 → 丙午，isCurrent', async () => {
    const r = await paipan(BASE);
    const dy = await getDayun(r, NOW);
    const curDy = dy.dayun.find(d => d.isCurrent)!;
    const ln = await getLiunian(r, curDy.ganzhi, NOW);
    const current = ln.filter(x => x.isCurrent);
    expect(current.length).toBe(1);
    expect(current[0].ganzhi).toBe('丙午');
    expect(current[0].scope).toBe('liunian');
    // 丙午年在当前大运（丁亥）覆盖的 10 年内
    expect(ln.length).toBe(10);
  });

  it('流年项含十神/藏干/地势（丙=正官，午藏丁己，辛在午=病）', async () => {
    const r = await paipan(BASE);
    const dy = await getDayun(r, NOW);
    const curDy = dy.dayun.find(d => d.isCurrent)!;
    const ln = await getLiunian(r, curDy.ganzhi, NOW);
    const bingwu = ln.find(x => x.ganzhi === '丙午')!;
    expect(bingwu.shishen).toBe('正官');
    expect(bingwu.canggan).toEqual(['丁', '己']);
    expect(bingwu.dishi).toBe('病');
    // 与本命/大运有作用关系
    expect(Array.isArray(bingwu.relations)).toBe(true);
  });
});

describe('timeline: 流月（节气为界）', () => {
  it('2026 年 12 个节气月', async () => {
    const r = await paipan(BASE);
    const ly = await getLiuyue(r, 2026, '丁亥', '丙午', NOW);
    expect(ly.length).toBe(12);
    // 正月寅起
    expect(ly[0].zhi).toBe('寅');
    expect(ly[0].ganzhi).toBe('庚寅');
  });

  it('2026-9-3（立秋后白露前）→ 七月丙申 isCurrent', async () => {
    const r = await paipan(BASE);
    const ly = await getLiuyue(r, 2026, '丁亥', '丙午', NOW);
    const current = ly.filter(x => x.isCurrent);
    expect(current.length).toBe(1);
    expect(current[0].ganzhi).toBe('丙申');
    expect(current[0].label).toContain('七');
  });

  it('流月项含十神/藏干/地势/自坐/节气日期/十神单字', async () => {
    const r = await paipan(BASE);
    const ly = await getLiuyue(r, 2026, '丁亥', '丙午', NOW);
    const shen = ly.find(x => x.ganzhi === '丙申')!;
    expect(shen.shishen).toBe('正官');   // 丙对辛=正官
    expect(shen.canggan).toEqual(['庚', '壬', '戊']); // 申藏
    expect(shen.zhishen).toEqual(['劫财', '伤官', '正印']); // 藏干对辛十神
    expect(shen.dishi).toBe('帝旺');      // 辛在申=帝旺
    expect(shen.zizuo).toBe('病');        // 自坐：丙在申=病
    expect(shen.ganAbbr).toBe('官');      // 正官单字
    expect(shen.zhiAbbr).toBe('劫');      // 申本气庚=劫财单字
    expect(shen.jieqiName).toBe('立秋');
    expect(shen.jieqiDate).toBe('8.7');   // 2026 立秋 8 月 7 日
    // 十二节日期对拍参考图4：立春2.4…小寒1.5
    const byName = Object.fromEntries(ly.map(x => [x.jieqiName, x.jieqiDate]));
    expect(byName['立春']).toBe('2.4');
    expect(byName['小寒']).toBe('1.5');
  });

  it('流月干/支与日干同字（辛）按比肩论，不作日主（辛卯/丁酉/辛丑月）', async () => {
    const r = await paipan(BASE);
    const ly = await getLiuyue(r, 2026, '丁亥', '丙午', NOW);
    // 惊蛰后二月辛卯：天干辛=比肩（单字"比"），卯本气乙=偏财（单字"才"）
    const xinmao = ly.find(x => x.ganzhi === '辛卯')!;
    expect(xinmao).toBeTruthy();
    expect(xinmao.shishen).toBe('比肩');
    expect(xinmao.ganAbbr).toBe('比');
    expect(xinmao.zhiAbbr).toBe('才');
    // 白露后八月丁酉：天干丁=七杀（杀），酉本气辛与日干同字=比肩（比，非"主"）
    const dingyou = ly.find(x => x.ganzhi === '丁酉')!;
    expect(dingyou).toBeTruthy();
    expect(dingyou.shishen).toBe('七杀');
    expect(dingyou.ganAbbr).toBe('杀');
    expect(dingyou.zhiAbbr).toBe('比');
    // 小寒后十二月辛丑：天干辛=比肩（比），丑本气己=偏印（枭）
    const xinchou = ly.find(x => x.ganzhi === '辛丑')!;
    expect(xinchou).toBeTruthy();
    expect(xinchou.shishen).toBe('比肩');
    expect(xinchou.ganAbbr).toBe('比');
    expect(xinchou.zhiAbbr).toBe('枭');
  });

  it('流年项含虚岁/年份/自坐地势（2026 丙午 52岁，自坐帝旺）', async () => {
    const r = await paipan(BASE);
    const curDy = r.dayun.find(d => d.isCurrent)!;
    const lns = await getLiunian(r, curDy.ganzhi, NOW);
    const bingwu = lns.find(x => x.isCurrent)!;
    expect(bingwu.ganzhi).toBe('丙午');
    expect(bingwu.year).toBe(2026);
    expect(bingwu.age).toBe(52);          // 虚岁 2026-1975+1
    expect(bingwu.zizuo).toBe('帝旺');    // 丙在午=帝旺
    expect(bingwu.ganAbbr).toBe('官');
    expect(bingwu.zhiAbbr).toBe('杀');    // 午本气丁=七杀
  });

  it('起运信息：公历 1983-06-24（引擎值）起运', async () => {
    const r = await paipan(BASE);
    expect(r.qiYun.solar).toBe('1983-06-24');
    expect(r.qiYun.age).toBe(9);          // 首运 9 岁（虚岁）
  });
});

describe('timeline: 流日', () => {
  it('2026-9-3 → 庚辰日 isCurrent', async () => {
    const r = await paipan(BASE);
    const lr = await getLiuri(r, NOW);
    const current = lr.filter(x => x.isCurrent);
    expect(current.length).toBe(1);
    expect(current[0].ganzhi).toBe('庚辰');
    expect(current[0].label).toBe('9/3');
  });

  it('流日覆盖整个节气月（约 30 天，跨节气自动截断）', async () => {
    const r = await paipan(BASE);
    const lr = await getLiuri(r, NOW);
    // 申月（立秋 8/7 至白露 9/7）约 30 天
    expect(lr.length).toBeGreaterThanOrEqual(28);
    expect(lr.length).toBeLessThanOrEqual(32);
    // 首日应为 8/7 附近（立秋），末日 9/6 附近
    expect(lr[0].label).toMatch(/^8\//);
    expect(lr[lr.length - 1].label).toMatch(/^9\//);
  });

  it('流日项含十神/藏干', async () => {
    const r = await paipan(BASE);
    const lr = await getLiuri(r, NOW);
    const gengchen = lr.find(x => x.ganzhi === '庚辰')!;
    expect(gengchen.shishen).toBe('劫财'); // 庚对辛=劫财
    expect(gengchen.canggan).toEqual(['戊', '乙', '癸']); // 辰藏
  });

  it('流日天干与日干同字（辛巳日）按比肩论，不作日主', async () => {
    const r = await paipan(BASE);
    const lr = await getLiuri(r, NOW);
    const xinsi = lr.find(x => x.ganzhi === '辛巳'); // 9/4 辛巳
    expect(xinsi).toBeTruthy();
    expect(xinsi!.shishen).toBe('比肩');
    expect(xinsi!.ganAbbr).toBe('比');
    expect(xinsi!.zhiAbbr).toBe('官'); // 巳本气丙=正官
  });
});

describe('timeline: 大运转时间项', () => {
  it('dayunToItems 含十神/地势/作用关系', async () => {
    const r = await paipan(BASE);
    const dy = await getDayun(r, NOW);
    const items = dayunToItems(r.dayGan, r.pillars, dy.dayun.map(d => ({
      ganzhi: d.ganzhi, isCurrent: d.isCurrent, startAge: d.startAge, startYear: d.startYear,
    })));
    const dingHai = items.find(x => x.ganzhi === '丁亥')!;
    expect(dingHai.shishen).toBe('七杀');   // 丁对辛=七杀
    expect(dingHai.canggan).toEqual(['壬', '甲']); // 亥藏
    expect(dingHai.zhishen).toEqual(['伤官', '正财']); // 壬=伤官 甲=正财
    expect(dingHai.dishi).toBe('沐浴');      // 辛在亥=沐浴
    expect(dingHai.zizuo).toBe('胎');        // 自坐：丁在亥=胎
    expect(dingHai.ganAbbr).toBe('杀');
    expect(dingHai.zhiAbbr).toBe('伤');      // 亥本气壬=伤官
    expect(dingHai.isCurrent).toBe(true);
  });
});
