/**
 * scripts/creem-checkout-e2e.mjs（验证用，可随时删）
 * 端到端验证 4 个 SKU 的 checkout 创建：
 *  1. admin 生成 magic link → verifyOtp 换用户 access_token
 *  2. 逐个 POST /api/creem/checkout
 *  3. 校验返回 checkoutUrl + 价格（不真正支付）
 * 用法：node scripts/creem-checkout-e2e.mjs [email]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8')
    .split(/\r?\n/)
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const email = process.argv[2] ?? 'luckmi_test_20260910@proton.me';
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// 1) magic link → token_hash → session
const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
  type: 'magiclink',
  email,
  options: { redirectTo: 'http://localhost:3000/auth/callback' },
});
if (linkErr) { console.error('generateLink FAIL:', linkErr.message); process.exit(1); }

const u = new URL(link.properties.action_link.replace('#', '?'));
const tokenHash =
  u.searchParams.get('token') ??
  u.searchParams.get('token_hash') ??
  u.searchParams.get('code');
const type = u.searchParams.get('type') ?? 'magiclink';

const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data: verified, error: vErr } = await client.auth.verifyOtp({
  token_hash: tokenHash,
  type,
});
if (vErr) { console.error('verifyOtp FAIL:', vErr.message); process.exit(1); }
const token = verified.session.access_token;
console.log(`logged in as ${email}\n`);

// 2) 4 个 SKU
const SKUS = ['quick', 'pro_monthly', 'annual_report', 'consult_wa'];
for (const sku of SKUS) {
  const res = await fetch('http://localhost:3000/api/creem/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ sku }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(`✗ ${sku}: HTTP ${res.status} ${JSON.stringify(data).slice(0, 200)}`);
    continue;
  }
  const url = new URL(data.checkoutUrl);
  console.log(`✓ ${sku.padEnd(15)} $${data.price}  ${url.origin}${url.pathname}?${url.searchParams.get('id') ? 'id=' + url.searchParams.get('id').slice(0, 22) + '…' : ''}`);
}
