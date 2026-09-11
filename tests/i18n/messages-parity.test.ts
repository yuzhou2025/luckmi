/**
 * i18n 消息包键对齐测试
 * 确保 en.json 与 zh.json 结构一致：相同 namespace、相同 leaf key。
 * 防止新增词条时遗漏对应语言，导致运行时 fallback 或渲染空白。
 */
import { describe, it, expect } from 'vitest';
import en from '../../messages/en.json';
import zh from '../../messages/zh.json';

type Obj = Record<string, unknown>;

/** 递归收集所有 leaf key 路径（namespace.sub.key） */
function leafKeys(obj: Obj, prefix = ''): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      out.push(...leafKeys(v as Obj, path));
    } else {
      out.push(path);
    }
  }
  return out.sort();
}

describe('i18n: messages parity (en ↔ zh)', () => {
  const enKeys = leafKeys(en as Obj);
  const zhKeys = leafKeys(zh as Obj);

  it('en 与 zh 的 namespace 数量一致', () => {
    expect(Object.keys(en).length).toBe(Object.keys(zh).length);
  });

  it('en 与 zh 的 leaf key 集合完全一致', () => {
    const enOnly = enKeys.filter(k => !zhKeys.includes(k));
    const zhOnly = zhKeys.filter(k => !enKeys.includes(k));
    expect(enOnly).toEqual([]);
    expect(zhOnly).toEqual([]);
  });

  it('所有 leaf 值均为非空字符串', () => {
    const check = (obj: Obj, prefix: string): string[] => {
      const empty: string[] = [];
      for (const [k, v] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${k}` : k;
        if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
          empty.push(...check(v as Obj, path));
        } else if (typeof v !== 'string' || v.trim() === '') {
          empty.push(path);
        }
      }
      return empty;
    };
    expect(check(en as Obj, '')).toEqual([]);
    expect(check(zh as Obj, '')).toEqual([]);
  });
});
