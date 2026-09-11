/**
 * GET /api/creem/verify?checkoutId=ch_xxx
 * 支付成功页轮询此接口：服务端向 Creem 查询 checkout 状态，
 * completed 则发放权益。本地开发无公网 webhook 时的主要确权通道；
 * 生产环境与 webhook 并存（markPaidAndGrant 幂等，重复调用安全）。
 *
 * 响应：{ status: 'completed'|'pending'|'expired', role?: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRoleFromRequest } from '@/lib/auth/serverRole';
import { markPaidAndGrant } from '@/lib/payment/orderService';
import { createAdminClient } from '@/lib/db/supabase';

export const runtime = 'nodejs';

const CREEM_API_KEY = process.env.CREEM_API_KEY ?? '';
// 以 key 前缀区分 Creem 环境（沙盒 key creem_test_ → test-api；live key → 生产）
const CREEM_API_BASE = CREEM_API_KEY.startsWith('creem_test_')
  ? 'https://test-api.creem.io/v1'
  : 'https://api.creem.io/v1';

export async function GET(req: NextRequest) {
  const rc = await resolveRoleFromRequest(req);
  if (!rc.userId) {
    return NextResponse.json({ error: 'login required' }, { status: 401 });
  }

  const checkoutId = req.nextUrl.searchParams.get('checkoutId');
  if (!checkoutId) {
    return NextResponse.json({ error: 'checkoutId required' }, { status: 400 });
  }

  // 1) 向 Creem 查询 checkout 状态（GET /v1/checkouts?checkout_id=…）
  const res = await fetch(
    `${CREEM_API_BASE}/checkouts?checkout_id=${encodeURIComponent(checkoutId)}`,
    { headers: { 'x-api-key': CREEM_API_KEY } },
  );
  if (!res.ok) {
    return NextResponse.json(
      { error: `Creem query failed (${res.status})` },
      { status: 502 },
    );
  }

  const checkout = (await res.json()) as {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'expired';
    request_id?: string;
    metadata?: { internal_order_id?: string; user_id?: string; sku?: string };
  };

  if (checkout.status !== 'completed') {
    return NextResponse.json({ status: checkout.status });
  }

  // 2) 定位内部订单（request_id 优先，metadata 兜底）
  const internalOrderId =
    checkout.request_id || checkout.metadata?.internal_order_id || '';
  if (!internalOrderId) {
    return NextResponse.json({ error: 'order reference missing' }, { status: 400 });
  }

  // 3) 安全校验：订单必须属于当前登录用户
  const admin = createAdminClient();
  const { data: order } = await admin
    .from('orders')
    .select('user_id, status')
    .eq('id', internalOrderId)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: 'order not found' }, { status: 404 });
  }
  if (order.user_id !== rc.userId) {
    return NextResponse.json({ error: 'order ownership mismatch' }, { status: 403 });
  }

  // 4) 发放权益（幂等）
  await markPaidAndGrant({ orderId: internalOrderId, providerRef: checkout.id });

  // 5) 读取授予后的角色返回
  const fresh = await resolveRoleFromRequest(req);
  return NextResponse.json({ status: 'completed', role: fresh.role });
}
