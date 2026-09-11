/**
 * scripts/creem-prune-products.mjs
 * 精简收费项：归档 bazi_report / pro_yearly；consult_wa 改价 $199。
 * 用法：node scripts/creem-prune-products.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://test-api.creem.io/v1/products';

function loadEnv() {
  const out = {};
  for (const line of fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const i = t.indexOf('=');
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

const env = loadEnv();
const KEY = env.CREEM_API_KEY;
const H = { 'x-api-key': KEY, 'Content-Type': 'application/json' };

// 归档（DELETE 为软删除，历史订单保留）
for (const key of ['CREEM_PRODUCT_BAZI_REPORT', 'CREEM_PRODUCT_PRO_YEARLY']) {
  const id = env[key];
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE', headers: H });
  console.log(`ARCHIVE ${key} (${id}): ${res.status}`);
}

// 咨询改价 98 → 199（PATCH price，Creem 会生成新默认价格）
const consultId = env.CREEM_PRODUCT_CONSULT_WA;
const patch = await fetch(`${BASE}/${consultId}`, {
  method: 'PATCH',
  headers: H,
  body: JSON.stringify({ name: '1-on-1 Master Consultation (WhatsApp)', description: '45-minute private BaZi and naming consultation with a master via WhatsApp', price: 19900 }),
});
const data = await patch.json();
console.log(`PATCH consult: ${patch.status} → price=${data.price}, status=${data.status}`);
