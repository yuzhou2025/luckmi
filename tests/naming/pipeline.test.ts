import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { generateNameCandidates } from '@/lib/naming/pipeline';
import { loadCharMeta } from '@/lib/naming/charMeta';

const hasData = existsSync(path.join(process.cwd(), 'data', 'char-meta'));

describe.skipIf(!hasData)('generateNameCandidates（真实字库）', () => {
  const meta = loadCharMeta();
  const wang = meta.get('王')!;

  it('Ethan + 喜土忌水：产出 ≥1 条、无忌神字、total 降序、结果确定', () => {
    const req = {
      englishName: 'Ethan',
      surname: wang,
      xiYong: { yong: ['土'], xi: ['金'], ji: ['水'] },
    };
    const r1 = generateNameCandidates(req, meta);
    expect(r1.length).toBeGreaterThan(0);
    expect(r1.length).toBeLessThanOrEqual(10);
    for (let i = 0; i < r1.length; i++) {
      const r = r1[i]!;
      expect(r.full.startsWith('王')).toBe(true);
      expect(r.given.every(g => g.wuxing !== '水')).toBe(true);
      expect(['常见', '较常见', '少见']).toContain(r.popularityLabel);
      expect(r.score.total).toBeLessThanOrEqual(100);
      if (i > 0) expect(r1[i - 1]!.score.total).toBeGreaterThanOrEqual(r.score.total);
    }
    const r2 = generateNameCandidates(req, meta);
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });

  it('避讳回灌：把首条结果用字加入 tabooNames 后，所有结果不含该字', () => {
    const base = generateNameCandidates({ englishName: 'Ethan', surname: wang }, meta);
    expect(base.length).toBeGreaterThan(0);
    const ban = base[0]!.given[0]!.char;
    const filtered = generateNameCandidates(
      { englishName: 'Ethan', surname: wang, tabooNames: [ban] },
      meta,
    );
    for (const r of filtered) {
      expect(r.given.some(g => g.char === ban)).toBe(false);
    }
  });

  it('不可音译且无意译：Xylo → 空数组（不产出废名）', () => {
    expect(generateNameCandidates({ englishName: 'Xylo', surname: wang }, meta)).toEqual([]);
  });

  it('单名豁免外格后：Kai → 含王凯候选（人17吉 总17吉 地13吉）', () => {
    const r = generateNameCandidates({ englishName: 'Kai', surname: wang }, meta);
    expect(r.length).toBeGreaterThan(0);
    expect(r.some(c => c.given.some(g => g.char === '凯'))).toBe(true);
    expect(r.every(c => c.full.startsWith('王'))).toBe(true);
  });

  it('空名/非字母入参 → 空数组', () => {
    expect(generateNameCandidates({ englishName: '123', surname: wang }, meta)).toEqual([]);
  });
});
