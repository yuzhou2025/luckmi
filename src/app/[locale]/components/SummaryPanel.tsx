'use client';

import type { MaybeSimplePaipanResult } from '@/lib/bazi/paipan';
import { useTranslations, useLocale } from 'next-intl';
import { termKey } from '@/lib/i18n/terms';

/** 强弱 → 型标签（参考图3：极弱型） */
const STRENGTH_TYPE: Record<string, string> = {
  极弱: '极弱型',
  偏弱: '偏弱型',
  均衡: '中和型',
  偏强: '偏强型',
  极强: '极强型',
};

export function SummaryPanel({ result }: { result: MaybeSimplePaipanResult }) {
  const t = useTranslations();
  const locale = useLocale();
  /** 标点本地化：中文全角，英文半角 */
  const colon = locale === 'zh' ? '：' : ': ';
  const listSep = locale === 'zh' ? '、' : ', ';
  const parens = (s: string) => (locale === 'zh' ? `（${s}）` : ` (${s})`);
  const bracket = (s: string) => (locale === 'zh' ? `【${s}】` : `[${s}]`);
  const termT = (s: string) => { const k = termKey(s); return k ? t(k) : s; };
  const { strength, pattern, xiYong, tiaoHou, dayGan, dayGanWuxing } = result;
  const dayunDirection = 'dayunDirection' in result ? result.dayunDirection : undefined;
  return (
    <div>
      <div className="kv">
        <span><span className="k">{t('summary.dayMaster')}{colon}</span><span className="v">{dayGan}{parens(dayGanWuxing)}</span></span>
        <span><span className="k">{t('summary.strength')}{colon}</span><span className="v strength-type">{bracket(termT(STRENGTH_TYPE[strength] ?? strength))}</span></span>
        {dayunDirection && (
          <span><span className="k">{t('summary.dayun')}{colon}</span><span className="v">{dayunDirection === '顺排' ? t('report.forward') : t('report.backward')}</span></span>
        )}
      </div>

      {/* 格局：仅可确定八正格时输出；不确定则不渲染格局卡（也不写"需人工复核"） */}
      {pattern && (
        <div className="pattern-card">
          <div className="pattern-title">{bracket(`${termT(pattern.name)}${pattern.sub ? ` · ${pattern.sub}` : ''}`)}</div>
          <span className="source">{t('summary.sourcePrefix')}{t('summary.sourceBookLeft')}{pattern.source}{t('summary.sourceBookRight')}</span>
        </div>
      )}

      <div className="kv">
        <span><span className="k">{t('summary.yongShen')}{colon}</span><span className="v">{xiYong.yong.join(listSep) || '—'}</span></span>
        <span><span className="k">{t('summary.xiShen')}{colon}</span><span className="v">{xiYong.xi.join(listSep) || '—'}</span></span>
        <span><span className="k">{t('summary.jiShen')}{colon}</span><span className="v">{xiYong.ji.join(listSep) || '—'}</span></span>
      </div>

      <div className="tiaohou">
        {t('summary.tiaohouPrefix')}{tiaoHou.gods.join(listSep) || '—'}
        <span className="source">{t('summary.sourcePrefix')}{t('summary.sourceBookLeft')}{tiaoHou.source}{t('summary.sourceBookRight')}</span>
      </div>
    </div>
  );
}
