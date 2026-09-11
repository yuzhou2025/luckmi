/**
 * duanyu.ts 断语出处库测试（规则 13/14）
 * - 出处必须限于 config.ALLOWED_CLASSICS 四书
 * - id 唯一、text 非空且为中文义理摘要
 * - pattern 匹配键必须是八正格名
 * - 十神/四季/旺衰三档覆盖完整
 * - getDuanyu 无匹配返回 []（不编造）
 * - 全库 snapshot 锁定，改动须显式更新快照
 */
import { describe, it, expect } from 'vitest';
import { ALLOWED_CLASSICS } from '@/lib/bazi/config';
import { DUANYU, getDuanyu, getAllDuanyu, type DuanyuEntry } from '@/lib/bazi/duanyu';

const CLASSIC_SET = new Set<string>(ALLOWED_CLASSICS);
const CJK = /[\u4e00-\u9fff]/;

const BAZHENG_GE = ['正官格', '七杀格', '正财格', '偏财格', '正印格', '偏印格', '食神格', '伤官格'];
const SHISHEN_10 = ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'];
const SEASONS = ['春', '夏', '秋', '冬'];
const STRENGTH_KEYS = ['身弱', '身强', '中和'];
const VALID_TOPICS = ['pattern', 'shishen', 'tiaohou', 'strength'];

describe('duanyu: 条目结构与出处白名单', () => {
  it('库非空', () => {
    expect(DUANYU.length).toBeGreaterThan(0);
  });

  it('每条 source ∈ ALLOWED_CLASSICS（四书白名单）', () => {
    const bad = DUANYU.filter(e => !CLASSIC_SET.has(e.source));
    expect(bad.map(e => `${e.id}:${e.source}`)).toEqual([]);
  });

  it('id 全局唯一', () => {
    const ids = DUANYU.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('topic 仅取四类', () => {
    const bad = DUANYU.filter(e => !VALID_TOPICS.includes(e.topic));
    expect(bad.map(e => e.id)).toEqual([]);
  });

  it('text 非空、含中文、长度 ≥ 8（义理摘要而非词头）', () => {
    const bad = DUANYU.filter(e => !e.text || !CJK.test(e.text) || e.text.trim().length < 8);
    expect(bad.map(e => e.id)).toEqual([]);
  });

  it('matchKey 非空', () => {
    const bad = DUANYU.filter(e => !e.matchKey || !e.matchKey.trim());
    expect(bad.map(e => e.id)).toEqual([]);
  });
});

describe('duanyu: pattern 主题口径（《子平真诠》八正格）', () => {
  const pats = DUANYU.filter(e => e.topic === 'pattern');

  it('matchKey 必须是八正格名', () => {
    const bad = pats.filter(e => !BAZHENG_GE.includes(e.matchKey));
    expect(bad.map(e => `${e.id}:${e.matchKey}`)).toEqual([]);
  });

  it('source 均为 子平真诠', () => {
    const bad = pats.filter(e => e.source !== '子平真诠');
    expect(bad.map(e => e.id)).toEqual([]);
  });

  it('matchSub（组合格）条目数量 ≤ 主格通条，且 matchSub 非空', () => {
    const subs = pats.filter(e => e.matchSub !== undefined);
    expect(subs.every(e => (e.matchSub ?? '').length > 0)).toBe(true);
    expect(subs.length).toBeLessThanOrEqual(pats.length - subs.length);
  });

  it('八正格每格至少 1 条主格通条', () => {
    const generic = new Set(pats.filter(e => e.matchSub === undefined).map(e => e.matchKey));
    const missing = BAZHENG_GE.filter(g => !generic.has(g));
    expect(missing).toEqual([]);
  });
});

describe('duanyu: shishen 主题覆盖（《渊海子平》十神定性）', () => {
  it('十神每个至少 1 条，source 均为 渊海子平', () => {
    for (const ss of SHISHEN_10) {
      const got = getDuanyu('shishen', ss);
      expect(got.length, `十神 ${ss} 缺断语`).toBeGreaterThan(0);
      expect(got.every(e => e.source === '渊海子平')).toBe(true);
    }
  });
});

describe('duanyu: tiaohou 主题覆盖（《穷通宝鉴》寒暖燥湿）', () => {
  it('四季每季至少 1 条，source 均为 穷通宝鉴', () => {
    for (const s of SEASONS) {
      const got = getDuanyu('tiaohou', s);
      expect(got.length, `季节 ${s} 缺断语`).toBeGreaterThan(0);
      expect(got.every(e => e.source === '穷通宝鉴')).toBe(true);
    }
  });
});

describe('duanyu: strength 主题覆盖（《三命通会》旺衰扶抑）', () => {
  it('身弱/身强/中和各有 1 条，source 均为 三命通会', () => {
    for (const k of STRENGTH_KEYS) {
      const got = getDuanyu('strength', k);
      expect(got.length, `旺衰 ${k} 缺断语`).toBeGreaterThan(0);
      expect(got.every(e => e.source === '三命通会')).toBe(true);
    }
  });
});

describe('duanyu: getDuanyu 查询行为', () => {
  it('七杀格主格通条存在且为 子平真诠', () => {
    const got = getDuanyu('pattern', '七杀格');
    expect(got.length).toBeGreaterThan(0);
    expect(got.every(e => e.source === '子平真诠')).toBe(true);
  });

  it('七杀格 + 杀印相生：返回主格通条 + 组合专条', () => {
    const got = getDuanyu('pattern', '七杀格', '杀印相生');
    const subs = got.filter(e => e.matchSub === '杀印相生');
    expect(subs.length).toBe(1);
    // 主格通条（matchSub undefined）也在
    expect(got.some(e => e.matchSub === undefined)).toBe(true);
  });

  it('七杀格 + 不存在的组合：仅返回主格通条', () => {
    const got = getDuanyu('pattern', '七杀格', '不存在组合');
    expect(got.length).toBeGreaterThan(0);
    expect(got.every(e => e.matchSub === undefined)).toBe(true);
  });

  it('未传 matchSub 时不返回组合专条', () => {
    const got = getDuanyu('pattern', '七杀格');
    expect(got.every(e => e.matchSub === undefined)).toBe(true);
  });

  it('无匹配（不存在格局）返回空数组，不编造', () => {
    expect(getDuanyu('pattern', '从格')).toEqual([]);
    expect(getDuanyu('shishen', '未知神')).toEqual([]);
    expect(getDuanyu('tiaohou', '梅雨季')).toEqual([]);
  });

  it('shishen 主题忽略 matchSub 参数', () => {
    const a = getDuanyu('shishen', '正官');
    const b = getDuanyu('shishen', '正官', 'ignored');
    expect(b).toEqual(a);
  });
});

describe('duanyu: 全库 snapshot', () => {
  it('getAllDuanyu 与快照一致（改动须显式更新）', () => {
    const all: DuanyuEntry[] = getAllDuanyu();
    // snapshot 只锁 id/topic/matchKey/matchSub/source 与文本，保证审计可见
    expect(all.map(e => ({
      id: e.id, topic: e.topic, matchKey: e.matchKey,
      matchSub: e.matchSub ?? null, source: e.source, text: e.text,
    }))).toMatchSnapshot();
  });
});
