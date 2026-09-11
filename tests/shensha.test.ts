/**
 * shensha 测试
 * 覆盖：神煞大小双查规则（干查=年干大+日干小；支查=年支大+日支小）、
 *       天乙贵人完整歌诀锁死、基准盘图1.2神煞逐柱对拍、月德合/阴差阳错
 */
import { describe, it, expect } from 'vitest';
import { paipan } from '@/lib/bazi/paipan';
import { findTianganShensha } from '@/lib/shensha/tiangan';
import { findDizhiShensha } from '@/lib/shensha/dizhi';
import { SHENSHA } from '@/lib/bazi/config';

// 基准盘四柱干支（乙卯 壬午 辛卯 戊子）
const BASELINE_PILLARS = [
  { position: 'year' as const, gan: '乙', zhi: '卯' },
  { position: 'month' as const, gan: '壬', zhi: '午' },
  { position: 'day' as const, gan: '辛', zhi: '卯' },
  { position: 'hour' as const, gan: '戊', zhi: '子' },
];
const BASE_YEAR_GAN = '乙';
const BASE_DAY_GAN = '辛';
const BASE_MONTH_ZHI = '午';

describe('shensha: 干查双轴规则（年干=大, 日干=小）', () => {
  it('甲日干 → 小贵人丑未（年干壬不命中）', () => {
    const hits = findTianganShensha('壬', '甲', '午', [
      { position: 'year', gan: '甲', zhi: '丑' },
      { position: 'month', gan: '乙', zhi: '未' },
      { position: 'day', gan: '甲', zhi: '寅' },
      { position: 'hour', gan: '丙', zhi: '子' },
    ]);
    const guiRen = hits.filter(h => h.shensha.name === '天乙贵人');
    expect(guiRen.length).toBe(2); // year(丑) + month(未)
    expect(guiRen.every(h => h.shensha.level === '小')).toBe(true);
    expect(guiRen.every(h => h.shensha.source === '日干')).toBe(true);
  });

  it('戊日干 → 小贵人丑未', () => {
    const hits = findTianganShensha('壬', '戊', '午', [
      { position: 'day', gan: '戊', zhi: '午' },
      { position: 'hour', gan: '辛', zhi: '丑' },
    ]);
    const guiRen = hits.filter(h => h.shensha.name === '天乙贵人');
    expect(guiRen.length).toBe(1);
    expect(guiRen[0].pillar).toBe('hour');
    expect(guiRen[0].shensha.level).toBe('小');
  });

  it('庚日干 → 贵人丑未', () => {
    const hits = findTianganShensha('壬', '庚', '午', [
      { position: 'year', gan: '乙', zhi: '未' },
    ]);
    const guiRen = hits.filter(h => h.shensha.name === '天乙贵人');
    expect(guiRen.length).toBe(1);
  });

  it('基准盘：大天乙在时柱（年干乙→子申，时支子），小天乙在月柱（日干辛→寅午，月支午）', () => {
    const hits = findTianganShensha(BASE_YEAR_GAN, BASE_DAY_GAN, BASE_MONTH_ZHI, BASELINE_PILLARS);
    const guiRen = hits.filter(h => h.shensha.name === '天乙贵人');
    expect(guiRen.length).toBe(2);
    const big = guiRen.find(h => h.shensha.level === '大');
    const small = guiRen.find(h => h.shensha.level === '小');
    expect(big!.pillar).toBe('hour');
    expect(big!.shensha.source).toBe('年干');
    expect(small!.pillar).toBe('month');
    expect(small!.shensha.source).toBe('日干');
  });
});

