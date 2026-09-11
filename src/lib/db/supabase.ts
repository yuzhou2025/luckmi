/**
 * Supabase 客户端工厂：browser/server/admin 三客户端。
 *  - getBrowserClient：React 组件内用（@supabase/ssr cookie 会话，模块单例，
 *    SSR/CSR 共享同一会话，避免多 GoTrueClient 实例与 hydration 不一致）。
 *  - createServerClient：Server Component / Route Handler（@supabase/ssr cookie 会话）。
 *  - createAdminClient：service_role，绕过 RLS，仅限 webhook/后台脚本。
 *
 * 注意：next/headers 在 createServerClient 函数体内动态 import，
 * 避免 Client Component 引用本文件时被打包进 client bundle。
 * service_role key 仅在 createAdminClient 函数体内读取，不会打包到 client。
 */
import { createClient } from '@supabase/supabase-js';
import { createBrowserClient as createSsrBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** 模块级单例：整个浏览器生命周期复用同一个 client（cookie 存储会话） */
let browserClient: ReturnType<typeof createSsrBrowserClient> | null = null;

export function getBrowserClient() {
  if (!browserClient) {
    browserClient = createSsrBrowserClient(url, anonKey);
  }
  return browserClient;
}

export async function createServerClient() {
  const [{ cookies }, { createServerClient: createSsrServerClient }] = await Promise.all([
    import('next/headers'),
    import('@supabase/ssr'),
  ]);
  const cookieStore = await cookies();
  return createSsrServerClient(url, anonKey, {
    cookies: {
      get(name: string) { return cookieStore.get(name)?.value; },
      set(name: string, value: string, options: Record<string, unknown>) { try { cookieStore.set(name, value, options as any); } catch { /* RSC 只读上下文，刷新由 middleware 负责 */ } },
      remove(name: string, options: Record<string, unknown>) { try { cookieStore.set(name, '', { ...options, maxAge: 0 } as any); } catch { /* 同上 */ } },
    },
  });
}

export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
