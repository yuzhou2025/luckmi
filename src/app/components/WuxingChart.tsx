/**
 * src/app/components/WuxingChart.tsx
 * 五行五边形生克图（参考图3）：
 * 火（顶）/土（右上）/金（右下·日主）/水（左下）/木（左）；
 * 外圈弧箭头=相生，内部五角星直线=相克；节点标五行+百分比+十神类。
 * 下方：月令旺相休囚死条、喜用、幸运颜色/方位/数字（均来自引擎与配置）。
 */
import type { PaipanResult } from '@/lib/bazi/paipan';
import { WX_COLOR } from './ui-utils';

const CX = 210;
const CY = 195;

/** 节点（顺时针：火→土→金→水→木，即相生方向） */
const NODES = [
  { wx: '火', key: 'huo' as const,  cx: CX,        cy: CY - 125, ss: ['七杀', '正官'],
    lx: CX, ly: 34, anchor: 'middle' as const },
  { wx: '土', key: 'tu' as const,   cx: CX + 119,  cy: CY - 39,  ss: ['偏印', '正印'],
    lx: 418, ly: CY - 46, anchor: 'end' as const },
  { wx: '金', key: 'jin' as const,  cx: CX + 74,   cy: CY + 101, ss: ['日主'],
    lx: CX + 74, ly: CY + 158, anchor: 'middle' as const, dayMaster: true },
  { wx: '水', key: 'shui' as const, cx: CX - 74,   cy: CY + 101, ss: ['伤官', '食神'],
    lx: 12, ly: CY + 94, anchor: 'start' as const },
  { wx: '木', key: 'mu' as const,   cx: CX - 119,  cy: CY - 39,  ss: ['偏财', '正财'],
    lx: 12, ly: CY - 46, anchor: 'start' as const },
];

/** 节点边缘点（弧箭头起止） */
const edge = (i: number, f = 0.8) => {
  const n = NODES[i];
  return { x: CX + (n.cx - CX) * f, y: CY + (n.cy - CY) * f };
};

/** 相生弧（火→土→金→水→木→火）：起点、终点、外推控制点、"生"字位置 */
const SHENG_ARCS = [
  { from: 0, to: 1, ctrl: { x: 300, y: 92 },  label: { x: 296, y: 78 } },
  { from: 1, to: 2, ctrl: { x: 352, y: 240 }, label: { x: 352, y: 226 } },
  { from: 2, to: 3, ctrl: { x: 210, y: 340 }, label: { x: 210, y: 356 } },
  { from: 3, to: 4, ctrl: { x: 68, y: 240 },  label: { x: 68, y: 226 } },
  { from: 4, to: 0, ctrl: { x: 120, y: 92 },  label: { x: 124, y: 78 } },
];

/** 相克直线（五角星：火克金、金克木、木克土、土克水、水克火） */
const KE_LINES: [number, number][] = [[0, 2], [2, 4], [4, 1], [1, 3], [3, 0]];

const COLOR_HEX: Record<string, string> = {
  白: '#f7f1e6', 金: '#e6c875', 黄: '#e3b84e', 棕: '#a0784f',
};

