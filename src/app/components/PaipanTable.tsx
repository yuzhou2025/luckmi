/**
 * src/app/components/PaipanTable.tsx
 * 四柱横向表（参考图1.2）：
 * 行=干神/天干/地支/藏干/支神/纳音/空亡/地势/自坐/神煞，列=年/月/日/时柱；
 * 底部两行为天干、地支作用关系（紧凑文字）。
 */
import type { PaipanResult, Pillar, GanZhiRelation } from '@/lib/bazi/paipan';
import { GAN_WUXING, ZHI_ORDER } from '@/lib/bazi/constants';
import { ganColor, zhiColor, ssColor, nayinColor } from './ui-utils';

const COLS = [
  { key: 'year', title: '年柱' },
  { key: 'month', title: '月柱' },
  { key: 'day', title: '日柱' },
  { key: 'hour', title: '时柱' },
] as const;

const ZHI_IDX: Record<string, number> = Object.fromEntries(ZHI_ORDER.map((z, i) => [z, i]));

/** 传统固定字序（歌诀口径）：六冲、六破、六害、天干四冲 */
const DZ_CHONG = ['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥'];
const DZ_PO = ['子酉', '午卯', '巳申', '寅亥', '辰丑', '戌未']; // 六破歌诀：午卯相破…
const DZ_HAI = ['子未', '丑午', '寅巳', '卯辰', '申亥', '酉戌'];
const TG_CHONG = ['甲庚', '乙辛', '丙壬', '丁癸'];

/** 在固定字序表中归一两个字（找不到则按地支序回退） */
function normPair(pairs: string[], a: string, b: string): string {
  for (const p of pairs) {
    if ((p[0] === a && p[1] === b) || (p[0] === b && p[1] === a)) return p;
  }
  return (ZHI_IDX[a] ?? 99) <= (ZHI_IDX[b] ?? 99) ? a + b : b + a;
}

/** 四柱位置（年0/月1/日2/时3）→ 干支所在柱位索引 */
function buildPosMap(pillars: PaipanResult['pillars']) {
  const ganPos: Record<string, number[]> = {};
  const zhiPos: Record<string, number[]> = {};
  (['year', 'month', 'day', 'hour'] as const).forEach((k, i) => {
    (ganPos[pillars[k].gan] ??= []).push(i);
    (zhiPos[pillars[k].zhi] ??= []).push(i);
  });
  return { ganPos, zhiPos };
}

/** 两字在四柱中的最小柱位跨度（同字可能落多柱，取最近） */
function minSpan(posMap: Record<string, number[]>, a: string, b: string): number {
  const pa = posMap[a] ?? [];
  const pb = posMap[b] ?? [];
  let m = 99;
  for (const x of pa) for (const y of pb) m = Math.min(m, Math.abs(x - y));
  return m;
}

/**
 * 地支关系去重、按传统字序输出。
 * 年柱与时柱遥隔（跨度3=年时）不直接论作用，过滤；
 * 显示顺序：刑 → 冲 → 破 → 害 → 合（参考图1.2）。
 */
function summarizeDizhi(relations: GanZhiRelation[], zhiPos: Record<string, number[]>): string[] {
  const picked: { type: string; text: string; order: number }[] = [];
  const seen = new Set<string>();
  for (const r of relations) {
    if (r.kind !== '地支') continue;
    if (!['冲', '刑', '破', '害', '合'].includes(r.type)) continue;
    // 年时遥隔（跨度3）不论；同字在近处另有关系时保留（最小跨度）
    if (minSpan(zhiPos, r.from, r.to) >= 3) continue;
    const pair = normPair(
      r.type === '破' ? DZ_PO : r.type === '害' ? DZ_HAI : DZ_CHONG,
      r.from, r.to,
    );
    const dedupKey = r.type + pair;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);
    let text: string;
    let order: number;
    switch (r.type) {
      case '冲': text = `${pair}相冲`; order = 2; break;
      case '刑': text = `${pair[0]}刑${pair[1]}`; order = 1; break;
      case '破': text = `${pair}相破`; order = 3; break;
      case '害': text = `${pair}相害`; order = 4; break;
      default: text = r.detail; order = 5; break; // 六合/三合/半合等用引擎明细
    }
    picked.push({ type: r.type, text, order });
  }
  return picked.sort((x, y) => x.order - y.order).map(p => p.text);
}

/** 天干关系：冲/克/合（生克箭头在五行图中展示）；年时遥隔不论 */
function summarizeTiangan(relations: GanZhiRelation[], ganPos: Record<string, number[]>): string[] {
  const out: string[] = [];
  const rels = relations.filter(
    r => r.kind === '天干'
      && ['冲', '克', '合'].includes(r.type)
      && minSpan(ganPos, r.from, r.to) < 3,
  );
  for (const want of ['冲', '克', '合']) {
    for (const r of rels) {
      if (r.type !== want) continue;
      if (want === '冲') out.push(`${normPair(TG_CHONG, r.from, r.to)}冲`);
      else if (want === '克') out.push(`${r.from}克${r.to}`);
      else out.push(r.detail);
    }
  }
  return out;
}

