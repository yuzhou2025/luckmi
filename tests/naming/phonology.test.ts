import { describe, it, expect } from 'vitest';
import { getReadings, scorePhonology } from '@/lib/naming/phonology';
import type { CharMeta } from '@/lib/naming/charMeta';

const m = (char: string): CharMeta => ({
  char, pinyin: '', pinyinList: [], shengmu: '', yunmu: '', tone: 0,
  pingze: '平', strokeKangxi: 1, strokeSimple: 1, wuxing: '木', radical: '',
});

describe('getReadings（pinyin-pro 事实源，POLYPHONE.canonicalSource）', () => {
  it('浩：单读音 hào，声母 h 韵母 ao 四声', () => {
    const rs = getReadings('浩');
    expect(rs).toHaveLength(1);
    expect(rs[0]).toMatchObject({ full: 'hào', toneless: 'hao', shengmu: 'h', yunmu: 'ao', tone: 4 });
  });

  it('安：零声母一声', () => {
    const rs = getReadings('安');
    expect(rs[0].shengmu).toBe('');
    expect(rs[0].tone).toBe(1);
  });

  it('乐：多音字仲裁走 pinyin-pro，至少含 lè/yuè 两读', () => {
    const tl = getReadings('乐').map(r => r.toneless);
    expect(tl).toContain('le');
    expect(tl).toContain('yue');
  });
});

describe('scorePhonology', () => {
  it('李浩然：仄起平收封顶 1.0，声调流 仄仄平，零瑕疵', () => {
    const r = scorePhonology(m('李'), [m('浩'), m('然')]);
    expect(r.score).toBe(1);
    expect(r.toneFlow).toBe('仄仄平');
    expect(r.toneVariety).toBe(3);
    expect(r.issues).toHaveLength(0);
  });

  it('李立立：双声+叠韵连续触发，负分截断为 0', () => {
    const r = scorePhonology(m('李'), [m('立'), m('立')]);
    expect(r.score).toBe(0);
    expect(r.toneVariety).toBe(2);
    expect(r.issues).toHaveLength(4); // 双声×2 + 叠韵×2
  });

  it('音律分域：0..1 之间', () => {
    const r = scorePhonology(m('王'), [m('一'), m('一')]);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(1);
  });
});
