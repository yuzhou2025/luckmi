/**
 * src/app/[locale]/components/NamingPage.tsx
 * 独立起名页（不依赖排盘）。
 *
 * - 英文名 + 单字姓氏 必填
 * - 喜用五行手动选择（每组三态：用神/喜神/忌神/不选，互斥）
 *   不选喜用 → 管线按中性档评分（不做喜用硬过滤）
 * - 避讳名（可选，多字逗号/空格分隔）
 * → POST /api/naming → 候选卡片（复用 NameCandidateList）
 */
'use client';

import { useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { NameCandidateList, type CandidateDTO } from './NameCandidateList';
import { useAuth } from '@/lib/auth/AuthProvider';

const WUXING = ['木', '火', '土', '金', '水'] as const;
type Wuxing = typeof WUXING[number];
type Role = 'none' | 'yong' | 'xi' | 'ji';

/** 五行中文 → i18n 叶子键（复用 report.wx.*） */
const WX_KEY: Record<string, string> = { 木: 'mu', 火: 'huo', 土: 'tu', 金: 'jin', 水: 'shui' };

export function NamingPage() {
  const t = useTranslations();
  const locale = useLocale();
  const sep = locale === 'zh' ? '、' : ', ';

  const [englishName, setEnglishName] = useState('');
  const [surname, setSurname] = useState('');
  const [taboo, setTaboo] = useState('');
  const [roles, setRoles] = useState<Record<Wuxing, Role>>({
    木: 'none', 火: 'none', 土: 'none', 金: 'none', 水: 'none',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<CandidateDTO[] | null>(null);
  const [limited, setLimited] = useState(false);
  const { session } = useAuth();

  const xiYong = useMemo(() => {
    const yong: string[] = [];
    const xi: string[] = [];
    const ji: string[] = [];
    for (const w of WUXING) {
      const r = roles[w];
      if (r === 'yong') yong.push(w);
      else if (r === 'xi') xi.push(w);
      else if (r === 'ji') ji.push(w);
    }
    // 三组全空 → 不传喜用，管线按中性档
    return yong.length || xi.length || ji.length ? { yong, xi, ji } : undefined;
  }, [roles]);

  const setRole = (w: Wuxing, r: Role) => setRoles(prev => ({ ...prev, [w]: r }));

  const wxText = (w: string) => t(`report.wx.${WX_KEY[w] ?? 'mu'}`);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    const name = englishName.trim();
    const sur = surname.trim();
    if (!name || !sur) {
      setError(t('naming.errorMissing'));
      return;
    }
    const tabooNames = taboo
      .split(/[,，\s]+/)
      .map(s => s.trim())
      .filter(Boolean);

    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        englishName: name,
        surname: sur,
        topN: 10,
      };
      if (xiYong) body.xiYong = xiYong;
      if (tabooNames.length) body.tabooNames = tabooNames;

      const res = await fetch('/api/naming', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(body),
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
    <div className="wrap">
      <div className="title">{t('naming.pageTitle')}</div>
      <div className="subtitle">{t('naming.pageSubtitle')}</div>

      <form className="panel naming-page" onSubmit={handleGenerate}>
        <div className="naming-form">
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
          <label className="field">
            {t('naming.tabooLabel')}
            <input
              type="text"
              value={taboo}
              onChange={e => setTaboo(e.target.value)}
              placeholder={t('naming.tabooPlaceholder')}
              autoComplete="off"
            />
          </label>
          <button type="submit" className="btn btn-report-primary" disabled={loading}>
            {loading ? t('naming.submitting') : t('naming.submit')}
          </button>
        </div>

        <div className="naming-wuxing-picker">
          <div className="naming-picker-title">{t('naming.wuxingPicker')}</div>
          <table className="naming-wx-table">
            <thead>
              <tr>
                <th>{t('naming.wuxingCol')}</th>
                <th>{t('naming.wuxingNone')}</th>
                <th>{t('naming.wuxingYong')}</th>
                <th>{t('naming.wuxingXi')}</th>
                <th>{t('naming.wuxingJi')}</th>
              </tr>
            </thead>
            <tbody>
              {WUXING.map(w => (
                <tr key={w}>
                  <td className="naming-wx-name" style={{ ['--wx' as string]: `var(--${w === '木' ? 'wood' : w === '火' ? 'fire' : w === '土' ? 'earth' : w === '金' ? 'metal' : 'water'})` }}>
                    {wxText(w)}
                  </td>
                  {(['none', 'yong', 'xi', 'ji'] as Role[]).map(r => (
                    <td key={r} className="naming-wx-opt">
                      <label className="naming-wx-label">
                        <input
                          type="radio"
                          name={`wx-${w}`}
                          checked={roles[w] === r}
                          onChange={() => setRole(w, r)}
                        />
                      </label>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="naming-picker-hint">
            {xiYong
              ? t('naming.xiyongManual', {
                  yong: xiYong.yong.map(wxText).join(sep) || '—',
                  xi: xiYong.xi.map(wxText).join(sep) || '—',
                  ji: xiYong.ji.map(wxText).join(sep) || '—',
                })
              : t('naming.noXiYongHint')}
          </p>
        </div>
      </form>

      {error && <div className="panel error">{t('naming.errorPrefix')}{error}</div>}
      {loading && <div className="panel loading">{t('naming.loading')}</div>}

      {candidates && candidates.length === 0 && !loading && (
        <div className="panel naming-empty">{t('naming.empty')}</div>
      )}

      {candidates && candidates.length > 0 && (
        <div className="panel">
          {limited && <div className="hint naming-limited">{t('naming.truncatedHint', { count: candidates.length })}</div>}
          <NameCandidateList candidates={candidates} />
        </div>
      )}
    </div>
  );
}
