import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { translitName, splitSyllables, TRANSLIT_SEED } from '@/lib/naming/translit';
import { loadCharMeta } from '@/lib/naming/charMeta';

const hasData = existsSync(path.join(process.cwd(), 'data', 'char-meta'));

describe('splitSyllables（元音组切分）', () => {
  it('Kai 不拆复韵母', () => {
    expect(splitSyllables('Kai')).toEqual(['kai']);
  });
  it('Anna → a + nna（组间辅音并入下一音节）', () => {
    expect(splitSyllables('Anna')).toEqual(['a', 'nna']);
  });
  it('尾部辅音并入上一音节', () => {
    expect(splitSyllables('Noah')).toEqual(['no', 'ah']);
  });
});

describe.skipIf(!hasData)('translitName（真实字库）', () => {
  const meta = loadCharMeta();

  it('seed 命中：Ethan → yi+sen 两簇，含 伊/森，簇上限 8', () => {
    const clusters = translitName('Ethan', meta)!;
    expect(clusters).toHaveLength(2);
    expect(clusters[0]).toMatchObject({ mandarin: 'yi', source: 'seed' });
    expect(clusters[0].candidates.some(c => c.char === '伊')).toBe(true);
    expect(clusters[1].candidates.some(c => c.char === '森')).toBe(true);
    expect(clusters[0].candidates.length).toBeLessThanOrEqual(8);
  });

  it('fuzzy 回退：Kai → kai 簇含 凯（默认读音+高频优先），候选全部 toneless 匹配且可入名', () => {
    const clusters = translitName('Kai', meta)!;
    expect(clusters).toHaveLength(1);
    expect(clusters[0].source).toBe('fuzzy');
    expect(clusters[0].candidates.some(c => c.char === '凯')).toBe(true);
    for (const cand of clusters[0].candidates) {
      const keys = cand.pinyinList.map(p => p.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
      expect(keys).toContain(clusters[0].mandarin);
      expect(cand.nameable).not.toBe(false);
    }
  });

  it('不可音译：Xylo → xy 音节零候选 → null（不产出废名）', () => {
    expect(translitName('Xylo', meta)).toBeNull();
  });

  it('大小写与空白归一：ETHAN 与 ethan 同结果', () => {
    const a = translitName('ETHAN', meta);
    const b = translitName('ethan', meta);
    expect(a?.map(c => c.mandarin)).toEqual(b?.map(c => c.mandarin));
  });
});

describe('TRANSLIT_SEED 结构', () => {
  it('音节均为小写字母串，名字无空键，chars 与音节一一对应', () => {
    for (const [name, entry] of Object.entries(TRANSLIT_SEED)) {
      expect(name.length, name).toBeGreaterThan(1);
      expect(entry.syllables.length, name).toBeGreaterThanOrEqual(2);
      for (const syl of entry.syllables) {
        expect(syl).toMatch(/^[a-z]+$/);
      }
      if (entry.chars) {
        expect(entry.chars, name).toHaveLength(entry.syllables.length);
        for (const ch of entry.chars) {
          expect(ch, name).toMatch(/^[\u4e00-\u9fff]$/);
        }
      }
    }
  });
});
