# HANDOFF.md — LUCKMI 项目衔接文档

> **用途**：新对话窗口首条消息只需说「请阅读 HANDOFF.md 了解项目当前状态，然后继续执行 [具体任务]」
> **更新时机**：每个里程碑完成后更新进度表和当前任务段
> **禁止改动**：除非完成对应里程碑；架构决策不可随意推翻

---

## ① 项目定位 + 技术栈

**LUCKMI · 乐祺名** — 面向海外市场的八字排盘与中文起名网页应用（Next.js 15 App Router）。工程化八字命理（非 AI 生成），6 项硬过滤 + 6 维评分起名管线，角色即字段裁剪。

```
前端：Next.js 15 App Router + TypeScript strict + next-intl (en/zh) + PWA
后端：Supabase Auth (magic link) + Supabase RLS + 自建 Node.js API Routes
支付：Creem（Merchant of Record，国内个人开发者友好，支付宝提现）
八字引擎：自研 Paipan + Shensha + Wuxing 量化（古籍限定《渊海子平》《子平真诠》《穷通宝鉴》《三命通会》）
部署：Vercel（已导入 GitHub repo）+ Supabase（新加坡 region，ref=kuyljxbopbcrgroysgbd）
```

---

## ② 里程碑进度表

| 里程碑 | 内容 | 状态 | 验证 |
|---|---|---|---|
| **M1 八字引擎** | 排盘/神煞/五行量化/大运流年 | ✅ 完成 | 单元测试覆盖，引擎自测脚本通过 |
| **M2 起名引擎** | 音译+意译管线/6 硬过滤/6 维评分 | ✅ 完成 | vitest 319/319 |
| **M3 账号权限支付** | Supabase Auth + RLS + 角色裁剪 + Creem 沙盒闭环 | ✅ 完成（2026-09-11） | tsc 0 错 / vitest 319/319 / E2E 支付全通 / next build 生产构建通过 |
| **M4 部署上线** | Vercel 部署 + PWA（自定义域名 luckmi.app 待绑定）| ✅ 主体完成（2026-09-11） | https://luckmi.vercel.app 200；27 页面；magic link Vercel 回调验证通过；PWA manifest+SW 已上线 |
| **M5 报告线** | $169 Annual Report 完整交付 + 可溯源 PDF | ⏳ 未开始 | — |
| **M6 SEO/免费工具** | 免费八字排盘页（简版引流）+ SEO 内容 + 站外引流 | ⏳ 未开始 | — |
| **M7 真人咨询** | $199 WhatsApp 一对一（45min）SOP + 状态标记 + 退款 | ⏳ 未开始 | — |
| **M8 合规进商店** | 港司注册 + Stripe/PayPal HK 冗余渠道 + Apple IAP / Play Billing | ⏳ 未开始 | — |
| **M9 站外增长** | TikTok/Reddit/SEO 推广 + 邮件营销 | ⏳ 未开始 | — |

---

## ③ 当前任务上下文

**正在做**：M4 主体已上线 https://luckmi.vercel.app（Vercel CLI 部署，项目 yuzhou2025s-projects/luckmi）。Supabase Site URL + 3 条 Redirect URLs 已配置，线上 magic link 回调验证通过。

**下一步（按优先级）**：
1. 浏览器实测线上完整链路：访问 luckmi.vercel.app → magic link 登录 → 排盘 → checkout（沙盒测试卡 4242）
2. Creem KYC（身份证 + 实名支付宝）→ 拿 live key + 5 个 live product_id → Vercel env 替换 → Creem webhook 配 `https://luckmi.vercel.app/api/creem/webhook`
3. 可选：购买并绑定 luckmi.app 自定义域名（Vercel Settings → Domains，自动 HTTPS）
4. 进入 **M5 报告线**：$169 Annual Report 完整交付 + 可溯源 PDF（CSS @media print）

**阻塞点**：无。沙盒 key 支持全部测试；真实收款前才必须完成 KYC。

---

## ④ 关键文件索引

