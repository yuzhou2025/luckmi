import { describe, it, expect } from 'vitest';
import { SHULI_TABLE, getShuli, calcWuge, checkWuge } from '@/lib/naming/numerology';

describe('81 数理表', () => {
  it('共 81 项，编号连续', () => {
    expect(SHULI_TABLE).toHaveLength(81);
    SHULI_TABLE.forEach((e, i) => expect(e.n).toBe(i + 1));
  });

  it('通行版口径：吉34 / 半吉18 / 凶29', () => {
    const count = (lv: string) => SHULI_TABLE.filter(e => e.level === lv).length;
    expect(count('吉')).toBe(34);
    expect(count('半吉')).toBe(18);
    expect(count('凶')).toBe(29);
  });

  it('锚点：21明月中天(吉) 24家门余庆(吉) 34破家亡身(凶) 81还本归元(吉)', () => {
    expect(getShuli(21)).toMatchObject({ level: '吉', phrase: '明月中天' });
    expect(getShuli(24)).toMatchObject({ level: '吉', phrase: '家门余庆' });
    expect(getShuli(34)).toMatchObject({ level: '凶', phrase: '破家亡身' });
    expect(getShuli(81)).toMatchObject({ level: '吉', phrase: '还本归元' });
  });

  it('81 循环：0→81，82→1，162→81', () => {
    expect(getShuli(0).n).toBe(81);
    expect(getShuli(82).n).toBe(1);
    expect(getShuli(162).n).toBe(81);
  });
});

describe('五格计算（康熙笔画）', () => {
  it('单姓复名：李(7)浩(11)然(12) → 天8 人18 地23 外13 总30，三才金金火', () => {
    const w = calcWuge({ surname: [7], given: [11, 12] });
    expect([w.tian, w.ren, w.di, w.wai, w.zong]).toEqual([8, 18, 23, 13, 30]);
    expect(w.sancai).toEqual(['金', '金', '火']);
    expect(w.entries.ren).toMatchObject({ n: 18, level: '吉' });
    expect(w.entries.zong).toMatchObject({ n: 30, level: '半吉' });
  });

  it('复姓单名：司马(5,10)光(6) → 天15 人16 地7 外6 总21，三才土土金', () => {
    const w = calcWuge({ surname: [5, 10], given: [6] });
    expect([w.tian, w.ren, w.di, w.wai, w.zong]).toEqual([15, 16, 7, 6, 21]);
    expect(w.sancai).toEqual(['土', '土', '金']);
  });

  it('单姓单名：王(4)三(3) → 地格4凶，默认口径不过', () => {
    const w = calcWuge({ surname: [4], given: [3] });
    expect([w.tian, w.ren, w.di, w.wai, w.zong]).toEqual([5, 7, 4, 2, 7]);
    const c = checkWuge({ surname: [4], given: [3] });
    expect(c.pass).toBe(false);
    expect(c.reasons.some(r => r.startsWith('地格4（凶'))).toBe(true);
  });

  it('单名外格豁免：王(4)+昭(14) → 人18吉 总18吉 地15吉，外格2(凶)不参与过滤 → 通过', () => {
    const c = checkWuge({ surname: [4], given: [14] });
    expect(c.reasons.some(r => r.startsWith('外格2'))).toBe(false); // 单名豁免
    expect(c.pass).toBe(true);
  });

  it('单名地格凶仍否决：王(4)+三(3) → 地格4凶 → 不过（外格不查，地格仍查）', () => {
    const c = checkWuge({ surname: [4], given: [3] });
    expect(c.pass).toBe(false);
    expect(c.reasons.some(r => r.startsWith('地格4（凶'))).toBe(true);
    expect(c.reasons.some(r => r.startsWith('外格2'))).toBe(false);
  });

  it('复名外格仍查：王(4)+昭(14)+三(3) → 人18吉 地17吉 总21吉，外格4(凶) → 否决', () => {
    const c = checkWuge({ surname: [4], given: [14, 3] });
    expect(c.pass).toBe(false);
    expect(c.reasons.some(r => r.startsWith('外格4（凶'))).toBe(true);
  });

  it('李浩然通过默认数理过滤', () => {
    const c = checkWuge({ surname: [7], given: [11, 12] });
    expect(c.pass).toBe(true);
    expect(c.reasons).toHaveLength(0);
  });

  it('人格低于半吉时被拒（提升 minLevel 至 吉）', () => {
    const c = checkWuge({ surname: [7], given: [11, 12] }, '吉');
    expect(c.pass).toBe(false);
    expect(c.reasons.some(r => r.startsWith('总格30（半吉'))).toBe(true);
  });
});
