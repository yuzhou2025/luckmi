/**
 * src/app/[locale]/checkout/success/page.tsx
 * 支付成功页。Creem checkout 完成后重定向到此。
 * webhook 可能稍后才到，客户端轮询 /api/auth/me 确认角色更新。
 */
import { SuccessClient } from './SuccessClient';

export default function Page() {
  return <SuccessClient />;
}