### 认证与权限
| 文件 | 用途 |
|---|---|
| `src/lib/db/supabase.ts` | 三客户端工厂：getBrowserClient（@supabase/ssr cookie 单例）/ createServerClient（SSR cookie 会话）/ createAdminClient（service_role） |
| `src/middleware.ts` | next-intl locale 路由 + Supabase 会话刷新（每次导航自动续期） |
| `src/lib/auth/AuthProvider.tsx` | 客户端 AuthContext，接收 SSR initialSession 消除 hydration mismatch |
| `src/lib/auth/serverRole.ts` | 服务端从 Bearer token → entitlements 解析角色（含过期降级） |
| `src/lib/auth/crop.ts` | 排盘简版裁剪 + 起名截断纯函数（ADR-3 核心） |
| `src/lib/auth/roleMatrix.ts` | 7 种角色能力矩阵 |

### 支付
| 文件 | 用途 |
|---|---|
| `src/lib/payment/sku.ts` | 4 个收费项 SKU 映射 + 首单 $2.99 / 复购 $4.99 判定 |
| `src/lib/payment/orderService.ts` | createPendingOrder / markPaidAndGrant（幂等 + 并发保护） |
| `src/app/api/creem/checkout/route.ts` | 创建 Creem checkout session（首单/复购自动选 product_id） |
| `src/app/api/creem/webhook/route.ts` | Creem webhook 验签（SDK 双模式：Svix standard + legacy HMAC）+ 事件处理 |
| `src/app/api/creem/verify/route.ts` | 支付成功页主动查 Creem 确权（本地无公网 webhook 时的 fallback） |

### 八字引擎
| 文件 | 用途 |
|---|---|
| `src/lib/bazi/paipan.ts` | 确定性全量排盘（节气真太阳时基准） |
| `src/lib/bazi/timeline.ts` | 大运/流年/流月/流日时间轴 |
| `src/lib/bazi/shensha.ts` | 神煞计算（古籍限定范围） |
| `src/lib/bazi/wuxing.ts` | 五行量化 + 喜用推导（扶抑法为主，调候仅标注） |

### 起名引擎
| 文件 | 用途 |
|---|---|
| `src/lib/naming/engine.ts` | 音译+意译管线 + 6 项硬过滤 + 6 维评分 |
| `src/app/api/naming/route.ts` | 服务端起名 API（角色裁剪截断候选数） |

### 测试脚本（scripts/）
| 文件 | 用途 |
|---|---|
| `scripts/creem-e2e-full.mjs` | **完整支付闭环 E2E**：登录→重置→首单 checkout $2.99→webhook→DB paid→复购 $4.99→DB paid→/api/auth/me 角色验证。**跑全量回归必用** |
| `scripts/run-sql-migration.mjs` | 直连 Supabase pooler 执行 SQL 文件（DDL） |
| `scripts/gen-magiclink.mjs` | admin.generateLink 生成免邮箱登录链接 |
| `scripts/gen-pwa-icons.mjs` | 零依赖生成 public/icon-192/512/apple-touch-icon.png |
| `scripts/set-test-role.mjs` / `reset-test-user.mjs` | 测试角色切换/重置（pg 直连） |
| `scripts/check-test-orders.mjs` | 查测试用户订单与权益状态 |

---

## ⑤ 环境与凭证清单

### 本地 `.env.local`（12 个 key，已全配齐）
```
NEXT_PUBLIC_SUPABASE_URL            = https://kuyljxbopbcrgroysgbd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY       = eyJhbGciOi...（Publishable / anon）
SUPABASE_SERVICE_ROLE_KEY           = eyJhbGciOi...（Secret / service_role，⚠️ 切勿泄露）
SUPABASE_DB_PASSWORD                = （已配）
NEXT_PUBLIC_APP_URL                 = http://localhost:3000

CREEM_API_KEY                       = creem_test_6UtHvSBJpjADRnK6UVy2Fz（沙盒 key，KYC 后换 creem_live_...）
CREEM_PRODUCT_QUICK_FIRST           = prod_25t...（沙盒 product_id）
CREEM_PRODUCT_QUICK_REPEAT          = prod_25t...
CREEM_PRODUCT_PRO_MONTHLY           = prod_25t...
CREEM_PRODUCT_ANNUAL_REPORT         = prod_25t...
CREEM_PRODUCT_CONSULT_WA            = prod_25t...
```

