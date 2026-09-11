/**
 * scripts/gen-magiclink.mjs（验证用，可随时删）
 * 用 admin API 给测试用户生成 magic link，打印 action_link 供浏览器打开。
 * 免去收邮件环节即可完成登录闭环 E2E。
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

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const email = process.argv[2] ?? 'luckmi_test_20260910@proton.me';
const { data, error } = await admin.auth.admin.generateLink({
  type: 'magiclink',
  email,
  options: { redirectTo: 'http://localhost:3000/auth/callback' },
});
if (error) { console.error('FAIL:', error.message); process.exit(1); }
console.log(data.properties.action_link);
