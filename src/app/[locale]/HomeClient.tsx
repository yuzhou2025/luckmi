'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import type { MaybeSimplePaipanResult } from '@/lib/bazi/paipan';
import type { TimelineItem } from '@/lib/bazi/timeline';
import { useAuth } from '@/lib/auth/AuthProvider';
import { PaipanTable } from './components/PaipanTable';
import { WuxingChart } from './components/WuxingChart';
import { SummaryPanel } from './components/SummaryPanel';
import { TimelineView } from './components/TimelineView';
import { NamingPanel } from './components/NamingPanel';
import { ZodiacCard } from './components/ZodiacCard';
import { REPORT_STORAGE_KEY } from './components/ReportClient';

interface FormState {
  year: string; month: string; day: string; hour: string; minute: string;
  gender: 'male' | 'female';
  calendar: 'solar' | 'lunar';
  lon: string; timezone: string;
}

const DEFAULT_FORM: FormState = {
  year: '1975', month: '6', day: '14', hour: '0', minute: '30',
  gender: 'female', calendar: 'solar', lon: '', timezone: '',
};

export default function HomeClient() {
  const t = useTranslations();
  const router = useRouter();
  const { session } = useAuth();
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [result, setResult] = useState<MaybeSimplePaipanResult | null>(null);
  const [planFull, setPlanFull] = useState(false);
  const [timeline, setTimeline] = useState<{
    liunian: TimelineItem[]; liuyue: TimelineItem[]; liuri: TimelineItem[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  /** 生成命理报告：仅全量档（bazi_report/pro）开放；当前排盘结果存 sessionStorage，跳转 /report 纯静态页 */
  function handleGenerateReport() {
    if (!result || !planFull) return;
    sessionStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(result));
    router.push('/report');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // ADR-3：排盘在服务端执行并按角色裁剪（guest 简版 3 次/天；bazi_report/pro 全量+时间轴）
      const res = await fetch('/api/paipan', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(session?.access_token ? { authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          year: +form.year, month: +form.month, day: +form.day,
          hour: +form.hour, minute: +form.minute,
          gender: form.gender,
          calendar: form.calendar,
          ...(form.lon ? { lon: +form.lon } : {}),
          ...(form.timezone ? { timezone: form.timezone } : {}),
        }),
      });
      if (res.status === 429) {
        throw new Error(t('paipan.rateLimited'));
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        plan: { role: string; full: boolean; timeline: boolean };
        result: MaybeSimplePaipanResult;
        timeline?: { liunian: TimelineItem[]; liuyue: TimelineItem[]; liuri: TimelineItem[] };
      };

      setPlanFull(Boolean(data.plan?.full));
      setResult(data.result);
      setTimeline(data.timeline ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wrap">
      <div className="title-row">
        <div>
          <div className="title">{t('paipan.title')}</div>
          <div className="subtitle">{t('paipan.subtitle')}</div>
        </div>
        <Link href="/naming" className="btn btn-link nav-naming">{t('naming.navLink')}</Link>
      </div>

      <form className="panel" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="field">{t('paipan.year')}
            <input type="number" value={form.year} onChange={set('year')} required />
          </label>
          <label className="field">{t('paipan.month')}
            <input type="number" min="1" max="12" value={form.month} onChange={set('month')} required />
          </label>
          <label className="field">{t('paipan.day')}
            <input type="number" min="1" max="31" value={form.day} onChange={set('day')} required />
          </label>
          <label className="field">{t('paipan.hour')}
            <input type="number" min="0" max="23" value={form.hour} onChange={set('hour')} required />
          </label>
          <label className="field">{t('paipan.minute')}
            <input type="number" min="0" max="59" value={form.minute} onChange={set('minute')} required />
          </label>
          <label className="field">{t('paipan.gender')}
            <select value={form.gender} onChange={set('gender')}>
              <option value="female">{t('common.female')}</option>
              <option value="male">{t('common.male')}</option>
            </select>
          </label>
          <label className="field">{t('paipan.calendar')}
            <select value={form.calendar} onChange={set('calendar')}>
              <option value="solar">{t('common.solar')}</option>
              <option value="lunar">{t('common.lunar')}</option>
            </select>
          </label>
          <label className="field">{t('paipan.birthLon')}
            <input type="number" step="0.01" placeholder={t('common.placeholderLon')} value={form.lon} onChange={set('lon')} />
          </label>
          <label className="field">{t('paipan.timezone')}
            <input type="text" placeholder={t('common.placeholderTz')} value={form.timezone} onChange={set('timezone')} />
          </label>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? t('common.submitting') : t('common.submit')}
          </button>
        </div>
        <div className="hint">{t('paipan.hint')}</div>
      </form>

      {error && <div className="panel error">{t('common.errorPrefix')}{error}</div>}
      {loading && <div className="panel loading">{t('common.loading')}</div>}

      {result && (
        <>
          {result.pillars.year && <ZodiacCard yearBranch={result.pillars.year.zhi} />}

          <div className="panel">
            <h2>{t('paipan.sectionPillars')}</h2>
            <PaipanTable result={result} gender={form.gender} />
          </div>

          <div className="panel">
            <h2>{t('paipan.sectionWuxing')}</h2>
            <SummaryPanel result={result} />
            <WuxingChart result={result} />
          </div>

          <NamingPanel xiYong={result.xiYong} />

          {planFull && timeline && 'dayun' in result && (
            <div className="panel">
              <h2>{t('paipan.sectionTimeline')}</h2>
              <TimelineView
                result={result}
                gender={form.gender}
                liunian={timeline.liunian}
                liuyue={timeline.liuyue}
                liuri={timeline.liuri}
              />
            </div>
          )}

          <div className="report-entry no-print">
            {planFull ? (
              <button type="button" className="btn-report btn-report-primary" onClick={handleGenerateReport}>
                {t('report.actionGenerate')}
              </button>
            ) : (
              <div className="hint">{t('paipan.upgradeFull')}</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
