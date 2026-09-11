/**
 * src/lib/auth/serverRole.ts
 * 服务端角色解析（ADR-3：权限即字段裁剪，API 层执行）。
 *
 * 链路：客户端 fetch 带 `Authorization: Bearer <access_token>`（来自 AuthProvider 的
 * localStorage session）→ supabase.auth.getUser(token) 验证 → 查 entitlements 表
 * （service_role 绕过 RLS）→ 得到角色。
 *
 * 规则：
 *  - 无/无效 token、查无用户 → guest；
 *  - 查无 entitlements 行（历史用户）→ registered（v7 §5.2 默认档）；
 *  - expires_at 已过 → 角色保留但标记 expired，由 getCapabilities 降级为 registered 档。
 */
import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/db/supabase';
import type { Role } from './types';

const VALID_ROLES: ReadonlySet<string> = new Set([
  'guest', 'registered', 'single_paid', 'bazi_report',
  'pro_monthly', 'pro_yearly', 'consult_owner',
]);

export interface RoleContext {
  role: Role;
  userId: string | null;
  expired: boolean;
}

const GUEST: RoleContext = { role: 'guest', userId: null, expired: false };

export async function resolveRoleFromRequest(req: NextRequest): Promise<RoleContext> {
  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return GUEST;

  const admin = createAdminClient();
  const { data: userData, error } = await admin.auth.getUser(token);
  if (error || !userData?.user) return GUEST;
  const uid = userData.user.id;

  const { data: ent, error: entErr } = await admin
    .from('entitlements')
    .select('role, expires_at')
    .eq('user_id', uid)
    .maybeSingle();
  if (entErr || !ent) return { role: 'registered', userId: uid, expired: false };

  const role = VALID_ROLES.has(ent.role) ? (ent.role as Role) : 'registered';
  const expired = ent.expires_at ? new Date(ent.expires_at).getTime() < Date.now() : false;
  return { role, userId: uid, expired };
}
