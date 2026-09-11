'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchTo = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale as 'en' | 'zh' });
  };

  return (
    <div className="locale-switcher">
      {routing.locales.map(l => (
        <button
          key={l}
          className={`locale-btn ${l === locale ? 'active' : ''}`}
          onClick={() => switchTo(l)}
        >
          {l === 'en' ? 'EN' : '中文'}
        </button>
      ))}
    </div>
  );
}
