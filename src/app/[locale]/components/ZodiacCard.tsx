'use client';

import { useTranslations } from 'next-intl';
import { getZodiac } from '@/lib/i18n/zodiac';

export function ZodiacCard({ yearBranch }: { yearBranch: string }) {
  const t = useTranslations();
  const z = getZodiac(yearBranch);
  if (!z) return null;
  const locale = t.has('brand.luckmi') ? (t('brand.luckmi') === 'LUCKMI' ? 'en' : 'zh') : 'en';
  return (
    <div className="zodiac-card">
      <svg viewBox="0 0 64 64" width="48" height="48" className="zodiac-svg">
        <path d={z.svg} fill="var(--brand-gold)" />
      </svg>
      <div className="zodiac-info">
        <span className="zodiac-emoji">{z.emoji}</span>
        <span className="zodiac-name">{locale === 'zh' ? z.zh : z.en}</span>
        <span className="zodiac-traits">{locale === 'zh' ? z.traitsZh : z.traitsEn}</span>
      </div>
    </div>
  );
}
