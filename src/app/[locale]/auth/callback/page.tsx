/**
 * src/app/[locale]/auth/callback/page.tsx
 * Magic link 回跳页：Supabase 邮件链接默认落到 {SITE_URL}/auth/callback。
 * 浏览器端 client 的 detectSessionInUrl 会自动从 URL 中换取会话，
 * 本页只在拿到 session 后跳回首页。
 */
'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';

export default function AuthCallbackPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { session } = useAuth();

  useEffect(() => {
    if (session) router.replace('/');
  }, [session, router]);

  return (
    <div className="wrap">
      <div className="panel auth-sent">
        <p>{t('loggingIn')}</p>
      </div>
    </div>
  );
}
