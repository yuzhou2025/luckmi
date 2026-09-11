import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { derivePhonology, loadCharMeta } from '@/lib/naming/charMeta';

describe('derivePhonology（pinyin-pro 口径）', () => {
  it('浩：声母 h 韵母 ao 阳平外四声，仄', () => {
    expect(derivePhonology('浩')).toEqual({
      pinyin: 'hào', shengmu: 'h', yunmu: 'ao', tone: 4, pingze: '仄',
    });
  });

  it('安：零声母，一声，平', () => {
    const p = derivePhonology('安');
    expect(p.shengmu).toBe('');
    expect(p.tone).toBe(1);
    expect(p.pingze).toBe('平');
  });

  it('然：二声，平', () => {
    const p = derivePhonology('然');
    expect(p.pinyin).toBe('rán');
    expect(p.tone).toBe(2);
    expect(p.pingze).toBe('平');
  });
});

const dataDir = path.join(process.cwd(), 'data', 'char-meta');
const hasData = existsSync(dataDir);

describe.skipIf(!hasData)('loadCharMeta（真实字库，构建产物）', () => {
  const meta = loadCharMeta();

  it('字库规模：2.5 万～3.5 万', () => {
    expect(meta.size).toBeGreaterThan(25000);
    expect(meta.size).toBeLessThan(35000);
  });

  it('康熙笔画锚点与数理测试交叉一致：李7 浩11 然12', () => {
    expect(meta.get('李')?.strokeKangxi).toBe(7);
    expect(meta.get('浩')?.strokeKangxi).toBe(11);
    expect(meta.get('然')?.strokeKangxi).toBe(12);
  });

  it('浩：五行水、读音 hào、拼音字段完整', () => {
    const hao = meta.get('浩');
    expect(hao).toBeTruthy();
    expect(hao?.wuxing).toBe('水');
    expect(hao?.pinyin).toBe('hào');
    expect(hao?.pinyinList).toContain('hào');
    expect(hao?.shengmu).toBe('h');
    expect(hao?.tone).toBe(4);
  });

  it('全库约束：五行合法、康熙笔画为正、读音非空', () => {
    let n = 0;
    for (const m of meta.values()) {
      expect(['金', '木', '水', '火', '土']).toContain(m.wuxing);
      expect(m.strokeKangxi).toBeGreaterThan(0);
      expect(m.pinyin.length).toBeGreaterThan(0);
      expect(m.pinyinList.length).toBeGreaterThan(0);
      if (++n >= 500) break; // 抽样 500 字足矣，全量断言拖慢测试
    }
  });
});
