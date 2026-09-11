/**
 * scripts/run-sql-migration.mjs
 * 直连 Supabase Postgres（共享连接池）执行 DDL 迁移。
 * REST API 不支持 DDL，CLI 又要往 C 盘写配置目录，所以用 pg 直连。
 *
 * 密码来源：.env.local 的 SUPABASE_DB_PASSWORD（gitignore 已排除，不入库不入码）。
 * 地址候选：新加坡区共享池 aws-1/aws-0 × 端口 6543(transaction)/5432(session)。
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
    console.error('FAIL: .env.local 缺少 SUPABASE_DB_PASSWORD（Dashboard → Connect 按钮里可查连接串/密码）');
    return 1;
  }

  const sql = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/0001_init.sql'), 'utf8');
  const hosts = [`aws-1-${REGION}`, `aws-0-${REGION}`];
  const ports = [6543, 5432];

  for (const host of hosts) {
    for (const port of ports) {
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
        const { rows: tables } = await client.query(
          "select tablename from pg_tables where schemaname='public' order by tablename"
        );
        const { rows: policies } = await client.query(
          "select tablename, policyname from pg_policies where schemaname='public' order by tablename, policyname"
        );
        const { rows: trg } = await client.query(
          "select trigger_name from information_schema.triggers where trigger_schema='auth' and event_object_table='users' and trigger_name='on_auth_user_created'"
        );
        console.log('public tables:', tables.map(r => r.tablename).join(', '));
        console.log('policies:', policies.map(r => `${r.tablename}.${r.policyname}`).join(', '));
        console.log('auth.users trigger on_auth_user_created:', trg.length ? 'OK' : 'MISSING');
        await client.end();
        console.log('MIGRATION SUCCESS');
        return 0;
      } catch (e) {
        try { await client.end(); } catch { /* ignore */ }
        const msg = e.message ?? String(e);
        // 密码错就别再试其他地址了，直接退出
        if (/password authentication failed|Authentication failed/i.test(msg)) {
          console.error('FAIL(密码错误):', msg);
          return 1;
        }
        console.error(`skip ${host}:${port} →`, msg);
      }
    }
  }
  console.error('ALL CANDIDATES FAILED');
  return 1;
}

main().then(code => { if (code) throw new Error(`exit ${code}`); }).catch(e => {
  console.error(e.message ?? e);
});
