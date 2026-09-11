/**
 * src/middleware.ts
 * next-intl locale 路由 + Supabase 会话刷新（@supabase/ssr 官方组合模式）。
 *
 * 每次页面导航：createServerClient 从请求 cookie 恢复会话，getUser() 触发
 * access_token 过期自动刷新，新令牌通过响应 Set-Cookie 下发，
 * 使 SSR 能读到登录态（与 AuthProvider initialSession 配合消除 hydration 不一致）。
 */
import createIntlMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // 同步给后续可能复用 request 的逻辑
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // 写回最终响应（含 locale redirect 响应）
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // 必要：触发过期令牌刷新
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // 排除 API / 静态资源 / 带后缀文件
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
