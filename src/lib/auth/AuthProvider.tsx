'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getBrowserClient } from '@/lib/db/supabase';
import type { Session, User, SupabaseClient } from '@supabase/supabase-js';

interface AuthContextValue {
  supabase: SupabaseClient;
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithOtp: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** 刷新会话并查当前角色（支付成功页轮询用） */
  refreshSession: () => Promise<{ data: { role: string } | null }>;
}
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  children,
  initialSession = null,
}: {
  children: ReactNode;
  /** SSR 从 cookie 读出的会话，保证首屏与服务端渲染一致（消除 hydration mismatch） */
  initialSession?: Session | null;
}) {
  const [supabase] = useState<SupabaseClient>(() => getBrowserClient());
  const [session, setSession] = useState<Session | null>(initialSession);
  // SSR 已有会话时首屏即就绪；无会话时等客户端 getSession 确认
  const [loading, setLoading] = useState(initialSession === null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) { setSession(data.session); setLoading(false); }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, s) => {
      if (mounted) setSession(s);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [supabase]);

  const value: AuthContextValue = {
    supabase,
    session,
    user: session?.user ?? null,
    loading,
    signInWithOtp: async (email: string) => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined },
      });
      if (error) throw error;
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    refreshSession: async () => {
      // 刷新 JWT（会话可能被 Supabase 后台更新）
      const { data: refreshData } = await supabase.auth.refreshSession();
      const token = refreshData.session?.access_token;
      if (!token) return { data: null };
      // 查当前角色（走 /api/auth/me 接口，服务端读 entitlements）
      try {
        const res = await fetch('/api/auth/me', {
          headers: { authorization: `Bearer ${token}` },
        });
        if (!res.ok) return { data: null };
        const data = (await res.json()) as { role: string };
        return { data };
      } catch {
        return { data: null };
      }
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
