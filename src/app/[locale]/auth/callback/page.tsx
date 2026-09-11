/**
 * src/app/[locale]/auth/callback/page.tsx
 * Magic link 回跳页。浏览器 client 已关闭 detectSessionInUrl（PKCE 默认），
 * 本页显式处理两种回跳格式：
 *  1. PKCE（真实邮件链接，ssr cookie client 默认 flow）：?code=xxx → exchangeCodeForSession
 *  2. Implicit（admin.generateLink 测试链接/旧链接）：#access_token=...&refresh_token=... → setSession
 * 成功写入 cookie 会话后跳回首页；AuthProvider 的 onAuthStateChange 会同步登录态。
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';

export default function AuthCallbackPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { supabase, session } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // 防止 React StrictMode 双调用 / effect 重跑导致 code 被消费两次
  const handled = useRef(false);

  useEffect(() => {
    // 已存在会话（如同标签页二次回跳）直接回首页
    if (session) {
      router.replace('/');
      return;
    }
    if (handled.current) return;
    handled.current = true;

    (async () => {
      const url = new URL(window.location.href);

      // 1) PKCE：?code=xxx
      const code = url.searchParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setErrorMsg(error.message);
          return;
        }
        router.replace('/');
        return;
      }

      // 2) Implicit：#access_token=xxx&refresh_token=xxx
      const hashParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash);
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          setErrorMsg(error.message);
          return;
        }
        router.replace('/');
        return;
      }

      // 3) 错误回跳（Supabase 在 query 带 error/error_description）
      const desc = url.searchParams.get('error_description') ?? url.searchParams.get('error');
      if (desc) {
        setErrorMsg(desc);
        return;
      }

      // 4) 无任何 token：短暂等待会话注入后仍无会话则报错
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace('/');
      } else {
        setErrorMsg(t('callbackError'));
      }
    })();
  }, [session, supabase, router, t]);

  return (
    <div className="wrap">
      <div className="panel auth-sent">
        {errorMsg ? (
          <>
            <p>{t('callbackError')}</p>
            <p className="auth-hint" style={{ wordBreak: 'break-word' }}>{errorMsg}</p>
          </>
        ) : (
          <p>{t('loggingIn')}</p>
        )}
      </div>
    </div>
  );
}