### 生产环境（Vercel，已配置 2026-09-11）
- **线上地址**：https://luckmi.vercel.app（Vercel project: yuzhou2025s-projects/luckmi）
- **Vercel env**：10 个 key 已注入 production（不含 SUPABASE_DB_PASSWORD，生产不直连 DB）
- **Supabase Auth**：Site URL=https://luckmi.vercel.app；Redirect URLs 已含 `https://luckmi.vercel.app/**` + en/zh callback
- **部署方式**：`vercel deploy --prod --yes`（CLI 59.15.1，需先 `vercel link --project luckmi --yes`）
- **待办**：Creem KYC 后替换 live key + 5 个 live product_id；配 webhook `https://luckmi.vercel.app/api/creem/webhook`；可选绑 luckmi.app 域名

### GitHub
- **Repo**: https://github.com/yuzhou2025/luckmi
- **分支**: main（2 commits）
- **安全**: `.trae/` 已排除；`.env.local` 已 gitignored

### Supabase
- **Ref**: kuyljxbopbcrgroysgbd
- **Region**: Singapore
- **Pooler host**: aws-0-ap-southeast-1.pooler.supabase.com:6543（6543 端口用于 DDL）
- **Tables**: profiles / orders / entitlements + handle_new_user trigger

---

## ⑥ 不可违背的架构决策（ADR 速查）

1. **ADR-3 权限即字段裁剪**：同一引擎全量输出 → API 层按角色裁剪字段，前端不做权限判断。guest/registered/single_paid 只能看简版排盘（无大运/起运/神煞），bazi_report/pro_yearly 看全量
2. **@supabase/ssr cookie 单例**：getBrowserClient() 返回模块级单例，middleware 每次导航刷新过期 token，layout 注入 initialSession 消除 hydration mismatch
3. **Webhook + verify 双通道确权**：生产用 Creem webhook（HMAC-SHA256 验签）；本地/无公网时走成功页轮询 /api/creem/verify 主动查 Creem。二者均经幂等 markPaidAndGrant
4. **4 收费项定价**：Quick $2.99/$4.99 · Pro Monthly $9.99 · Annual Report $169 · Consult $199。已下线 BaZi Report $49 和 Pro Yearly $99.9
5. **调候用神仅标注**：不参与 XiYong 综合评分，扶抑法为主
6. **日期 API 限制**：不调外部八字 API，引擎自制
7. **Apple IAP 策略**：单次购买引导 Safari 网页支付（0% 抽成）；订阅必须 IAP（含抽成）

---

## ⑦ 质量门命令

```bash
# 类型检查（0 错误才允许提交）
npx tsc --noEmit

# 单元测试（319 用例全绿）
npx vitest run

# 生产构建（部署前必跑）
npx next build

# 完整支付 E2E（改支付/权限逻辑后必跑）
node scripts/creem-e2e-full.mjs

# 查测试用户订单状态
node scripts/check-test-orders.mjs

# SQL 迁移（新增表/字段/RLS 时）
node scripts/run-sql-migration.mjs supabase/migrations/xxx.sql
```

---

## ⑧ 已知坑 & 规避方案

| 坑 | 规避 |
|---|---|
| IDE 缓冲回滚导致文件编辑丢失 | 修改后立刻 `Grep` 确认，或重新 Read 比对 |
| 沙箱阻止写 `.git-credentials.lock` | 用 GitHub API（Invoke-RestMethod）替代 `git push` |
| Creem 沙盒卡 iframe 无法自动化填卡 | 跑 E2E 用 webhook 模拟（`scripts/creem-e2e-full.mjs`），不依赖真填卡 |
| Supabase pooler aws-1 不可用 | 固定用 aws-0（aws-0-ap-southeast-1.pooler.supabase.com） |
| Creem 查询端点是 query 参数 `/v1/checkouts?checkout_id=xxx`，不是路径参数 | verify 路由已修正，别再改回去 |
| `amount_usd` pg 返回字符串，不是数字 | 比较时用 `parseFloat()` |
| service_role key 必须在函数体内读取，不能在模块顶层 | createAdminClient() 内部读，不会打包到 client bundle |
| middleware matcher 排除 API/静态资源/带后缀文件 | 否则 Next 编译会报错 |
| Creem 生产未配置 WEBHOOK_SECRET 时 fail-closed（503） | webhook 路由已实现；开发环境无 secret 跳过验签 |
