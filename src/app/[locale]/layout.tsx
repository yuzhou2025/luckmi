import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { BrandHeader } from './components/BrandHeader';
import { LocaleSwitcher } from './components/LocaleSwitcher';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { createServerClient } from '@/lib/db/supabase';
import { ServiceWorkerRegistrar } from './components/ServiceWorkerRegistrar';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isZh = locale === 'zh';
  return {
    title: isZh ? 'LUCKMI · 乐祺名 · 八字排盘' : 'LUCKMI · BaZi Names & Fortune Studio',
    description: isZh
      ? '工程化八字命理与中文起名系统'
      : 'Engineering-grade BaZi chart & Chinese naming studio',
    manifest: '/manifest.webmanifest',
    icons: {
      icon: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    appleWebApp: {
      capable: true,
      title: 'LUCKMI',
      statusBarStyle: 'black-translucent',
    },
    alternates: {
      languages: {
        'en': '/',
        'zh': '/zh',
        'x-default': '/',
      },
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#1A1426',
  width: 'device-width',
  initialScale: 1,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as 'en' | 'zh')) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const t = await getTranslations('compliance');

  // SSR 从 cookie 恢复会话，作为 AuthProvider 初始值（首屏登录态与服务端一致）
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider initialSession={session}>
            <ServiceWorkerRegistrar />
            <BrandHeader />
            <main>{children}</main>
            <footer className="compliance-footer">
              <p>{t('footer')}</p>
            </footer>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
