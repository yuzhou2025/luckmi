'use client';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { LocaleSwitcher } from './LocaleSwitcher';

export function BrandHeader() {
  const t = useTranslations('brand');
  const ta = useTranslations('auth');
  const tp = useTranslations('pricing');
  const { user, signOut } = useAuth();

  return (
    <header className="brand-header">
      <div className="brand-logo">
        <span className="brand-name">{t('luckmi')}</span>
        <span className="brand-zh">{t('leqiming')}</span>
      </div>
      <span className="brand-subtitle">{t('subtitle')}</span>
      <div className="brand-actions">
        <LocaleSwitcher />
        <Link href="/checkout" className="btn btn-link brand-pricing">{tp('title')}</Link>
        {user ? (
          <div className="brand-user">
            <span className="brand-email">{user.email}</span>
            <button className="btn btn-link" onClick={() => signOut()}>{ta('logout')}</button>
          </div>
        ) : (
          <Link href="/auth" className="btn btn-link brand-login">{ta('login')}</Link>
        )}
      </div>
    </header>
  );
}
