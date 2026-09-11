import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { AuthForm } from '../components/AuthForm';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}
export default async function AuthRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as 'en' | 'zh')) notFound();
  setRequestLocale(locale);
  return <div className="wrap"><AuthForm /></div>;
}
