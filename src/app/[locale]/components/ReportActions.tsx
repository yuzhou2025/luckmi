'use client';
/**
 * ReportActions：报告操作条（打印/导出 PDF、JSON 存档、返回）。
 * PDF 口径（v7-M3）：CSS @media print + window.print()，零新依赖、保持静态部署；
 * JSON 存档：报告数据 + 原始排盘结果打包 Blob 下载。
 */
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { PaipanResult } from '@/lib/bazi/paipan';
import type { LifeReportData } from '@/lib/reports/types';

export function ReportActions({ report, result }: {
  report: LifeReportData;
  result: PaipanResult;
}) {
  const t = useTranslations();

  const handlePrint = () => {
    window.print();
  };

  const handleJson = () => {
    const payload = { report, paipan: result };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `luckmi-report-${report.meta.generatedAt.slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="report-actions no-print">
      <button type="button" className="btn-report" onClick={handlePrint}>
        {t('report.actionPrint')}
      </button>
      <button type="button" className="btn-report" onClick={handleJson}>
        {t('report.actionJson')}
      </button>
      <Link href="/" className="btn-report btn-link">
        {t('report.actionBack')}
      </Link>
      <p className="print-hint">{t('report.printHint')}</p>
    </div>
  );
}
