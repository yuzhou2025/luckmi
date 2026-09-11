/**
 * src/app/[locale]/checkout/PricingClient.tsx
 * 定价页客户端组件。展示 7 种 SKU，点击购买 → 调 /api/creem/checkout → 跳转 Creem 结算。
 */
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';

interface SkuCard {
  key: string;
  nameKey: string;
  descKey: string;
  priceKey: string;
}

const SKUS: SkuCard[] = [
  { key: 'quick', nameKey: 'quickName', descKey: 'quickNameDesc', priceKey: 'quickNamePrice' },
  { key: 'pro_monthly', nameKey: 'proMonthly', descKey: 'proMonthlyDesc', priceKey: 'proMonthlyPrice' },
  { key: 'annual_report', nameKey: 'annualReport', descKey: 'annualReportDesc', priceKey: 'annualReportPrice' },
  { key: 'consult_wa', nameKey: 'consultWa', descKey: 'consultWaDesc', priceKey: 'consultWaPrice' },
];

export function PricingClient() {
  const t = useTranslations('pricing');
  const { session } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleBuy(sku: string) {
    if (!session?.access_token) {
      setError(t('loginRequired'));
      return;
    }
    setLoading(sku);
    setError(null);
    try {
      const res = await fetch('/api/creem/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ sku }),
      });
      const data = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error ?? 'checkout failed');
      }
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="wrap">
      <div className="title">{t('title')}</div>
      <div className="subtitle">{t('subtitle')}</div>

      {error && <div className="panel error">{error}</div>}

      <div className="pricing-grid">
        {SKUS.map((s) => (
          <div key={s.key} className="panel pricing-card">
            <h3>{t(s.nameKey)}</h3>
            <p className="pricing-desc">{t(s.descKey)}</p>
            <div className="pricing-price">{t(s.priceKey)}</div>
            <button
              className="btn btn-report-primary"
              onClick={() => handleBuy(s.key)}
              disabled={loading === s.key}
            >
              {loading === s.key ? t('redirecting') : t('buy')}
            </button>
          </div>
        ))}
      </div>

      <div className="back-link">
        <Link href="/">{t('back')}</Link>
      </div>
    </div>
  );
}
