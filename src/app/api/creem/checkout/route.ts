/**
 * POST /api/creem/checkout
 * 创建 Creem checkout session，返回 checkoutUrl 供前端跳转。
 *
 * 请求体：{ sku: string }
 * 响应：{ checkoutUrl: string, internalOrderId: string }
 *
 * 流程：
 *  1. 解析用户 → guest 拒绝
 *  2. 查首单 → 确定 Creem product_id + 价格
 *  3. 插入 pending 订单
 *  4. 调 Creem Checkout API 创建 session
 *  5. 返回 checkoutUrl
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRoleFromRequest } from '@/lib/auth/serverRole';
import { resolveSkuForCheckout } from '@/lib/payment/orderService';
import { hasQuickFirstPurchase, createPendingOrder } from '@/lib/payment/orderService';
import { SKU_MAP } from '@/lib/payment/sku';

export const runtime = 'nodejs';

const CREEM_API_KEY = process.env.CREEM_API_KEY ?? '';
const CREEM_API_BASE =
  process.env.NODE_ENV === 'production'
    ? 'https://api.creem.io/v1'
    : 'https://test-api.creem.io/v1';

export async function POST(req: NextRequest) {
  const rc = await resolveRoleFromRequest(req);
  if (!rc.userId) {
    return NextResponse.json({ error: 'login required' }, { status: 401 });
  }

  let body: { sku?: string };
  try {
    body = (await req.json()) as { sku?: string };
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  const sku = body.sku;
  if (!sku || !SKU_MAP[sku]) {
    return NextResponse.json({ error: 'invalid sku' }, { status: 400 });
  }

  // 首单判定
  const isFirst = sku === 'quick' ? !(await hasQuickFirstPurchase(rc.userId)) : false;
  const { productId, price, isFirst: actualFirst, cfg } = resolveSkuForCheckout(
    sku,
    !isFirst,
  );

  if (!productId) {
    return NextResponse.json(
      { error: `Creem product_id not configured for sku: ${sku}. Set env var and create product in Creem Dashboard.` },
      { status: 500 },
    );
  }

  // 插入 pending 订单
  const internalOrderId = await createPendingOrder({
    userId: rc.userId,
    sku: cfg.sku,
    isFirst: actualFirst,
    amount: price,
    paymentProvider: 'creem',
  });

  // 调 Creem Checkout API
  const checkoutRes = await fetch(`${CREEM_API_BASE}/checkouts`, {
    method: 'POST',
    headers: {
      'x-api-key': CREEM_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: productId,
      request_id: internalOrderId,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/checkout/success`,
      metadata: {
        internal_order_id: internalOrderId,
        user_id: rc.userId,
        sku: cfg.sku,
      },
    }),
  });

  if (!checkoutRes.ok) {
    const errBody = await checkoutRes.text();
    return NextResponse.json(
      { error: `Creem checkout failed (${checkoutRes.status}): ${errBody}` },
      { status: 502 },
    );
  }

  const data = (await checkoutRes.json()) as { checkout_url: string };
  return NextResponse.json({
    checkoutUrl: data.checkout_url,
    internalOrderId,
    price,
  });
}
