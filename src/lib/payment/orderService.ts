/**
 * src/lib/payment/orderService.ts
 * 订单生命周期服务（service_role 操作，绕过 RLS）。
 *
 * 流程：createPendingOrder → (Creem checkout) → webhook: markPaid + grantEntitlement
 * 首单判定：查 paid quick 订单是否存在 → 决定首单/复购价
 */
import { createAdminClient } from '@/lib/db/supabase';
import { SKU_MAP, resolveQuickSku, type SkuConfig } from './sku';
import type { Role } from '@/lib/auth/types';

/** 查用户是否已有 paid 的 quick 首单 */
export async function hasQuickFirstPurchase(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { count } = await admin
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('sku', 'quick')
    .eq('first_purchase_done', true)
    .eq('status', 'paid');
  return (count ?? 0) > 0;
}

/** 创建 pending 订单，返回内部订单 UUID */
export async function createPendingOrder(params: {
  userId: string;
  sku: string;
  isFirst: boolean;
  amount: number;
  paymentProvider: 'creem';
}): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('orders')
    .insert({
      user_id: params.userId,
      sku: params.sku,
      amount_usd: params.amount,
      status: 'pending',
      payment_provider: 'creem',
      first_purchase_done: params.isFirst,
    })
    .select('id')
    .single();
  if (error || !data) {
    throw new Error(`createPendingOrder failed: ${error?.message ?? 'no data'}`);
  }
  return data.id;
}

/**
 * 标记订单 paid 并更新 entitlements（service_role，绕过 RLS）。
 * 幂等：status 已 paid 时跳过。
 */
export async function markPaidAndGrant(params: {
  orderId: string;
  providerRef: string;
}): Promise<void> {
  const admin = createAdminClient();

  // 1) 读取订单（幂等检查）
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .select('*')
    .eq('id', params.orderId)
    .single();
  if (orderErr || !order) throw new Error(`order not found: ${params.orderId}`);
  if (order.status === 'paid') return; // 幂等：已处理

  const cfg: SkuConfig | undefined = SKU_MAP[order.sku];
  if (!cfg) throw new Error(`unknown sku in order: ${order.sku}`);

  // 2) 更新订单状态
  const { error: updErr } = await admin
    .from('orders')
    .update({
      status: 'paid',
      provider_ref: params.providerRef,
    })
    .eq('id', params.orderId)
    .neq('status', 'paid'); // 并发保护：只有非 paid 才更新
  if (updErr) throw new Error(`markPaid failed: ${updErr.message}`);

  // 3) 授予 entitlements
  const expiresAt =
    cfg.durationDays !== null
      ? new Date(Date.now() + cfg.durationDays * 86_400_000).toISOString()
      : null;

  const { error: entErr } = await admin
    .from('entitlements')
    .upsert({
      user_id: order.user_id,
      role: cfg.grantRole as Role,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    });
  if (entErr) throw new Error(`grantEntitlement failed: ${entErr.message}`);
}

/** 根据订单 SKU 查找对应的 Creem product_id 和价格 */
export function resolveSkuForCheckout(
  sku: string,
  hasFirstPurchase: boolean,
): { productId: string; price: number; isFirst: boolean; cfg: SkuConfig } {
  if (sku === 'quick') {
    const r = resolveQuickSku(hasFirstPurchase);
    const cfg = SKU_MAP[r.key];
    return { productId: cfg.productId, price: r.price, isFirst: r.isFirst, cfg };
  }
  const cfg = SKU_MAP[sku];
  if (!cfg) throw new Error(`unknown sku: ${sku}`);
  return { productId: cfg.productId, price: cfg.priceRepeat, isFirst: false, cfg };
}
