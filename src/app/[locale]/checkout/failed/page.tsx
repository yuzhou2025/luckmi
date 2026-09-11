/**
 * src/app/[locale]/checkout/failed/page.tsx
 * 支付失败/取消页。
 */
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function Page() {
  const t = useTranslations('pricing');
  return (
    <div className="wrap">
      <div className="panel error">
        <div className="title">{t('failed')}</div>
      </div>
      <div className="back-link">
        <Link href="/">{t('back')}</Link>
      </div>
    </div>
  );
}
