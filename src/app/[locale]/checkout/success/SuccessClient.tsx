/**
 * src/app/[locale]/checkout/success/SuccessClient.tsx
 * 支付成功页客户端组件。
 * Creem 跳回时 URL 带 ?checkout_id=ch_xxx，
 * 轮询 /api/creem/verify（服务端主动查 Creem + 发放权益，不依赖 webhook），
 * 成功后刷新 session 显示角色。
 */
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';

export function SuccessClient() {
  const t = useTranslations('pricing');
  const { session, refreshSession } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!session?.access_token) return;
    const params = new URLSearchParams(window.location.search);
    // Creem 回跳参数 checkout_id，兼容个别环境用 id
    const checkoutId = params.get('checkout_id') ?? params.get('id') ?? '';
    if (!checkoutId) return;

    let cancelled = false;

    async function poll() {
      for (let i = 0; i < 8; i++) {
        if (cancelled) return;
        setCount(i + 1);
        try {
          const res = await fetch(
            `/api/creem/verify?checkoutId=${encodeURIComponent(checkoutId)}`,
            {
              headers: { authorization: `Bearer ${session!.access_token}` },
            },
          );
          const data = (await res.json()) as {
            status?: string;
            role?: string;
          };
          if (data.status === 'completed') {
            await refreshSession();
            if (!cancelled) setRole(data.role ?? 'paid');
            return;
          }
          if (data.status === 'expired') {
            if (!cancelled) setExpired(true);
            return;
          }
        } catch {
          // 网络抖动继续重试
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [session?.access_token, refreshSession]);

  return (
    <div className="wrap">
      <div className="panel success-panel">
        <div className="title">{t('success')}</div>
        {role ? (
          <div className="subtitle">{t('successRole', { role })}</div>
        ) : expired ? (
          <div className="subtitle">{t('failed')}</div>
        ) : count > 0 ? (
          <div className="subtitle">{t('redirecting')} ({count}/8)</div>
        ) : null}
      </div>
      <div className="back-link">
        <Link href="/">{t('back')}</Link>
      </div>
    </div>
  );
}
