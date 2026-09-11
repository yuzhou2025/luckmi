'use client';
/**
 * ReportView：命理报告渲染（打印优化版）。
 * - 断语正文一律为带出处中文原文（不翻译、不改写，规则 13/14），出处标签走 i18n
 * - 四柱/五行/十神图复用排盘页 i18n 组件
 * - 格局为 null 时格局卡整卡缺省，不写"需人工复核"
 */
import { useTranslations, useLocale } from 'next-intl';
import type { PaipanResult } from '@/lib/bazi/paipan';
import type { LifeReportData } from '@/lib/reports/types';
import { termKey } from '@/lib/i18n/terms';
import { PaipanTable } from './PaipanTable';
import { WuxingChart } from './WuxingChart';
import { SummaryPanel } from './SummaryPanel';
import { ZodiacCard } from './ZodiacCard';

/** 中文符号 → i18n 叶子键（报告专用映射，不污染全局 TERM_MAP） */
const WX_KEY: Record<string, string> = { 木: 'mu', 火: 'huo', 土: 'tu', 金: 'jin', 水: 'shui' };
const COLOR_KEY: Record<string, string> = {
  青: 'qing', 绿: 'lv', 红: 'hong', 紫: 'zi', 黄: 'huang',
  棕: 'zong', 白: 'bai', 金: 'jin', 黑: 'hei', 蓝: 'lan',
};
const DIR_KEY: Record<string, string> = {
  东: 'dong', 南: 'nan', 西: 'xi', 北: 'bei', 中: 'zhong',
  东南: 'dongnan', 西南: 'xinan', 西北: 'xibei', 东北: 'dongbei',
};
const CLASSIC_KEY: Record<string, string> = {
  渊海子平: 'yuanhai', 子平真诠: 'zhenquan', 穷通宝鉴: 'qiongtong', 三命通会: 'sanming',
};
const SEASON_KEY: Record<string, string> = { 春: 'spring', 夏: 'summer', 秋: 'autumn', 冬: 'winter' };

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function ReportView({ result, report }: {
  result: PaipanResult;
  report: LifeReportData;
}) {
  const t = useTranslations();
  const locale = useLocale() as 'en' | 'zh';
  const sep = locale === 'zh' ? '、' : ', ';

  const termT = (term: string) => {
    const k = termKey(term);
    return k ? t(k) : term;
  };
  const mapT = (dict: Record<string, string>, prefix: string, v: string) =>
    dict[v] ? t(`${prefix}.${dict[v]}`) : v;
  /** 标点本地化：中文全角冒号/括号，英文半角 */
  const colon = locale === 'zh' ? '：' : ': ';
  const parens = (s: string) => (locale === 'zh' ? `（${s}）` : ` (${s})`);

  const { subject, wuxing, xiyong, pattern, tiaohou, dayun, liunian } = report;
  const birth = subject.birth;
  const birthText = `${birth.year}-${pad(birth.month)}-${pad(birth.day)} ${pad(birth.hour)}:${pad(birth.minute)}`;
  const allDuanyu = [...pattern.duanyu, ...tiaohou.duanyu, ...report.strengthDuanyu];

  return (
    <div className="report-view">
      <header className="report-header">
        <h1>{t('report.lifeTitle')}</h1>
        <div className="report-meta">
          <span>{t('report.generatedAt')}: {new Date(report.meta.generatedAt).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')}</span>
          <span className="report-engine">{t('report.engineTag')}</span>
        </div>
      </header>

      <section className="panel report-subject">
        <ZodiacCard yearBranch={report.chart.pillars.year.zhi} />
        <ul className="report-facts">
          <li><b>{t('paipan.gender')}</b>{colon}{subject.gender === 'male' ? t('report.genderMale') : t('report.genderFemale')}</li>
          <li><b>{t('report.birth')}</b>{colon}{birthText}{birth.calendar === 'lunar' ? parens(t('paipan.lunar')) : ''}</li>
          <li><b>{t('report.trueSolarTime')}</b>{colon}{subject.trueSolarTime}</li>
          {tiaohou.gods.length > 0 && (
            <li><b>{t('report.tiaohouGods')}</b>{colon}{tiaohou.gods.join(' ')}
              {SEASON_KEY[tiaohou.season] ? parens(mapT(SEASON_KEY, 'report.season', tiaohou.season)) : null}
            </li>
          )}
        </ul>
      </section>

      <section className="panel report-section">
        <h2>{t('report.sectionDuanyu')}</h2>
        <p className="report-duanyu-intro">{t('report.duanyuIntro')}</p>
        <ul className="duanyu-list">
          {allDuanyu.map(d => (
            <li key={d.id} className="duanyu-card">
              <p className="duanyu-text">{d.text}</p>
              <p className="duanyu-source">
                {t('report.sourceLabel')}{colon}{CLASSIC_KEY[d.source] ? t(`report.classics.${CLASSIC_KEY[d.source]}`) : d.source}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {pattern.result && (
        <section className="panel report-section">
          <h2>{t('report.sectionPattern')}</h2>
          <p className="report-pattern-name">
            {termT(pattern.result.name)}
            {pattern.result.sub ? ` · ${pattern.result.sub}` : ''}
          </p>
        </section>
      )}

      <section className="panel report-section">
        <h2>{t('report.sectionChart')}</h2>
        <PaipanTable result={result} gender={subject.gender} />
      </section>

      <section className="panel report-section">
        <h2>{t('report.sectionWuxing')}</h2>
        <p className="report-strength-line">
          <b>{t('report.strengthLabel')}</b>{colon}{termT(wuxing.strength)}
        </p>
        <SummaryPanel result={result} />
        <WuxingChart result={result} />
      </section>

      <section className="panel report-section">
        <h2>{t('report.sectionXiyong')}</h2>
        <ul className="report-facts">
          <li><b>{t('report.yong')}</b>{colon}{xiyong.yong.map(w => mapT(WX_KEY, 'report.wx', w)).join(sep) || '—'}</li>
          <li><b>{t('report.xi')}</b>{colon}{xiyong.xi.map(w => mapT(WX_KEY, 'report.wx', w)).join(sep) || '—'}</li>
          <li><b>{t('report.ji')}</b>{colon}{xiyong.ji.map(w => mapT(WX_KEY, 'report.wx', w)).join(sep) || '—'}</li>
          <li><b>{t('report.colors')}</b>{colon}{xiyong.colors.map(c => mapT(COLOR_KEY, 'report.color', c)).join(sep)}</li>
          <li><b>{t('report.directions')}</b>{colon}{xiyong.directions.map(d => mapT(DIR_KEY, 'report.dir', d)).join(sep)}</li>
          <li><b>{t('report.numbers')}</b>{colon}{xiyong.numbers.join(', ')}</li>
        </ul>
      </section>

      <section className="panel report-section">
        <h2>{t('report.sectionDayun')}</h2>
        <p className="report-dayun-head">
          {t('report.qiYun')}{colon}{dayun.qiYun.solar} · {dayun.qiYun.age}{t('report.ageSuffix')} ·
          {dayun.direction === '顺排' ? t('report.forward') : t('report.backward')}
        </p>
        <table className="report-table">
          <thead>
            <tr>
              <th>{t('report.colAge')}</th>
              <th>{t('report.colYear')}</th>
              <th>{t('report.colPillar')}</th>
            </tr>
          </thead>
          <tbody>
            {dayun.list.map((d, i) => (
              <tr key={i} className={d.isCurrent ? 'current' : ''}>
                <td>{d.startAge}–{d.endAge}{t('report.ageSuffix')}</td>
                <td>{d.startYear}–{d.endYear}</td>
                <td>{d.ganzhi}{d.isCurrent ? parens(t('report.currentTag')) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel report-section">
        <h2>{t('report.sectionLiunian')}</h2>
        <table className="report-table">
          <thead>
            <tr>
              <th>{t('report.colYear')}</th>
              <th>{t('report.colAge')}</th>
              <th>{t('report.colPillar')}</th>
              <th>{t('report.colShishen')}</th>
            </tr>
          </thead>
          <tbody>
            {liunian.map((item, i) => (
              <tr key={i} className={item.isCurrent ? 'current' : ''}>
                <td>{item.year}{item.isCurrent ? parens(t('report.currentTag')) : ''}</td>
                <td>{item.age}</td>
                <td>{item.ganzhi}</td>
                <td>{termT(item.shishen)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