export function WuxingChart({ result }: { result: PaipanResult }) {
  const score = result.wuxingScore;
  const luckyWx = [...result.xiYong.yong, ...result.xiYong.xi];

  return (
    <div>
      <svg viewBox="-6 0 452 400" className="wuxing-svg" role="img" aria-label="五行生克图">
        <defs>
          <marker id="arrow-sheng" markerWidth="8" markerHeight="8" refX="6" refY="3"
                  orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L6,3 L0,6 Z" fill="#8a6d4b" />
          </marker>
        </defs>

        {/* 克：内部五角星直线 */}
        {KE_LINES.map(([a, b], i) => {
          const na = NODES[a];
          const nb = NODES[b];
          const mx = (na.cx + nb.cx) / 2;
          const my = (na.cy + nb.cy) / 2;
          return (
            <g key={`ke-${i}`}>
              <line x1={na.cx} y1={na.cy} x2={nb.cx} y2={nb.cy}
                    stroke="#c9b8a3" strokeWidth="1.4" />
              <text x={mx} y={my + 3} textAnchor="middle" fontSize="11" fill="#b09a80">克</text>
            </g>
          );
        })}

        {/* 生：外圈弧箭头 */}
        {SHENG_ARCS.map((a, i) => {
          const p1 = edge(a.from);
          const p2 = edge(a.to);
          return (
            <g key={`sheng-${i}`}>
              <path d={`M ${p1.x} ${p1.y} Q ${a.ctrl.x} ${a.ctrl.y} ${p2.x} ${p2.y}`}
                    fill="none" stroke="#8a6d4b" strokeWidth="2"
                    markerEnd="url(#arrow-sheng)" />
              <text x={a.label.x} y={a.label.y} textAnchor="middle" fontSize="13"
                    fill="#8a6d4b" fontWeight="bold">生</text>
            </g>
          );
        })}

        {/* 节点 */}
        {NODES.map(n => {
          const color = WX_COLOR[n.wx];
          const isLucky = luckyWx.includes(n.wx);
          return (
            <g key={n.wx}>
              {isLucky && (
                <circle cx={n.cx} cy={n.cy} r={43} fill="none" stroke="#d9a544"
                        strokeWidth="1.6" strokeDasharray="4 3" />
              )}
              <circle cx={n.cx} cy={n.cy} r={36} fill={color} fillOpacity={0.12}
                      stroke={color} strokeWidth="2.5" />
              <text x={n.cx} y={n.cy - 2} textAnchor="middle" fontSize="22"
                    fontWeight="bold" fill={color}>{n.wx}</text>
              <text x={n.cx} y={n.cy + 18} textAnchor="middle" fontSize="13"
                    fill="#7a6a58">{score[n.key]}%</text>
              {n.dayMaster ? (
                <g>
                  <rect x={n.lx - 24} y={n.ly - 15} width={48} height={22} rx={11}
                        fill="#e8891f" />
                  <text x={n.lx} y={n.ly} textAnchor="middle" fontSize="13"
                        fill="#fff" fontWeight="bold">日主</text>
                </g>
              ) : (
                <text x={n.lx} y={n.ly} textAnchor={n.anchor} fontSize="13"
                      fill={color} fontWeight="bold">
                  {n.ss.map((s, i) => (
                    <tspan key={s} x={n.anchor === 'middle' ? n.lx : undefined}
                           dy={i === 0 ? 0 : 15}>{s}</tspan>
                  ))}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* 月令旺相休囚死（标注日元状态） */}
      <div className="wangxiang-strip">
        {result.wangxiang.map((w, i) => {
          const isDayMaster = w.wuxing === result.dayGanWuxing;
          return (
            <span key={w.wuxing} className={`wx-item ${isDayMaster ? 'wx-daymaster' : ''}`}>
              {i > 0 && <span className="wx-sep">|</span>}
              <span style={{ color: WX_COLOR[w.wuxing], fontWeight: isDayMaster ? 800 : 700 }}>
                {w.wuxing}{w.state}
              </span>
              {isDayMaster && <span className="wx-dm-tag">日元</span>}
            </span>
          );
        })}
      </div>

      {/* 喜用 + 幸运映射 */}
      <div className="xiyong-divider">
        <span className="dot" />
        【喜用{result.xiYong.yong.join('、')}
        {result.xiYong.xi.length > 0 ? `、${result.xiYong.xi.join('、')}` : ''}】
        <span className="dot" />
      </div>

      <div className="lucky-row">
        <div className="lucky-item">
          <div className="lucky-label">幸运颜色</div>
          <div className="lucky-dots">
            {result.xiYong.colors.map(c => (
              <span key={c} className="color-dot"
                    style={{ background: COLOR_HEX[c] ?? '#eee', border: c === '白' ? '1px solid #d8c9b4' : 'none' }}
                    title={c} />
            ))}
          </div>
        </div>
        <div className="lucky-item">
          <div className="lucky-label">幸运方位</div>
          <div className="lucky-tags">
            {result.xiYong.directions.map(d => <span key={d} className="lucky-tag">{d}</span>)}
          </div>
        </div>
        <div className="lucky-item">
          <div className="lucky-label">幸运数字</div>
          <div className="lucky-tags">
            {result.xiYong.numbers.map(n => <span key={n} className="lucky-tag">{n}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}