function ShenshaCell({ pillar }: { pillar: Pillar }) {
  // 同名神煞大/小只显示一次（如 将星 大+小 → 一个"将星"）
  const names = Array.from(new Set(pillar.shensha.map(s => s.name)));
  if (names.length === 0) return <span className="muted">—</span>;
  return (
    <div className="ss-stack">
      {names.map(n => <span key={n} className="shensha-tag">{n}</span>)}
    </div>
  );
}

export function PaipanTable({ result, gender }: { result: PaipanResult; gender: 'male' | 'female' }) {
  const dayWx = result.dayGanWuxing;
  const { ganPos, zhiPos } = buildPosMap(result.pillars);
  const tgText = summarizeTiangan(result.relations, ganPos).join(' · ');
  const dzText = summarizeDizhi(result.relations, zhiPos).join(' · ');

  const label = (text: string) => <td className="row-label">{text}</td>;

  return (
    <div className="paipan-table-wrap">
      <table className="paipan-table">
        <thead>
          <tr>
            <th className="row-label" />
            {COLS.map(c => <th key={c.key} className={c.key === 'day' ? 'col-day' : ''}>{c.title}</th>)}
          </tr>
        </thead>
        <tbody>
          {/* 干神 */}
          <tr>
            {label('干神')}
            {COLS.map(c => {
              const p = result.pillars[c.key];
              const text = c.key === 'day' ? (gender === 'female' ? '女主' : '男主') : p.shishen;
              return (
                <td key={c.key} className={c.key === 'day' ? 'col-day' : ''}>
                  <span className="gan-shen" style={{ color: ssColor(dayWx, text) }}>{text}</span>
                </td>
              );
            })}
          </tr>
          {/* 天干 */}
          <tr>
            {label('天干')}
            {COLS.map(c => {
              const p = result.pillars[c.key];
              return (
                <td key={c.key} className={c.key === 'day' ? 'col-day big-char-cell' : 'big-char-cell'}>
                  <span className="big-char" style={{ color: ganColor(p.gan) }}>{p.gan}</span>
                </td>
              );
            })}
          </tr>
          {/* 地支 */}
          <tr>
            {label('地支')}
            {COLS.map(c => {
              const p = result.pillars[c.key];
              return (
                <td key={c.key} className={c.key === 'day' ? 'col-day big-char-cell' : 'big-char-cell'}>
                  <span className="big-char" style={{ color: zhiColor(p.zhi) }}>{p.zhi}</span>
                </td>
              );
            })}
          </tr>
          {/* 藏干 */}
          <tr>
            {label('藏干')}
            {COLS.map(c => {
              const p = result.pillars[c.key];
              return (
                <td key={c.key} className={c.key === 'day' ? 'col-day' : ''}>
                  <div className="cg-stack">
                    {p.canggan.map(g => (
                      <div key={g} className="cg-line" style={{ color: ganColor(g) }}>
                        {g}·{GAN_WUXING[g]}
                      </div>
                    ))}
                  </div>
                </td>
              );
            })}
          </tr>
          {/* 支神 */}
          <tr>
            {label('支神')}
            {COLS.map(c => {
              const p = result.pillars[c.key];
              return (
                <td key={c.key} className={c.key === 'day' ? 'col-day' : ''}>
                  <div className="cg-stack">
                    {p.zhishen.map((ss, i) => (
                      <div key={i} style={{ color: ssColor(dayWx, ss) }}>{ss}</div>
                    ))}
                  </div>
                </td>
              );
            })}
          </tr>
          {/* 纳音 */}
          <tr>
            {label('纳音')}
            {COLS.map(c => {
              const p = result.pillars[c.key];
              return (
                <td key={c.key} className={c.key === 'day' ? 'col-day' : ''}>
                  <span style={{ color: nayinColor(p.nayin) }}>{p.nayin}</span>
                </td>
              );
            })}
          </tr>
          {/* 空亡 */}
          <tr>
            {label('空亡')}
            {COLS.map(c => {
              const p = result.pillars[c.key];
              return <td key={c.key} className={c.key === 'day' ? 'col-day' : ''}>{p.kongwang.join('')}</td>;
            })}
          </tr>
          {/* 地势 */}
          <tr>
            {label('地势')}
            {COLS.map(c => {
              const p = result.pillars[c.key];
              return <td key={c.key} className={c.key === 'day' ? 'col-day' : ''}>{p.dishi}</td>;
            })}
          </tr>
          {/* 自坐 */}
          <tr>
            {label('自坐')}
            {COLS.map(c => {
              const p = result.pillars[c.key];
              return <td key={c.key} className={c.key === 'day' ? 'col-day' : ''}>{p.zizuo}</td>;
            })}
          </tr>
          {/* 神煞 */}
          <tr>
            {label('神煞')}
            {COLS.map(c => (
              <td key={c.key} className={c.key === 'day' ? 'col-day shensha-cell' : 'shensha-cell'}>
                <ShenshaCell pillar={result.pillars[c.key]} />
              </td>
            ))}
          </tr>
          {/* 天干关系 */}
          <tr className="relation-row">
            {label('天干')}
            <td colSpan={4} className="relation-text">{tgText || '—'}</td>
          </tr>
          {/* 地支关系 */}
          <tr className="relation-row">
            {label('地支')}
            <td colSpan={4} className="relation-text">{dzText || '—'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
