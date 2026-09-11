/**
 * src/app/[locale]/components/NamingPanel.tsx
 * 英文名 → 中文名 起名区块（排盘结果下方，自动带入排盘喜用）。
 *
 * 数据流：表单（英文名 + 姓氏）+ 排盘喜用（result.xiYong，自动带入）
 *   → POST /api/naming（服务端跑起名管线：音译+意译 → 六项硬过滤 → 六维评分）
 *   → 候选卡片展示。字库与管线只在服务端，前端不 import 大字库（ADR-7）。
 */
'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { NameCandidateList, type CandidateDTO } from './NameCandidateList';
import { useAuth } from '@/lib/auth/AuthProvider';

interface XiYongLike {
  yong: string[];
  xi: string[];
  ji: string[];
}

/** 五行中文 → i18n 叶子键（复用 report.wx.*） */
const WX_KEY: Record<string, string> = { 木: 'mu', 火: 'huo', 土: 'tu', 金: 'jin', 水: 'shui' };

export function NamingPanel({ xiYong }: { xiYong: XiYongLike }) {
  const t = useTranslations();
  const locale = useLocale();
  const sep = locale === 'zh' ? '、' : ', ';

  const [englishName, setEnglishName] = useState('');
  const [surname, setSurname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<CandidateDTO[] | null>(null);
  const [limited, setLimited] = useState(false);
  const { session } = useAuth();

  const wxText = (w: string) => t(`report.wx.${WX_KEY[w] ?? 'mu'}`);
  const wxList = (arr: string[]) => (arr.length ? arr.map(wxText).join(sep) : '—');

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    const name = englishName.trim();
    const sur = surname.trim();
    if (!name || !sur) {
      setError(t('naming.errorMissing'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/naming', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ englishName: name, surname: sur, xiYong, topN: 10 }),
      });
      const data = (await res.json()) as { candidates?: CandidateDTO[]; limited?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'naming request failed');
      setCandidates(data.candidates ?? []);
      setLimited(Boolean(data.limited));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setCandidates(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel naming-panel no-print">
      <h2>{t('naming.title')}</h2>
      <p className="naming-hint">{t('naming.hint')}</p>
      <p className="naming-xiyong">
        {t('naming.xiyongAuto', {
          yong: wxList(xiYong.yong),
          xi: wxList(xiYong.xi),
          ji: wxList(xiYong.ji),
        })}
      </p>

      <form className="naming-form" onSubmit={handleGenerate}>
        <label className="field">
          {t('naming.englishName')}
          <input
            type="text"
            value={englishName}
            onChange={e => setEnglishName(e.target.value)}
            placeholder="Ethan"
            autoComplete="off"
          />
        </label>
        <label className="field">
          {t('naming.surname')}
          <input
            type="text"
            value={surname}
            onChange={e => setSurname(e.target.value.slice(0, 1))}
            placeholder={t('naming.surnamePlaceholder')}
            maxLength={1}
            autoComplete="off"
          />
        </label>
        <button type="submit" className="btn btn-report-primary" disabled={loading}>
          {loading ? t('naming.submitting') : t('naming.submit')}
        </button>
      </form>

      {error && <div className="panel error">{t('naming.errorPrefix')}{error}</div>}
      {loading && <div className="panel loading">{t('naming.loading')}</div>}

      {candidates && candidates.length === 0 && !loading && (
        <div className="naming-empty">{t('naming.empty')}</div>
      )}

      {candidates && candidates.length > 0 && (
        <>
          {limited && <div className="hint naming-limited">{t('naming.truncatedHint', { count: candidates.length })}</div>}
          <NameCandidateList candidates={candidates} />
        </>
      )}
    </section>
  );
}
