/**
 * scripts/creem-create-products.mjs
 * 在 Creem 沙盒创建 LUCKMI 全部 7 个 SKU 商品，输出 product_id。
 * 用法：node scripts/creem-create-products.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const API = 'https://test-api.creem.io/v1/products';

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
if (!KEY) { console.error('CREEM_API_KEY missing'); process.exit(1); }

const PRODUCTS = [
  { key: 'CREEM_PRODUCT_QUICK_FIRST',  name: 'Quick Name (First Purchase)', desc: '10 Chinese name candidates with full meaning details — first-time offer', price: 299,  billing_type: 'onetime',   billing_period: 'once' },
  { key: 'CREEM_PRODUCT_QUICK_REPEAT', name: 'Quick Name (Repeat Purchase)', desc: '10 Chinese name candidates with full meaning details', price: 499,  billing_type: 'onetime',   billing_period: 'once' },
  { key: 'CREEM_PRODUCT_BAZI_REPORT',  name: 'BaZi Name Report',             desc: 'Full BaZi chart analysis + 5 detailed name recommendations', price: 4900, billing_type: 'onetime',   billing_period: 'once' },
  { key: 'CREEM_PRODUCT_ANNUAL_REPORT',name: 'Annual BaZi Report',           desc: 'Annual report — luck pillars, monthly forecast, and name matching', price: 16900, billing_type: 'onetime', billing_period: 'once' },
  { key: 'CREEM_PRODUCT_PRO_MONTHLY',  name: 'Pro Monthly',                  desc: 'Unlimited naming, monthly report, and daily fortune', price: 999,  billing_type: 'recurring', billing_period: 'every-month' },
  { key: 'CREEM_PRODUCT_PRO_YEARLY',   name: 'Pro Yearly',                   desc: 'Unlimited naming, all reports, daily push, and hourly fortune', price: 9990, billing_type: 'recurring', billing_period: 'every-year' },
  { key: 'CREEM_PRODUCT_CONSULT_WA',   name: '1-on-1 Consultation (WhatsApp)', desc: '30-minute private BaZi consultation with a master via WhatsApp', price: 9800, billing_type: 'onetime', billing_period: 'once' },
];

// 已有 product_id（脚本重跑时跳过，避免重复创建）
const existingPath = path.join(process.cwd(), 'scripts', 'creem-products.json');
const results = fs.existsSync(existingPath)
  ? JSON.parse(fs.readFileSync(existingPath, 'utf8'))
  : {};

for (const p of PRODUCTS) {
  if (results[p.key]) {
    console.log(`SKIP  ${p.name} (exists: ${results[p.key]})`);
    continue;
  }
  const payload = {
    name: p.name,
    description: p.desc,
    price: p.price,
    currency: 'USD',
    billing_type: p.billing_type,
    tax_category: 'saas',
  };
  // billing_period 仅 recurring 需要；onetime 必须省略
  if (p.billing_type === 'recurring') payload.billing_period = p.billing_period;

  const res = await fetch(API, {
    method: 'POST',
    headers: { 'x-api-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.id) {
    console.error(`FAIL ${p.name}:`, JSON.stringify(data).slice(0, 300));
    process.exitCode = 1;
    continue;
  }
  results[p.key] = data.id;
  console.log(`${p.key}=${data.id}  ($${(p.price / 100).toFixed(2)} ${p.billing_type})`);
}

fs.writeFileSync(
  path.join(process.cwd(), 'scripts', 'creem-products.json'),
  JSON.stringify(results, null, 2),
);
console.log('\nsaved → scripts/creem-products.json');
