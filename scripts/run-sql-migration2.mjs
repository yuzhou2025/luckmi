/**
 * scripts/run-sql-migration2.mjs
 * 临时脚本：执行 0002_add_creem_provider.sql
 * 用法：node scripts/run-sql-migration2.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const REF = 'kuyljxbopbcrgroysgbd';
const REGION = 'ap-southeast-1';

function loadEnvLocal() {
  const file = path.join(process.cwd(), '.env.local');
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const i = t.indexOf('=');
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

async function main() {
  const env = loadEnvLocal();
  const password = env.SUPABASE_DB_PASSWORD;
  if (!password) {
    console.error('FAIL: .env.local 缺少 SUPABASE_DB_PASSWORD');
    return 1;
  }

  const sql = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/0002_add_creem_provider.sql'), 'utf8');
  const host = `aws-0-${REGION}`;
  const port = 6543;
  const cs = `postgresql://postgres.${REF}:${encodeURIComponent(password)}@${host}.pooler.supabase.com:${port}/postgres`;
  const client = new pg.Client({
    connectionString: cs,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });
  try {
    await client.connect();
    console.log(`connected: ${host}:${port}`);
    await client.query(sql);
    const { rows } = await client.query(
      "select constraint_name, check_clause from information_schema.check_constraints where constraint_name = 'orders_payment_provider_check'"
    );
    console.log('constraint:', rows[0]?.constraint_name);
    console.log('check_clause:', rows[0]?.check_clause);
    await client.end();
    console.log('MIGRATION SUCCESS');
    return 0;
  } catch (e) {
    try { await client.end(); } catch { /* ignore */ }
    console.error('FAIL:', e.message);
    return 1;
  }
}

main().then(code => { if (code) throw new Error(`exit ${code}`); }).catch(e => {
  console.error(e.message ?? e);
});
