import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { SEMANTIC_SEED, semanticName } from '@/lib/naming/semantic';
import { loadCharMeta } from '@/lib/naming/charMeta';

const hasData = existsSync(path.join(process.cwd(), 'data', 'char-meta'));

describe.skipIf(!hasData)('semanticName（真实字库）', () => {
  const meta = loadCharMeta();

  it('Ethan → 坚定语义，候选含 坚/恒', () => {
    const match = semanticName('Ethan', meta)!;
    expect(match.name).toBe('ethan');
    expect(match.meaning).toContain('坚定');
    expect(match.candidates.map(c => c.char)).toEqual(expect.arrayContaining(['坚', '恒']));
  });

  it('未知英文名返回 null', () => {
    expect(semanticName('Zyxwv', meta)).toBeNull();
  });

  it('种子表全部条目在字库中至少 1 个有效候选（nameable 未否决）', () => {
    for (const [name, entry] of Object.entries(SEMANTIC_SEED)) {
      const valid = entry.chars.filter(c => {
        const m = meta.get(c);
        return m && m.nameable !== false;
      });
      expect(valid.length, `${name}(${entry.chars.join('')})`).toBeGreaterThan(0);
    }
  });
});

describe('SEMANTIC_SEED 结构', () => {
  it('每条目 ≥3 字、无重复字、meaning 非空', () => {
    for (const [name, entry] of Object.entries(SEMANTIC_SEED)) {
      expect(entry.chars.length, name).toBeGreaterThanOrEqual(3);
      expect(new Set(entry.chars).size, name).toBe(entry.chars.length);
      expect(entry.meaning.length, name).toBeGreaterThan(0);
    }
  });
});
