import { describe, it, expect } from 'vitest';
import { applyHardFilters } from '@/lib/naming/hardFilter';
import type { CharMeta } from '@/lib/naming/charMeta';

/** 合成字元数据：默认可过 ⑤（freqRank=300）与③（拼音 a）的基线 */
function cm(char: string, over: Partial<CharMeta> = {}): CharMeta {
  return {
    pinyin: 'a', pinyinList: ['a'], shengmu: '', yunmu: 'a', tone: 1, pingze: '平',
    strokeKangxi: 7, strokeSimple: 7, wuxing: '土', radical: '一', freqRank: 300,
    ...over, char,
  };
}

describe('hardFilter 六项硬过滤', () => {
  it('① 忌神五行一票否决；喜用/中性放行；无喜用入参则跳过', () => {
    const xiYong = { yong: ['土'], xi: ['金'], ji: ['水'] };
    const fail = applyHardFilters({ given: [cm('涵', { wuxing: '水' })], xiYong });
    expect(fail.pass).toBe(false);
    expect(fail.reasons.some(r => r.rule === 'xiyong')).toBe(true);

    const pass = applyHardFilters({ given: [cm('鑫', { wuxing: '金' })], xiYong });
    expect(pass.reasons.some(r => r.rule === 'xiyong')).toBe(false);

    const skipped = applyHardFilters({ given: [cm('涵', { wuxing: '水' })] });
    expect(skipped.reasons.some(r => r.rule === 'xiyong')).toBe(false);
  });

  it('② 数理：人格凶 → 否决；吉配置 → 通过（李7+浩11+然12）', () => {
    const li = cm('李', { strokeKangxi: 7 });
    const bad = applyHardFilters({
      surname: li,
      given: [cm('释', { strokeKangxi: 20 }), cm('坚', { strokeKangxi: 7 })],
    });
    expect(bad.reasons.some(r => r.rule === 'wuge' && r.detail.includes('27'))).toBe(true);

    const good = applyHardFilters({
      surname: li,
      given: [cm('浩', { strokeKangxi: 11 }), cm('然', { strokeKangxi: 12 })],
    });
    expect(good.reasons.some(r => r.rule === 'wuge')).toBe(false);
    expect(good.pass).toBe(true);
  });

  it('③ 谐音黑名单：sha+ren 否决；正常组合通过', () => {
    const bad = applyHardFilters({ given: [cm('莎', { pinyin: 'shā' }), cm('仁', { pinyin: 'rén' })] });
    expect(bad.reasons.some(r => r.rule === 'homophone' && r.detail.includes('sha ren'))).toBe(true);

    const good = applyHardFilters({ given: [cm('浩', { pinyin: 'hào' }), cm('然', { pinyin: 'rán' })] });
    expect(good.reasons.some(r => r.rule === 'homophone')).toBe(false);
  });

  it('④ 避讳：长辈用字 / 历史负面人物 / 品牌', () => {
    const user = applyHardFilters({ given: [cm('伟')], tabooNames: ['伟伟'] });
    expect(user.reasons.some(r => r.rule === 'taboo' && r.detail.includes('伟伟'))).toBe(true);

    const figure = applyHardFilters({ given: [cm('桧')] });
    expect(figure.reasons.some(r => r.rule === 'taboo')).toBe(true);

    const brand = applyHardFilters({ given: [cm('小'), cm('米')] });
    expect(brand.reasons.some(r => r.rule === 'taboo' && r.detail.includes('小米'))).toBe(true);
  });

  it('⑤ 生僻字：无频次或超 8000 否决；边界 8000 通过', () => {
    const none = applyHardFilters({ given: [cm('罕', { freqRank: undefined })] });
    expect(none.reasons.some(r => r.rule === 'rare')).toBe(true);

    const over = applyHardFilters({ given: [cm('罕', { freqRank: 8001 })] });
    expect(over.reasons.some(r => r.rule === 'rare')).toBe(true);

    const edge = applyHardFilters({ given: [cm('和', { freqRank: 8000 })] });
    expect(edge.reasons.some(r => r.rule === 'rare')).toBe(false);
    expect(edge.pass).toBe(true);
  });

  it('⑥ 流行度仅标注：分级确定，不影响 pass', () => {
    expect(applyHardFilters({ given: [cm('一', { freqRank: 100 })] }).popularityLabel).toBe('常见');
    expect(applyHardFilters({ given: [cm('和', { freqRank: 2000 })] }).popularityLabel).toBe('较常见');
    expect(applyHardFilters({ given: [cm('玚', { freqRank: 7000 })] }).popularityLabel).toBe('少见');

    const res = applyHardFilters({ given: [cm('伟')], tabooNames: ['伟'] });
    expect(res.pass).toBe(false);
    expect(res.popularityLabel).toBe('常见');
  });
});
