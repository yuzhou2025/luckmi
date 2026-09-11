'use client';

import { useState } from 'react';
import type { PaipanResult } from '@/lib/bazi/paipan';
import type { TimelineItem } from '@/lib/bazi/timeline';
import { PaipanTable } from './components/PaipanTable';
import { WuxingChart } from './components/WuxingChart';
import { SummaryPanel } from './components/SummaryPanel';
import { TimelineView } from './components/TimelineView';

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

export default function Home() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [result, setResult] = useState<PaipanResult | null>(null);
  const [timeline, setTimeline] = useState<{
    liunian: TimelineItem[]; liuyue: TimelineItem[]; liuri: TimelineItem[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { paipan } = await import('@/lib/bazi/paipan');
      const { getLiunian, getLiuyue, getLiuri } = await import('@/lib/bazi/timeline');
      const now = new Date();

      const r = await paipan({
        year: +form.year, month: +form.month, day: +form.day,
        hour: +form.hour, minute: +form.minute,
        gender: form.gender,
        calendar: form.calendar,
        ...(form.lon ? { lon: +form.lon } : {}),
        ...(form.timezone ? { timezone: form.timezone } : {}),
        now,
      });

      const curDayun = r.dayun.find(d => d.isCurrent)?.ganzhi ?? r.dayun[0]?.ganzhi ?? '甲子';
      const liunian = await getLiunian(r, curDayun, now);
      const curLN = liunian.find(x => x.isCurrent)?.ganzhi ?? '甲子';
      const liuyue = await getLiuyue(r, now.getFullYear(), curDayun, curLN, now);
      const liuri = await getLiuri(r, now);

      setResult(r);
      setTimeline({ liunian, liuyue, liuri });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wrap">
      <div className="title">LUCKMI · 八字排盘</div>
      <div className="subtitle">工程化排盘 · 真太阳时 · 神煞/格局/大运流年（lunar-javascript 引擎）</div>

      <form className="panel" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="field">年
            <input type="number" value={form.year} onChange={set('year')} required />
          </label>
          <label className="field">月
            <input type="number" min="1" max="12" value={form.month} onChange={set('month')} required />
          </label>
          <label className="field">日
            <input type="number" min="1" max="31" value={form.day} onChange={set('day')} required />
          </label>
          <label className="field">时
            <input type="number" min="0" max="23" value={form.hour} onChange={set('hour')} required />
          </label>
          <label className="field">分
            <input type="number" min="0" max="59" value={form.minute} onChange={set('minute')} required />
          </label>
          <label className="field">性别
            <select value={form.gender} onChange={set('gender')}>
              <option value="female">女</option>
              <option value="male">男</option>
            </select>
          </label>
          <label className="field">历法
            <select value={form.calendar} onChange={set('calendar')}>
              <option value="solar">公历</option>
              <option value="lunar">农历</option>
            </select>
          </label>
          <label className="field">出生地经度（可选）
            <input type="number" step="0.01" placeholder="如 116.4" value={form.lon} onChange={set('lon')} />
          </label>
          <label className="field">时区（可选）
            <input type="text" placeholder="Asia/Shanghai" value={form.timezone} onChange={set('timezone')} />
          </label>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? '排盘中…' : '排盘'}
          </button>
        </div>
        <div className="hint">默认填充基准命盘：1975-06-14 00:30 女（乙卯 壬午 辛卯 戊子）。留空经度/时区则按东八区真太阳时。</div>
      </form>

      {error && <div className="panel error">排盘失败：{error}</div>}
      {loading && <div className="panel loading">正在排盘…</div>}

      {result && (
        <>
          <div className="panel">
            <h2>四柱八字</h2>
            <PaipanTable result={result} gender={form.gender} />
          </div>

          <div className="panel">
            <h2>五行与喜用</h2>
            <SummaryPanel result={result} />
            <WuxingChart result={result} />
          </div>

          {timeline && (
            <div className="panel">
              <h2>大运 / 流年 / 流月 / 流日</h2>
              <TimelineView
                result={result}
                gender={form.gender}
                liunian={timeline.liunian}
                liuyue={timeline.liuyue}
                liuri={timeline.liuri}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
