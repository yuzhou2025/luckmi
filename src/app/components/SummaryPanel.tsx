import type { PaipanResult } from '@/lib/bazi/paipan';

/** 强弱 → 型标签（参考图3：极弱型） */
const STRENGTH_TYPE: Record<string, string> = {
  极弱: '极弱型',
  偏弱: '偏弱型',
  均衡: '中和型',
  偏强: '偏强型',
  极强: '极强型',
};

export function SummaryPanel({ result }: { result: PaipanResult }) {
  const { strength, pattern, xiYong, tiaoHou, dayGan, dayGanWuxing, dayunDirection } = result;
  return (
    <div>
      <div className="kv">
        <span><span className="k">日主：</span><span className="v">{dayGan}（{dayGanWuxing}）</span></span>
        <span><span className="k">强弱：</span><span className="v strength-type">【{STRENGTH_TYPE[strength] ?? strength}】</span></span>
        {dayunDirection && (
          <span><span className="k">大运：</span><span className="v">{dayunDirection}</span></span>
        )}
      </div>

      {/* 格局：仅可确定八正格时输出；不确定则不渲染格局卡（也不写"需人工复核"） */}
      {pattern && (
        <div className="pattern-card">
          <div className="pattern-title">【{pattern.name}{pattern.sub ? ` · ${pattern.sub}` : ''}】</div>
          <span className="source">出处：《{pattern.source}》</span>
        </div>
      )}

      <div className="kv">
        <span><span className="k">用神：</span><span className="v">{xiYong.yong.join('、') || '—'}</span></span>
        <span><span className="k">喜神：</span><span className="v">{xiYong.xi.join('、') || '—'}</span></span>
        <span><span className="k">忌神：</span><span className="v">{xiYong.ji.join('、') || '—'}</span></span>
      </div>

      <div className="tiaohou">
        调候用神（仅标注，不参与扶抑喜用）：{tiaoHou.gods.join('、') || '—'}
        <span className="source">出处：《{tiaoHou.source}》</span>
      </div>
    </div>
  );
}
