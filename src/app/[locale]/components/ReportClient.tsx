'use client';
/**
 * ReportClient：报告页客户端容器。
 * 数据流（纯静态，无 API）：HomeClient 排盘后将 PaipanResult 存入 sessionStorage，
 * 本页读取后调 bazi-engine buildLifeReport 构建报告数据并渲染。
 */
import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { PaipanResult } from '@/lib/bazi/paipan';
import type { LifeReportData } from '@/lib/reports/types';
import { ReportView } from './ReportView';
import { ReportActions } from './ReportActions';

export const REPORT_STORAGE_KEY = 'luckmi-paipan-result';

interface ReportState {
  result: PaipanResult;
  report: LifeReportData;
}

export function ReportClient() {
  const t = useTranslations();
  const locale = useLocale() as 'en' | 'zh';
  const [state, setState] = useState<ReportState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = sessionStorage.getItem(REPORT_STORAGE_KEY);
        if (!raw) {
          if (!cancelled) setLoading(false);
          return;
        }
        const result = JSON.parse(raw) as PaipanResult;
        const { buildLifeReport } = await import('@/lib/reports/life');
        const report = await buildLifeReport(result, { locale });
        if (!cancelled) {
          setState({ result, report });
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [locale]);

  if (loading) {
    return <div className="wrap report-page"><div className="panel">{t('common.loading')}</div></div>;
  }
  if (error) {
    return <div className="wrap report-page"><div className="panel error">{t('common.errorPrefix')}{error}</div></div>;
  }
  if (!state) {
    return (
      <div className="wrap report-page">
        <div className="panel report-empty">
          <p>{t('report.empty')}</p>
          <Link href="/" className="btn-report">{t('report.actionBack')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap report-page">
      <ReportActions report={state.report} result={state.result} />
      <ReportView result={state.result} report={state.report} />
    </div>
  );
}
