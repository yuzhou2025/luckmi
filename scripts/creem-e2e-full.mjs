/**
 * scripts/creem-e2e-full.mjs（验证用，可随时删）
 * Creem 支付闭环完整 E2E：
 *  1. magic link 登录 → token
 *  2. 重置测试用户（清订单、降级 registered）
 *  3. 首单 checkout → 模拟 webhook checkout.completed
 *  4. DB 验证：order=paid, entitlements=single_paid
 *  5. 复购 checkout → 价格应为 $4.99
 *  6. 模拟 webhook → DB 验证
 *  7. /api/auth/me 角色查询
 */
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const BASE = 'http://localhost:3000';
const EMAIL = 'luckmi_test_20260910@proton.me';

const env = Object.fromEntries(
  fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8')
    .split(/\r?\n/)
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

// ── DB helper ──
const cs = `postgresql://postgres.kuyljxbopbcrgroysgbd:${encodeURIComponent(env.SUPABASE_DB_PASSWORD)}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;
async function dbQuery(sql, params = []) {
  const client = new pg.Client({ connectionString: cs, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
  await client.connect();
  try { return await client.query(sql, params); } finally { await client.end(); }
}

// ── Step 1: 登录 ──
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: 'magiclink', email: EMAIL, options: { redirectTo: `${BASE}/auth/callback` } });
if (linkErr) { console.error('generateLink FAIL:', linkErr.message); process.exit(1); }
const u = new URL(link.properties.action_link.replace('#', '?'));
const tokenHash = u.searchParams.get('token') ?? u.searchParams.get('token_hash');
const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: verified, error: vErr } = await client.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' });
if (vErr) { console.error('verifyOtp FAIL:', vErr.message); process.exit(1); }
const token = verified.session.access_token;
const uid = verified.user.id;
const authHeader = { 'Content-Type': 'application/json', authorization: `Bearer ${token}` };
console.log(`✅ Step 1: logged in as ${EMAIL} (uid=${uid.slice(0, 8)}…)\n`);

// ── Step 2: 重置 ──
await dbQuery('delete from orders where user_id = $1', [uid]);
await dbQuery("update entitlements set role = 'registered', expires_at = null, updated_at = now() where user_id = $1", [uid]);
console.log('✅ Step 2: reset (orders cleared, role=registered)\n');

// ── Step 3: 首单 checkout ──
const co1 = await fetch(`${BASE}/api/creem/checkout`, { method: 'POST', headers: authHeader, body: JSON.stringify({ sku: 'quick' }) });
const co1Data = await co1.json();
if (!co1.ok) { console.error('✗ checkout 1 failed:', co1.status, co1Data); process.exit(1); }
const order1Id = co1Data.internalOrderId;
const checkoutId1 = co1Data.checkoutUrl.split('/').pop();
console.log(`✅ Step 3: checkout created (first purchase) — price=$${co1Data.price}, order=${order1Id.slice(0, 8)}…, checkout_id=${checkoutId1.slice(0, 20)}…`);

// ── Step 4: 模拟 webhook checkout.completed ──
const webhookBody = JSON.stringify({
  type: 'checkout.completed',
  data: {
    id: checkoutId1,
    request_id: order1Id,
    metadata: { internal_order_id: order1Id, user_id: uid, sku: 'quick' },
  },
});
const wh1 = await fetch(`${BASE}/api/creem/webhook`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: webhookBody });
const wh1Data = await wh1.json();
console.log(`   webhook → ${wh1.status} ${JSON.stringify(wh1Data)}`);

// ── Step 5: DB 验证首单 ──
const r1 = await dbQuery('select status, amount_usd, first_purchase_done, provider_ref from orders where id = $1', [order1Id]);
const e1 = await dbQuery('select role, expires_at from entitlements where user_id = $1', [uid]);
console.log(`✅ Step 5: DB check — order: status=${r1.rows[0].status}, $${r1.rows[0].amount_usd}, first=${r1.rows[0].first_purchase_done}`);
console.log(`   entitlements: role=${e1.rows[0].role}, expires=${e1.rows[0].expires_at ?? 'null'}\n`);

// ── Step 6: 复购 checkout（应 $4.99）──
const co2 = await fetch(`${BASE}/api/creem/checkout`, { method: 'POST', headers: authHeader, body: JSON.stringify({ sku: 'quick' }) });
const co2Data = await co2.json();
if (!co2.ok) { console.error('✗ checkout 2 failed:', co2.status, co2Data); process.exit(1); }
const order2Id = co2Data.internalOrderId;
const checkoutId2 = co2Data.checkoutUrl.split('/').pop();
console.log(`✅ Step 6: checkout created (repeat) — price=$${co2Data.price}, order=${order2Id.slice(0, 8)}…`);

// ── Step 7: 模拟 webhook ──
const wh2 = await fetch(`${BASE}/api/creem/webhook`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'checkout.completed', data: { id: checkoutId2, request_id: order2Id, metadata: { internal_order_id: order2Id, user_id: uid, sku: 'quick' } } }),
});
console.log(`   webhook → ${wh2.status} ${(await wh2.json()).received}`);

// ── Step 8: DB 验证复购 ──
const r2 = await dbQuery('select status, amount_usd, first_purchase_done from orders where id = $1', [order2Id]);
const e2 = await dbQuery('select role from entitlements where user_id = $1', [uid]);
console.log(`✅ Step 8: DB check — order: status=${r2.rows[0].status}, $${r2.rows[0].amount_usd}, first=${r2.rows[0].first_purchase_done}`);
console.log(`   entitlements: role=${e2.rows[0].role}\n`);

// ── Step 9: /api/auth/me 角色查询 ──
const me = await fetch(`${BASE}/api/auth/me`, { headers: { authorization: `Bearer ${token}` } });
const meData = await me.json();
console.log(`✅ Step 9: /api/auth/me → role=${meData.role}, expired=${meData.expired}\n`);

// ── Summary ──
const all = await dbQuery('select sku, status, amount_usd, first_purchase_done from orders where user_id = $1 order by created_at', [uid]);
console.log('════════════════════════════════════════');
console.log('E2E Summary:');
console.log(`  Orders: ${all.rows.length}`);
console.table(all.rows);
console.log(`  Entitlements: role=${e2.rows[0].role}`);
console.log('════════════════════════════════════════');

// 验证断言
const pass = r1.rows[0].status === 'paid' && parseFloat(r1.rows[0].amount_usd) === 2.99
  && e1.rows[0].role === 'single_paid'
  && r2.rows[0].status === 'paid' && parseFloat(r2.rows[0].amount_usd) === 4.99
  && r2.rows[0].first_purchase_done === false
  && meData.role === 'single_paid';
console.log(pass ? '\n🎉 ALL E2E CHECKS PASSED' : '\n❌ SOME CHECKS FAILED');
process.exit(pass ? 0 : 1);
