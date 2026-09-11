/**
 * scripts/check-test-orders.mjs（验证用，可随时删）
 * 查看测试用户最新订单与权益状态。用法：node scripts/check-test-orders.mjs [email]
 */
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const email = process.argv[2] ?? 'luckmi_test_20260910@proton.me';
const env = Object.fromEntries(
  fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8')
    .split(/\r?\n/)
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const cs = `postgresql://postgres.kuyljxbopbcrgroysgbd:${encodeURIComponent(env.SUPABASE_DB_PASSWORD)}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;
const client = new pg.Client({ connectionString: cs, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
await client.connect();
const { rows } = await client.query(
  `select o.id, o.sku, o.status, o.amount_usd, o.first_purchase_done, o.provider_ref, o.created_at,
          e.role, e.expires_at
   from orders o
   join auth.users u on u.id = o.user_id
   left join entitlements e on e.user_id = o.user_id
   where u.email = $1
   order by o.created_at desc limit 6`,
  [email],
);
console.table(rows.map(r => ({
  sku: r.sku,
  status: r.status,
  usd: r.amount_usd,
  first: r.first_purchase_done,
  role: r.role,
  provider: r.provider_ref ? r.provider_ref.slice(0, 18) + '…' : null,
  created: r.created_at?.toISOString().slice(5, 19),
})));
await client.end();
