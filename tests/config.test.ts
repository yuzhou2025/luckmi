/**
 * config.ts 单元测试
 * 确保派别参数、神煞基准、五行权重、格局开关锁死后不被意外修改。
 */
import { describe, it, expect } from 'vitest';
import {
  SECT,
  SHISHEN_AXIS,
  SHENSHA,
  WUXING_SCORE,
  CANGGAN_RATIO,
  XIYONG,
  PATTERN,
  ALLOWED_CLASSICS,
  SOLAR_TIME,
  LUCK_MAP,
} from '@/lib/bazi/config';

describe('config: 派别参数', () => {
  it('年柱以立春为界', () => {
    expect(SECT.yearBoundary).toBe('lichun');
  });

  it('晚子时不翻日', () => {
    expect(SECT.lateHourDayCross).toBe(false);
  });

  it('早子时归当日', () => {
    expect(SECT.earlyZiSameDay).toBe(true);
  });
});

describe('config: 十神轴', () => {
  it('十神以日干为轴', () => {
    expect(SHISHEN_AXIS).toBe('dayGan');
  });
});

describe('config: 神煞查表基准', () => {
  it('天干类：年干查大 + 日干查小', () => {
    expect(SHENSHA.tiangan.big).toBe('yearGan');
    expect(SHENSHA.tiangan.small).toBe('dayGan');
  });

  it('地支类：年支查大 + 日支查小', () => {
    expect(SHENSHA.dizhi.big).toBe('yearZhi');
    expect(SHENSHA.dizhi.small).toBe('dayZhi');
  });

  it('天乙贵人锁甲戊庚牛羊（丑未）', () => {
    expect(SHENSHA.tianyiGuiRen.甲).toEqual(['丑', '未']);
    expect(SHENSHA.tianyiGuiRen.戊).toEqual(['丑', '未']);
    expect(SHENSHA.tianyiGuiRen.庚).toEqual(['丑', '未']);
  });

  it('天乙贵人覆盖十天干', () => {
    const tianGan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    for (const g of tianGan) {
      expect(SHENSHA.tianyiGuiRen[g]).toBeDefined();
      expect(SHENSHA.tianyiGuiRen[g].length).toBe(2);
    }
  });
});

describe('config: 五行量化计分 V1.1（曲炜版本二位置权重）', () => {
  it('位置权重合计 = 100（日干不计入）', () => {
    const p = WUXING_SCORE.position;
    const sum = p.yearGan + p.yearZhi + p.monthGan + p.monthZhi
      + p.dayZhi + p.hourGan + p.hourZhi;
    expect(sum).toBe(100);
  });

  it('月支 40 为最高权重（月令提纲）', () => {
    const p = WUXING_SCORE.position;
    expect(p.monthZhi).toBe(40);
    expect(p.monthZhi).toBeGreaterThan(p.monthGan);
    expect(p.monthZhi).toBeGreaterThan(p.dayZhi);
  });

  it('通根折扣：本气1.0 > 中气0.7 > 余气0.4 > 虚浮0.3', () => {
    const r = WUXING_SCORE.root;
    expect(r.benqi).toBe(1.0);
    expect(r.benqi).toBeGreaterThan(r.zhongqi);
    expect(r.zhongqi).toBeGreaterThan(r.yuqi);
    expect(r.yuqi).toBeGreaterThan(r.float);
  });

  it('地支作用系数：冲0.5 < 刑0.8 < 害0.9 < 破0.95 < 1；合局1.5', () => {
    const i = WUXING_SCORE.interaction;
    expect(i.chong).toBe(0.5);
    expect(i.xingFull).toBe(0.8);
    expect(i.xingPair).toBe(0.85);
    expect(i.hai).toBe(0.9);
    expect(i.po).toBe(0.95);
    expect(i.bureau).toBe(1.5);
    expect(i.bureauOther).toBe(0.3);
  });

  it('盖头截脚系数 0.8；月令旺相休囚死 1.2/1.1/1.0/0.7/0.5', () => {
    expect(WUXING_SCORE.gaitouJiejiao).toBe(0.8);
    const w = WUXING_SCORE.wangxiang;
    expect([w.wang, w.xiang, w.xiu, w.qiu, w.si]).toEqual([1.2, 1.1, 1.0, 0.7, 0.5]);
  });

  it('藏干比例：子卯酉纯气 100% 单项', () => {
    for (const zhi of ['子', '卯', '酉']) {
      const parts = CANGGAN_RATIO[zhi];
      expect(parts.length).toBe(1);
      expect(parts[0].ratio).toBe(1.0);
    }
  });

  it('藏干比例：午 = 丁火70% + 己土30%', () => {
    expect(CANGGAN_RATIO.午).toEqual([
      { gan: '丁', ratio: 0.7 },
      { gan: '己', ratio: 0.3 },
    ]);
  });

  it('藏干比例：其余地支本气60%/中气30%/余气10%，每支合计=1', () => {
    for (const [zhi, parts] of Object.entries(CANGGAN_RATIO)) {
      const sum = parts.reduce((s, p) => s + p.ratio, 0);
      expect(sum).toBeCloseTo(1.0, 10);
      if (zhi !== '子' && zhi !== '卯' && zhi !== '酉' && zhi !== '午') {
        expect(parts.length).toBe(3);
        expect(parts[0].ratio).toBe(0.6);
        expect(parts[1].ratio).toBe(0.3);
        expect(parts[2].ratio).toBe(0.1);
      }
    }
  });
});

describe('config: 喜用口径', () => {
  it('扶抑法为主', () => {
    expect(XIYONG.method).toBe('fuyi');
  });

  it('调候仅标注不参与合成', () => {
    expect(XIYONG.tiaohouLabelOnly).toBe(true);
  });
});

describe('config: 格局', () => {
  it('开启八正格', () => {
    expect(PATTERN.enableBazheng).toBe(true);
  });

  it('不识别从格化格', () => {
    expect(PATTERN.enableCongHua).toBe(false);
  });

  it('不识别专旺', () => {
    expect(PATTERN.enableZhuanWang).toBe(false);
  });

  it('不确定时输出 null', () => {
    expect(PATTERN.outputNullWhenUncertain).toBe(true);
  });
});

describe('config: 古籍引用范围', () => {
  it('仅限四体书', () => {
    expect(ALLOWED_CLASSICS).toEqual(['渊海子平', '子平真诠', '穷通宝鉴', '三命通会']);
  });
});

describe('config: 真太阳时', () => {
  it('统一转东八区真太阳时', () => {
    expect(SOLAR_TIME.toEast8TrueSolar).toBe(true);
  });

  it('东八区基准经度 120°', () => {
    expect(SOLAR_TIME.baseLongitude).toBe(120);
  });

  it('夏令时自动检测', () => {
    expect(SOLAR_TIME.dstAutoDetect).toBe(true);
  });
});

describe('config: 幸运映射', () => {
  it('五行全覆盖', () => {
    const wuxing = ['木', '火', '土', '金', '水'];
    for (const w of wuxing) {
      expect(LUCK_MAP[w]).toBeDefined();
      expect(LUCK_MAP[w].colors.length).toBeGreaterThan(0);
      expect(LUCK_MAP[w].directions.length).toBeGreaterThan(0);
      expect(LUCK_MAP[w].numbers.length).toBeGreaterThan(0);
    }
  });

  it('金→白/金、西/西北、4/9', () => {
    expect(LUCK_MAP.金.colors).toEqual(['白', '金']);
    expect(LUCK_MAP.金.directions).toEqual(['西', '西北']);
    expect(LUCK_MAP.金.numbers).toEqual([4, 9]);
  });
});
