/**
 * i18n 术语映射层测试
 * 确保 src/lib/i18n/terms.ts 的 TERM_MAP 每个映射目标（namespace.key）
 * 都真实存在于 en.json 与 zh.json，避免 termKey() 返回的 key 在 t() 调用时
 * 抛 "MISSING_MESSAGE" 或 fallback 到原始中文。
 */
import { describe, it, expect } from 'vitest';
import { termKey, abbrToFullName } from '@/lib/i18n/terms';
import en from '../../messages/en.json';
import zh from '../../messages/zh.json';

type Obj = Record<string, unknown>;

/** 按 "namespace.sub.key" 路径取值 */
function getByPath(obj: Obj, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, seg) => {
    if (acc !== null && typeof acc === 'object' && !Array.isArray(acc)) {
      return (acc as Obj)[seg] ?? null;
    }
    return null;
  }, obj);
}

describe('i18n: terms.ts TERM_MAP → messages 可解析', () => {
  const sampleTerms = [
    '比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印', '日主',
    '极弱型', '偏弱型', '中和型', '偏强型', '极强型',
    '极弱', '偏弱', '均衡', '偏强', '极强',
    '正官格', '七杀格', '正财格', '偏财格', '正印格', '偏印格', '食神格', '伤官格',
    '长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养',
    '旺', '相', '休', '囚',
    '天乙贵人', '文昌', '福星贵人', '学堂', '太极贵人', '词馆', '桃花', '驿马', '华盖', '将星',
    '冲', '克', '合', '刑', '破', '害', '生', '泄', '耗',
  ];

  it('所有示例术语都能被 termKey 解析（非 null）', () => {
    const unresolved = sampleTerms.filter(t => termKey(t) === null);
    expect(unresolved).toEqual([]);
  });

  it('termKey 映射目标在 en.json 中存在', () => {
    const missing: string[] = [];
    for (const term of sampleTerms) {
      const key = termKey(term);
      if (!key || getByPath(en as Obj, key) === null) missing.push(`${term} → ${key}`);
    }
    expect(missing).toEqual([]);
  });

  it('termKey 映射目标在 zh.json 中存在', () => {
    const missing: string[] = [];
    for (const term of sampleTerms) {
      const key = termKey(term);
      if (!key || getByPath(zh as Obj, key) === null) missing.push(`${term} → ${key}`);
    }
    expect(missing).toEqual([]);
  });
});

describe('i18n: abbrToFullName', () => {
  it('十神简称正确解析为全称', () => {
    expect(abbrToFullName('比')).toBe('比肩');
    expect(abbrToFullName('劫')).toBe('劫财');
    expect(abbrToFullName('食')).toBe('食神');
    expect(abbrToFullName('伤')).toBe('伤官');
    expect(abbrToFullName('财')).toBe('正财');
    expect(abbrToFullName('才')).toBe('偏财');
    expect(abbrToFullName('官')).toBe('正官');
    expect(abbrToFullName('杀')).toBe('七杀');
    expect(abbrToFullName('印')).toBe('正印');
    expect(abbrToFullName('卩')).toBe('偏印');
    expect(abbrToFullName('主')).toBe('日主');
  });

  it('未知简称默认返回日主', () => {
    expect(abbrToFullName('?')).toBe('日主');
  });
});