describe('shensha: 基准盘天干类神煞（双轴对拍图1.2）', () => {
  const hits = findTianganShensha(BASE_YEAR_GAN, BASE_DAY_GAN, BASE_MONTH_ZHI, BASELINE_PILLARS);

  it('文昌大小并存：大在月柱（年干乙→午）、小在时柱（日干辛→子）', () => {
    const wenchang = hits.filter(h => h.shensha.name === '文昌');
    expect(wenchang.length).toBe(2);
    const big = wenchang.find(h => h.shensha.level === '大')!;
    const small = wenchang.find(h => h.shensha.level === '小')!;
    expect(big.pillar).toBe('month');
    expect(big.shensha.source).toBe('年干');
    expect(small.pillar).toBe('hour');
    expect(small.shensha.source).toBe('日干');
  });

  it('学堂大小并存：大在月柱（乙→午）、小在时柱（辛→子）', () => {
    const xuetaang = hits.filter(h => h.shensha.name === '学堂');
    expect(xuetaang.length).toBe(2);
    expect(xuetaang.map(h => h.pillar).sort()).toEqual(['hour', 'month']);
  });

  it('太极贵人：大在月柱+时柱（年干乙→子午命中午/子）；日干辛→寅亥不命中', () => {
    const taiji = hits.filter(h => h.shensha.name === '太极贵人');
    expect(taiji.length).toBe(2);
    expect(taiji.every(h => h.shensha.level === '大')).toBe(true);
    expect(taiji.map(h => h.pillar).sort()).toEqual(['hour', 'month']);
  });

  it('词馆：小词馆在时柱（日干辛→子）', () => {
    const ciguan = hits.filter(h => h.shensha.name === '词馆');
    expect(ciguan.length).toBe(1);
    expect(ciguan[0].pillar).toBe('hour');
    expect(ciguan[0].shensha.level).toBe('小');
  });

  it('福星贵人：大在年柱+日柱（年干乙→寅卯命中卯）；日干辛→巳酉不命中', () => {
    const fuxing = hits.filter(h => h.shensha.name === '福星贵人');
    expect(fuxing.length).toBe(2);
    expect(fuxing.every(h => h.shensha.level === '大')).toBe(true);
    expect(fuxing.map(h => h.pillar).sort()).toEqual(['day', 'year']);
  });

  it('月德合在日柱（午月→辛，source=月支）', () => {
    const yuedeHe = hits.filter(h => h.shensha.name === '月德合');
    expect(yuedeHe.length).toBe(1);
    expect(yuedeHe[0].pillar).toBe('day');
    expect(yuedeHe[0].shensha.source).toBe('月支');
    expect(yuedeHe[0].shensha.level).toBeNull();
  });

  it('阴差阳错在日柱（辛卯日，source=日柱）', () => {
    const ycc = hits.filter(h => h.shensha.name === '阴差阳错');
    expect(ycc.length).toBe(1);
    expect(ycc[0].pillar).toBe('day');
    expect(ycc[0].shensha.source).toBe('日柱');
  });

  it('无月德（午月→丙，四柱无丙天干）', () => {
    const yuede = hits.filter(h => h.shensha.name === '月德');
    expect(yuede.length).toBe(0);
  });
});

describe('shensha: 地支类神煞（年支大 + 日支小 并存）', () => {
  const hits = findDizhiShensha('卯', '卯', BASELINE_PILLARS);

  it('大桃花在时柱（年支卯→亥卯未→桃花子，时支子）', () => {
    const taohua = hits.filter(h => h.shensha.name === '桃花' && h.shensha.level === '大');
    expect(taohua.length).toBe(1);
    expect(taohua[0].pillar).toBe('hour');
    expect(taohua[0].shensha.source).toBe('年支');
  });

  it('小桃花在时柱（日支卯→亥卯未→桃花子，时支子）', () => {
    const taohua = hits.filter(h => h.shensha.name === '桃花' && h.shensha.level === '小');
    expect(taohua.length).toBe(1);
    expect(taohua[0].pillar).toBe('hour');
    expect(taohua[0].shensha.source).toBe('日支');
  });

  it('大桃花与小桃花并存（不二选一）', () => {
    const taohua = hits.filter(h => h.shensha.name === '桃花');
    expect(taohua.length).toBe(2); // 大+小
    const levels = taohua.map(h => h.shensha.level);
    expect(levels).toContain('大');
    expect(levels).toContain('小');
  });

  it('大将星在年柱+日柱（年支卯→亥卯未→将星卯）', () => {
    const jiangxing = hits.filter(h => h.shensha.name === '将星' && h.shensha.level === '大');
    expect(jiangxing.length).toBe(2); // 年柱(卯) + 日柱(卯)
    const positions = jiangxing.map(h => h.pillar).sort();
    expect(positions).toEqual(['day', 'year']);
  });

  it('小将星在年柱+日柱（日支卯→亥卯未→将星卯）', () => {
    const jiangxing = hits.filter(h => h.shensha.name === '将星' && h.shensha.level === '小');
    expect(jiangxing.length).toBe(2);
  });

  it('大红鸾在时柱（年支卯→红鸾子，时支子）', () => {
    const hongluan = hits.filter(h => h.shensha.name === '红鸾' && h.shensha.level === '大');
    expect(hongluan.length).toBe(1);
    expect(hongluan[0].pillar).toBe('hour');
  });

  it('无大驿马（年支卯→亥卯未→驿马巳，四柱无巳）', () => {
    const yima = hits.filter(h => h.shensha.name === '驿马' && h.shensha.level === '大');
    expect(yima.length).toBe(0);
  });

  it('无大华盖（年支卯→亥卯未→华盖未，四柱无未）', () => {
    const huagai = hits.filter(h => h.shensha.name === '华盖' && h.shensha.level === '大');
    expect(huagai.length).toBe(0);
  });
});

