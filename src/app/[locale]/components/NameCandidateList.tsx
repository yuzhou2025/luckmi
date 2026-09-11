/**
 * src/app/[locale]/components/NameCandidateList.tsx
 * 起名候选卡片展示（纯展示组件，由 NamingPanel 首页区块与独立起名页共用）。
 */
'use client';

import { useTranslations } from 'next-intl';

export interface GivenDTO {
  char: string;
  pinyin: string;
  wuxing: string;
  strokes: number;
}

export interface CandidateDTO {
  full: string;
  source: 'translit' | 'semantic';
  meaning?: string;
  syllables?: string[];
  popularityLabel: string;
  given: GivenDTO[];
  score: {
    total: number;
    xiyong: number;
    yinlv: number;
    ziyi: number;
    zixing: number;
    shuli: number;
    dute: number;
  };
}

/** 五行 → CSS 变量色（与五行图一致） */
const WX_COLOR: Record<string, string> = {
  木: 'var(--wood)',
  火: 'var(--fire)',
  土: 'var(--earth)',
  金: 'var(--metal)',
  水: 'var(--water)',
};
/** 五行中文 → i18n 叶子键（复用 report.wx.*） */
const WX_KEY: Record<string, string> = { 木: 'mu', 火: 'huo', 土: 'tu', 金: 'jin', 水: 'shui' };
/** 引擎流行度中文标签 → i18n 键 */
const POP_KEY: Record<string, string> = { 常见: 'common', 较常见: 'uncommon', 少见: 'rare' };

export function NameCandidateList({ candidates }: { candidates: CandidateDTO[] }) {
  const t = useTranslations();
  const wxText = (w: string) => t(`report.wx.${WX_KEY[w] ?? 'mu'}`);

  const dims = (c: CandidateDTO) => [
    { key: 'xiyong', label: t('naming.dimXiyong'), value: c.score.xiyong },
    { key: 'yinlv', label: t('naming.dimYinlv'), value: c.score.yinlv },
    { key: 'ziyi', label: t('naming.dimZiyi'), value: c.score.ziyi },
    { key: 'zixing', label: t('naming.dimZixing'), value: c.score.zixing },
    { key: 'shuli', label: t('naming.dimShuli'), value: c.score.shuli },
    { key: 'dute', label: t('naming.dimDute'), value: c.score.dute },
  ];

  return (
    <ol className="name-list">
      {candidates.map((c, i) => (
        <li key={c.full} className="name-card">
          <div className="name-rank">{i + 1}</div>
          <div className="name-main">
            <div className="name-full">{c.full}</div>
            <div className="name-pinyin">{c.given.map(g => g.pinyin).join(' ')}</div>
            <div className="name-tags">
              <span className="name-source">
                {c.source === 'translit' ? t('naming.sourceTranslit') : t('naming.sourceSemantic')}
              </span>
              {c.syllables && <span className="name-syllables">{c.syllables.join('-')}</span>}
              {c.meaning && <span className="name-meaning">{c.meaning}</span>}
              <span className="name-pop">
                {t(`naming.pop.${POP_KEY[c.popularityLabel] ?? 'common'}`)}
              </span>
            </div>
            <div className="name-chars">
              {c.given.map(g => (
                <span
                  key={g.char}
                  className="name-char"
                  style={{ ['--wx' as string]: WX_COLOR[g.wuxing] ?? 'var(--muted)' }}
                >
                  <b>{g.char}</b>
                  <i>{g.pinyin}</i>
                  <em>{wxText(g.wuxing)}</em>
                </span>
              ))}
            </div>
          </div>
          <div className="name-score">
            <div className="name-total">
              {c.score.total}
              <small>{t('naming.total')}</small>
            </div>
            <ul className="name-dims">
              {dims(c).map(d => (
                <li key={d.key}>
                  <span>{d.label}</span>
                  <b>{d.value}</b>
                </li>
              ))}
            </ul>
          </div>
        </li>
      ))}
    </ol>
  );
}
