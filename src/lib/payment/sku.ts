/**
 * src/lib/payment/sku.ts
 * SKU 清单与角色映射（MVP 精简版，4 个收费项）。
 *
 * 收费项：
 *  1. quick        单次起名 $4.99（首单 $2.99）→ single_paid
 *  2. pro_monthly  月度会员 $9.99/月            → pro_monthly（30 天）
 *  3. annual_report 年度报告 $169               → pro_yearly（365 天）
 *  4. consult_wa   一对一真人咨询 $199          → consult_owner
 *
 * 首单判定：orders 表部分唯一索引 (user_id, sku='quick', first_purchase_done=true)
 *   — 存在 paid 的 quick 首单 → 本次按复购价 $4.99；否则首单 $2.99。
 *
 * 环境变量：Creem Dashboard 创建商品后，product_id 填入 .env.local
 */
import type { Role } from '@/lib/auth/types';

export interface SkuConfig {
  /** 内部 SKU（orders.sku 取值） */
  sku: string;
  /** Creem product_id（从环境变量读取） */
  productId: string;
  /** 首单价（仅 quick 有区分；其余 undefined = 固定价） */
  priceFirst?: number;
  /** 复购价/标准价 */
  priceRepeat: number;
  /** 商品描述 */
  description: string;
  /** 支付成功后授予的角色 */
  grantRole: Role;
  /** 权益周期天数（null = 永久 one_time） */
  durationDays: number | null;
  /** Creem billing type: one_time | recurring */
  billingType: 'one_time' | 'recurring';
}

/** 从环境变量读取 Creem product_id */
function envProduct(key: string): string {
  return process.env[key] ?? '';
}

export const SKU_MAP: Record<string, SkuConfig> = {
  // 单次起名 — 首单 $2.99
  quick: {
    sku: 'quick',
    productId: envProduct('CREEM_PRODUCT_QUICK_FIRST'),
    priceFirst: 2.99,
    priceRepeat: 4.99,
    description: 'Quick Name — 10 candidates with full meaning',
    grantRole: 'single_paid',
    durationDays: null,
    billingType: 'one_time',
  },
  // 单次起名 — 复购 $4.99
  quick_repeat: {
    sku: 'quick',
    productId: envProduct('CREEM_PRODUCT_QUICK_REPEAT'),
    priceRepeat: 4.99,
    description: 'Quick Name (repeat purchase) — 10 candidates',
    grantRole: 'single_paid',
    durationDays: null,
    billingType: 'one_time',
  },
  // 月度会员 — $9.99/月
  pro_monthly: {
    sku: 'pro_monthly',
    productId: envProduct('CREEM_PRODUCT_PRO_MONTHLY'),
    priceRepeat: 9.99,
    description: 'Pro Monthly — unlimited names + monthly report',
    grantRole: 'pro_monthly',
    durationDays: 30,
    billingType: 'recurring',
  },
  // 年度报告 — $169 一次性
  annual_report: {
    sku: 'annual_report',
    productId: envProduct('CREEM_PRODUCT_ANNUAL_REPORT'),
    priceRepeat: 169,
    description: 'Annual Report — dayun + monthly forecast',
    grantRole: 'pro_yearly',
    durationDays: 365,
    billingType: 'one_time',
  },
  // 一对一真人咨询 — $199
  consult_wa: {
    sku: 'consult_wa',
    productId: envProduct('CREEM_PRODUCT_CONSULT_WA'),
    priceRepeat: 199,
    description: '1-on-1 Master Consultation via WhatsApp (45 min)',
    grantRole: 'consult_owner',
    durationDays: null,
    billingType: 'one_time',
  },
};

/**
 * 确定 quick SKU 的实际价格和 product key：
 *  - 首单：CREEM_PRODUCT_QUICK_FIRST（$2.99）
 *  - 复购：CREEM_PRODUCT_QUICK_REPEAT（$4.99）
 */
export function resolveQuickSku(
  hasFirstPurchase: boolean,
): { key: string; price: number; isFirst: boolean } {
  if (hasFirstPurchase) {
    return { key: 'quick_repeat', price: SKU_MAP.quick_repeat.priceRepeat, isFirst: false };
  }
  return { key: 'quick', price: SKU_MAP.quick.priceFirst!, isFirst: true };
}
