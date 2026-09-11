/**
 * POST /api/creem/webhook
 * Creem Webhook 回调（官方 creem SDK 验签 + 事件解析）。
 *
 * 关注事件：
 *  - checkout.completed   → 标记 paid + 授予角色
 *  - subscription.active / subscription.paid → 订阅激活/续费（幂等）
 *  - subscription.canceled / subscription.expired → 降级 registered
 *  - refund.created       → 订单 refunded + 降级
 *
 * 验签：SDK 同时支持标准 Svix（webhook-id/timestamp/signature, whsec_）
 *      与旧版 creem-signature（HMAC-SHA256 hex）。
 * 生产环境未配置 CREEM_WEBHOOK_SECRET 时 fail-closed（503）；
 * 开发环境无 secret 时跳过验签（本地确权走 /api/creem/verify）。
 */
import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent, parseWebhookEvent } from 'creem/webhooks';
import { markPaidAndGrant } from '@/lib/payment/orderService';
import { createAdminClient } from '@/lib/db/supabase';

export const runtime = 'nodejs';

const CREEM_WEBHOOK_SECRET = process.env.CREEM_WEBHOOK_SECRET ?? '';
// 以 Creem key 前缀判定是否真实收款模式：live 模式无 webhook secret 直接拒绝端点；
// 沙盒（creem_test_）允许无 secret 解析（成功页 verify 轮询兜底）。
const IS_CREEM_LIVE = !(process.env.CREEM_API_KEY ?? '').startsWith('creem_test_');

type CreemEvent = {
  type: string;
  data: {
    id?: string;
    request_id?: string;
    metadata?: { internal_order_id?: string; user_id?: string; sku?: string };
  };
};

export async function POST(req: NextRequest) {
  const bodyText = await req.text();

  // 1) 验签（live 收款模式无 secret 直接拒绝整个端点）
  if (IS_CREEM_LIVE && !CREEM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'webhook secret not configured' }, { status: 503 });
  }

  let event: CreemEvent;
  try {
    if (CREEM_WEBHOOK_SECRET) {
      const headerObj: Record<string, string> = {};
      req.headers.forEach((v, k) => { headerObj[k] = v; });
      event = (await constructWebhookEvent(bodyText, headerObj, {
        secret: CREEM_WEBHOOK_SECRET,
      })) as CreemEvent;
    } else {
      // 仅开发环境：无 secret 时解析不验签
      event = parseWebhookEvent(bodyText) as CreemEvent;
    }
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid signature', detail: err instanceof Error ? err.message : undefined },
      { status: 401 },
    );
  }

  // request_id（创建 checkout 时传入的内部订单号）优先，metadata 兜底
  const orderId = event.data?.metadata?.internal_order_id ?? event.data?.request_id ?? '';
  const userId = event.data?.metadata?.user_id ?? '';
  const providerRef = event.data?.id ?? '';
  const admin = createAdminClient();

  switch (event.type) {
    case 'checkout.completed':
    case 'subscription.active':
    case 'subscription.paid': {
      if (!orderId) {
        console.warn('creem webhook: event without order reference', event.type);
        break;
      }
      try {
        await markPaidAndGrant({ orderId, providerRef });
      } catch (err) {
        console.error('webhook markPaid error:', err);
      }
      break;
    }

    case 'subscription.expired':
    case 'subscription.canceled': {
      if (!userId) break;
      await admin.from('entitlements').upsert({
        user_id: userId,
        role: 'registered',
        expires_at: null,
        updated_at: new Date().toISOString(),
      });
      break;
    }

    case 'refund.created': {
      if (orderId) {
        await admin.from('orders').update({ status: 'refunded' }).eq('id', orderId);
      }
      if (userId) {
        await admin.from('entitlements').upsert({
          user_id: userId,
          role: 'registered',
          expires_at: null,
          updated_at: new Date().toISOString(),
        });
      }
      break;
    }

    default:
      // 未关注事件静默 ACK，避免 Creem 重试风暴
      break;
  }

  return NextResponse.json({ received: true });
}
