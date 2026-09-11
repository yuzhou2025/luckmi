/**
 * scripts/reset-test-user.mjs（验证用，可随时删）
 * 支付 E2E 前重置测试用户：
 *  - entitlements → registered，expires_at = null
 *  - 删除历史 orders（恢复首单资格 $2.99）
 * 用法：node scripts/reset-test-user.mjs [email]
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

const REF = 'kuyljxbopbcrgroysgbd';
const cs = `postgresql://postgres.${REF}:${encodeURIComponent(env.SUPABASE_DB_PASSWORD)}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;
const client = new pg.Client({ connectionString: cs, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
await client.connect();

const uidRow = await client.query('select id from auth.users where email = $1', [email]);
if (uidRow.rows.length === 0) { console.error('user not found'); process.exit(1); }
const uid = uidRow.rows[0].id;

const del = await client.query('delete from orders where user_id = $1', [uid]);
const upd = await client.query(
  `update entitlements set role = 'registered', expires_at = null, updated_at = now()
   where user_id = $1 returning role, expires_at`,
  [uid],
);
console.log(`deleted orders: ${del.rowCount}`);
console.log('entitlements:', JSON.stringify(upd.rows[0] ?? null));
await client.end();