describe('shensha: paipan 集成验证（图1.2 逐柱对拍）', () => {
  it('年柱=福星贵人(大)+将星(大/小)', async () => {
    const r = await paipan({
      year: 1975, month: 6, day: 14, hour: 0, minute: 30,
      gender: 'female', calendar: 'solar',
    });
    const s = r.pillars.year.shensha;
    expect(s.some(x => x.name === '福星贵人' && x.level === '大')).toBe(true);
    expect(s.some(x => x.name === '将星' && x.level === '大')).toBe(true);
    expect(s.some(x => x.name === '将星' && x.level === '小')).toBe(true);
  });

  it('月柱=文昌(大)+太极贵人(大)+天喜(大)+六厄(小)+天乙贵人(小)', async () => {
    const r = await paipan({
      year: 1975, month: 6, day: 14, hour: 0, minute: 30,
      gender: 'female', calendar: 'solar',
    });
    const s = r.pillars.month.shensha;
    expect(s.some(x => x.name === '文昌' && x.level === '大')).toBe(true);
    expect(s.some(x => x.name === '太极贵人' && x.level === '大')).toBe(true);
    expect(s.some(x => x.name === '天喜' && x.level === '大')).toBe(true);
    expect(s.some(x => x.name === '六厄' && x.level === '小')).toBe(true);
    expect(s.some(x => x.name === '天乙贵人' && x.level === '小')).toBe(true);
  });

  it('日柱=福星贵人(大)+将星(小)+月德合+阴差阳错', async () => {
    const r = await paipan({
      year: 1975, month: 6, day: 14, hour: 0, minute: 30,
      gender: 'female', calendar: 'solar',
    });
    const s = r.pillars.day.shensha;
    expect(s.some(x => x.name === '福星贵人' && x.level === '大')).toBe(true);
    expect(s.some(x => x.name === '将星' && x.level === '小')).toBe(true);
    expect(s.some(x => x.name === '月德合')).toBe(true);
    expect(s.some(x => x.name === '阴差阳错')).toBe(true);
  });

  it('时柱=天乙贵人(大)+太极贵人(大)+红鸾(大)+桃花(大/小)+文昌/学堂/词馆(小)', async () => {
    const r = await paipan({
      year: 1975, month: 6, day: 14, hour: 0, minute: 30,
      gender: 'female', calendar: 'solar',
    });
    const s = r.pillars.hour.shensha;
    expect(s.some(x => x.name === '天乙贵人' && x.level === '大')).toBe(true);
    expect(s.some(x => x.name === '太极贵人' && x.level === '大')).toBe(true);
    expect(s.some(x => x.name === '红鸾' && x.level === '大')).toBe(true);
    expect(s.some(x => x.name === '桃花' && x.level === '大')).toBe(true);
    expect(s.some(x => x.name === '桃花' && x.level === '小')).toBe(true);
    expect(s.some(x => x.name === '文昌' && x.level === '小')).toBe(true);
    expect(s.some(x => x.name === '学堂' && x.level === '小')).toBe(true);
    expect(s.some(x => x.name === '词馆' && x.level === '小')).toBe(true);
  });

  it('神煞输出带合法 level 与 source', async () => {
    const r = await paipan({
      year: 1975, month: 6, day: 14, hour: 0, minute: 30,
      gender: 'female', calendar: 'solar',
    });

    for (const pos of ['year', 'month', 'day', 'hour'] as const) {
      for (const s of r.pillars[pos].shensha) {
        expect(s.name).toBeTruthy();
        expect([null, '大', '小']).toContain(s.level);
        expect(['年干', '日干', '年支', '日支', '月支', '日柱']).toContain(s.source);
      }
    }
  });
});

describe('shensha: 天乙贵人完整歌诀覆盖（config 锁死）', () => {
  it('十天干各有两个贵人', () => {
    const tianGan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    for (const g of tianGan) {
      const guiRen = SHENSHA.tianyiGuiRen[g];
      expect(guiRen.length).toBe(2);
    }
  });

  it('甲戊庚均→丑未（牛羊）', () => {
    expect(SHENSHA.tianyiGuiRen.甲).toEqual(['丑', '未']);
    expect(SHENSHA.tianyiGuiRen.戊).toEqual(['丑', '未']);
    expect(SHENSHA.tianyiGuiRen.庚).toEqual(['丑', '未']);
  });

  it('干查双轴基准锁 config.SHENSHA.tiangan（年干大/日干小）', () => {
    expect(SHENSHA.tiangan.big).toBe('yearGan');
    expect(SHENSHA.tiangan.small).toBe('dayGan');
  });
});

describe('shensha: 自坐地势/支神', () => {
  it('自坐地势：乙卯→临官、壬午→胎、辛卯→绝、戊子→胎', async () => {
    const r = await paipan({
      year: 1975, month: 6, day: 14, hour: 0, minute: 30,
      gender: 'female', calendar: 'solar',
    });
    expect(r.pillars.year.zizuo).toBe('临官');
    expect(r.pillars.month.zizuo).toBe('胎');
    expect(r.pillars.day.zizuo).toBe('绝');
    expect(r.pillars.hour.zizuo).toBe('胎');
  });

  it('支神：月柱午藏丁己 → 七杀/偏印（对日干辛）', async () => {
    const r = await paipan({
      year: 1975, month: 6, day: 14, hour: 0, minute: 30,
      gender: 'female', calendar: 'solar',
    });
    expect(r.pillars.month.zhishen).toEqual(['七杀', '偏印']);
    expect(r.pillars.hour.zhishen).toEqual(['食神']);
  });
});
