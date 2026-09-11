'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth/AuthProvider';

export function AuthForm() {
  const t = useTranslations('auth');
  const { signInWithOtp, user, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError(t('errorEmail')); return; }
    setSending(true); setError(null);
    try { await signInWithOtp(email.trim()); setSent(true); }
    catch (err) { setError(err instanceof Error ? err.message : String(err)); }
    finally { setSending(false); }
  }

  if (user) {
    return (
      <div className="panel auth-logged">
        <p>{t('loggedInAs', { email: user.email ?? '' })}</p>
        <button className="btn btn-report-primary" onClick={() => signOut()}>{t('logout')}</button>
      </div>
    );
  }
  if (sent) {
    return (
      <div className="panel auth-sent">
        <p>{t('otpSent')}</p>
        <p className="auth-email">{email}</p>
        <button className="btn" onClick={() => { setSent(false); setEmail(''); }}>{t('resend')}</button>
      </div>
    );
  }
  return (
    <form className="panel auth-form" onSubmit={handleSubmit}>
      <h2>{t('title')}</h2>
      <p className="auth-hint">{t('hint')}</p>
      <label className="field">
        {t('email')}
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
      </label>
      <button type="submit" className="btn btn-report-primary" disabled={sending}>{sending ? t('sending') : t('submit')}</button>
      {error && <div className="panel error">{error}</div>}
    </form>
  );
}
