/**
 * scripts/set-test-role.mjs（验证用，可随时删）
 * 直连 pg 把测试用户的 entitlements.role 改为指定角色（E2E 权限裁剪验证）。
 * 用法：node scripts/set-test-role.mjs <email> <role>
 */
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const [email, role] = process.argv.slice(2);
if (!email || !role) {
  console.error('usage: node scripts/set-test-role.mjs <email> <role>');
  process.exit(1);
}

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
const { rows } = await client.query(
  `update entitlements set role = $2, updated_at = now()
   where user_id = (select id from auth.users where email = $1)
   returning user_id, role, expires_at`,
  [email, role],
);
console.log(rows.length ? JSON.stringify(rows[0]) : 'NO ENTITLEMENT ROW (user missing?)');
await client.end();
