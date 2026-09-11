/**
 * src/app/[locale]/checkout/page.tsx
 * 定价/结算页：展示 SKU 套餐，点击购买 → POST /api/creem/checkout → 跳转 Creem 托管支付页。
 */
import { PricingClient } from './PricingClient';

export default function Page() {
  return <PricingClient />;
}
