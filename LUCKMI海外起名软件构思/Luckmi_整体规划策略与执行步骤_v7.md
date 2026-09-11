# LUCKMI 乐祺名 · 整体规划策略与执行步骤（v7 工程融合版）

> 基于《海外版整体规划 v6 终版》《P0-P2 细化执行策略》《16 周全流程实操策略》《执行级启动包》四份文档优化合并，
> 并校准当前代码库实测状态（**八字排盘引擎已完成，168 测试全绿**）。
> 本文档为唯一执行依据，与 v6 冲突处以本文档为准。

生成时间：2026-09-04 · 内部文档

> **修订 2026-09-11**：支付渠道由 PayPal+聚合改为 **Creem（MoR）**；收费项由 7 SKU 精简为 **4 项**——单次起名 $4.99（首单 $2.99）、Pro Monthly $9.99/月、Annual Report $169、一对一真人咨询 $199（45min）；下线 BaZi Name Report $49 与 Pro Yearly 订阅 $99.9/年（详见 §5.1、§9）。M3 已完成权限裁剪与 Creem 沙盒支付闭环。

---

## 0. 文档融合原则与冲突裁决

| 冲突点 | v6 / 16周文档 | P0-P2 文档 | **本版裁决** |
|---|---|---|---|
| 前端技术栈 | Vue 3 + Vite + Pinia | Coze 生成 + Cloudflare Pages | **Next.js 15 App Router 全栈**（现有代码库，SSR/SSG 天然满足 SEO 策略） |
| 八字计算方式 | Coze AI 工作流排盘 | Coze AI 工作流排盘 | **确定性引擎**（lunar-javascript + 自研模块，168 测试锁定），AI 不参与排盘 |
| 周期估算 | 16 周（从零开始） | 14 天（激进） | **8-11 周**（引擎已完成，省 ~3 周；支付/商店受外部依赖制约） |
| 数据库/认证 | PostgreSQL + Redis 自建 | Supabase | **Supabase**（Auth + Postgres + RLS，免运维，Phase 2 可迁移） |
| PDF 生成 | 服务端 PDF | 服务端 PDF | **v2 再做**：先 HTML 报告 + 打印样式，不引 puppeteer（保持静态部署友好） |
| AI 角色 | AI 生成排盘+解读 | AI 生成排盘+解读 | **LLM 仅做白话转写/双语翻译**；断语一律来自引擎带出处库（合规 + 可审计） |

---

## 1. 现状盘点（本版规划的起点）

### 1.1 已完成 ✅（对应 v6 模块 B「八字」的引擎与 UI 层）

| 层 | 模块 | 文件 | 状态 |
|---|---|---|---|
| 引擎 | 真太阳时+夏令时 | `src/lib/astronomy/solarTime.ts` | ✅ 20 测试 |
| 引擎 | 四柱排盘（干支/藏干/十神/纳音/空亡/地势/自坐/支神） | `src/lib/bazi/paipan.ts` | ✅ 18 测试 |
| 引擎 | 十神（日干轴）+ 简称 + 十神占比 | `src/lib/bazi/shishen.ts` | ✅ |
| 引擎 | 五行打分（基准盘校准锁死）/强弱五档/喜用/调候 | `src/lib/bazi/wuxing.ts` | ✅ |
| 引擎 | 八正格格局（不确定不输出） | `src/lib/bazi/pattern.ts` | ✅ |
| 引擎 | 神煞（干查=年干大+日干小；支查=年支大+日支小） | `src/lib/shensha/{tiangan,dizhi}.ts` | ✅ 30 测试 |
| 引擎 | 干支关系（合冲刑破害） | `src/lib/shensha/guaxiang.ts` | ✅ 36 测试 |
| 引擎 | 大运/流年/流月/流日时间轴 | `src/lib/bazi/{dayun,timeline}.ts` | ✅ 18 测试 |
| UI | 四柱横表/五行五边形图/十神占比图/七柱时间轴 | `src/app/components/*` | ✅ 已按参考图对拍 |
| 质量 | Vitest 测试 | `tests/` | ✅ **168 全绿** |

### 1.2 待开发（按本规划 M1-M9 展开）

起名引擎、i18n 双语、账号/权限/订单、支付（Creem）、报告产品线、SEO 内容、免费工具、真人咨询 SOP、商店上架。

---

## 2. 品牌与定位（继承 v6，冻结）

| 项 | 内容 |
|---|---|
| 品牌名 | **Luckmi（乐祺名）** — 乐(joy) + 祺(《说文》"祺，吉也")；不用衣旁"褀" |
| 副标 | BaZi Names & Fortune Studio（海外锁死） |
| Slogan | Rooted in Chinese metaphysics, powered by BaZi wisdom. |
| 一句话定位 | 海外唯一的「真八字引擎 + AI 起名」一体化双语平台：英文名↔中文名、八字适配、文化解释 |
| 一级市场 | 美国/加拿大/英国/澳洲/新西兰（海外华人 + 华裔二代 + 东方文化爱好者） |
| 二级市场 | 新加坡/香港/马来西亚 → Phase 2 欧洲/日本 |
| 核心差异（护城河） | ① 英文名转中文名（音近+意译+五行适配）② Sibling Matcher ③ 真八字喜用神驱动（非缺啥补啥）④ 中英双语文化解释 ⑤ 每日运势+起名+报告闭环 |

---

## 3. 关键架构决策（ADR）

- **ADR-1 技术栈**：Next.js 15 + React 19 + TypeScript strict。SSG 承载 SEO 内容页（名字详情/生肖/博客），Route Handlers 承载支付 webhook 与 API，`next-intl` 承载双语路由。**不再引入 Vue/Coze 前端线**。
- **ADR-2 命理事实源唯一**：所有干支/十神/神煞/五行/格局断语只能来自 `src/lib/bazi|shensha` 确定性引擎（带古籍出处：《渊海子平》《子平真诠》《穷通宝鉴》《三命通会》）。LLM 仅做双语白话转写，转写结果不入命理事实层。派别参数唯一来源 `config.ts`。
- **ADR-3 权限即字段裁剪**：同一引擎输出 JSON，按角色（guest/registered/single_paid/bazi_report/pro_monthly/pro_yearly/consult_owner）在 API 层裁剪字段后返回，前端不做权限判断逻辑。
- **ADR-4 数据与部署**：Supabase（Auth + Postgres + RLS）；部署 Vercel 或 Cloudflare（Next.js 兼容）；邮件 Resend；分析 GA4 + Sentry。
- **ADR-5 形态演进**：Web → PWA（manifest+SW，Phase 1）→ TWA 上 Google Play → Capacitor 上 App Store → Electron 桌面（最后）。
- **ADR-6 报告先行数据结构**：报告 JSON schema + snapshot 测试先行，渲染层后接；MVP 输出 HTML+JSON 存档。
- **工程硬规则延续**：排盘纯函数、流年/流月/流日走引擎禁手写递推、汉字五行以 Fate gua.data/lunar 藏干为准、颜色/方位/数字仅来自配置、API Key 全部环境变量、每次改动 `npm run test:bazi` 全绿。

---

## 4. 功能架构与完成度（A/B/C/D）

| 模块 | 子功能 | 状态 | 目标里程碑 |
|---|---|---|---|
| **B 八字** | 四柱排盘/十神/五行/喜用/格局/神煞/关系 | ✅ 完成 | — |
| | 大运/流年/流月/流日 | ✅ 完成 | — |
| | **生肖并入排盘**（主卡：五行+Year Pillar 生肖，展开四柱地支动物） | ⏳ 纯 UI | M2 |
| | 流时（仅 Annual Report 权益） | ⏳ 引擎扩展 | M5 |
| **A 起名** | 宝宝取名（姓+性别+生辰→喜用→定字/避讳/辈分→10 候选） | ⏳ 引擎+UI | **M1** |
| | 英文名转中文名（音译+意译双通道+五行回灌） | ⏳ | **M1** |
| | 网名/宠物名（风格开关：古风/赛博/可爱） | ⏳ | M6 |
| | Sibling Name Matcher | ⏳ | M6 |
| | 收藏/分享卡片 | ⏳ | M4 |
| **C 报告/咨询** | Annual Report $169（全量排盘+大运流年+5 名精解+姓名匹配，权益 365 天） | ⏳ | M5 |
| | Monthly Report（Pro 月度会员） | ⏳ | M5 |
| | 每日运势（月会员基础/年报权益增强+推送） | ⏳ | M5/M8 |
| | 一对一真人咨询 $199（WhatsApp，45 分钟） | ⏳ | M7 |
| **D 永久免费** | 四柱简版排盘（游客 3 次/天） | ✅ 引擎就绪 | M3 |
| | 万年历/吉日查询 | ⏳ | M6 |
| | 解梦 Dream Explorer（标 entertainment only） | ⏳ | M6 |



---

## 5. SKU、角色与权限矩阵

### 5.1 SKU 清单（MVP 精简版，4 个收费项；2026-09 起 Creem 收款）

支付渠道为 **Creem（Merchant of Record）**：支持中国大陆个人开发者，支付宝提现，平台代收全球 VAT/GST/销售税并处理合规，无需公司主体。product_id 存于 `.env.local`（`CREEM_PRODUCT_*`）。

| 收费项 | USD | 周期 | 授予角色 | Creem 商品（沙盒 product_id 已建） |
|---|---|---|---|---|
| Single Naming 首单 | 2.99 | one_time | single_paid | `CREEM_PRODUCT_QUICK_FIRST` |
| Single Naming 复购 | 4.99 | one_time | single_paid | `CREEM_PRODUCT_QUICK_REPEAT` |
| Pro Monthly 月度会员 | 9.99 | recurring / month | pro_monthly（30 天） | `CREEM_PRODUCT_PRO_MONTHLY` |
| Annual Report 年度报告 | 169 | one_time（权益 365 天） | pro_yearly | `CREEM_PRODUCT_ANNUAL_REPORT` |
| 1-on-1 Consult 真人咨询 | 199 | one_time | consult_owner | `CREEM_PRODUCT_CONSULT_WA`（45min） |

> 首单判定：订单表部分唯一索引 `(user_id, sku='quick', first_purchase_done=true)`，存在已支付 quick 首单即按复购价 $4.99。
>
> **已下线 SKU（2026-09 调整）**：BaZi Name Report $49（独立单次报告）与 Pro Yearly 订阅 $99.9/年不再售卖。前者的 5 名精解/全量排盘能力并入 Annual Report $169 与月度会员；年度内容统一为一次性 Annual Report。`bazi_report` 角色在权限矩阵中保留仅为历史用户兼容，不再发放新授权。
>
> 订阅取消/续费由 Creem 生命周期 webhook（`subscription.*`）驱动 entitlements 过期；退款 `refund.created` 触发权益回收。

### 5.2 角色 → 字段裁剪矩阵（API 层执行）

| 能力 | guest | registered | single_paid | bazi_report | pro_monthly | pro_yearly | consult_owner |
|---|---|---|---|---|---|---|---|
| 四柱排盘 | 简版（3 次/天，无神煞/大运） | 简版 | 简版 | ✅ 全量 | ✅ 全量 | ✅ 全量 | ✅ |
| 大运/流年/流月/流日 | — | — | — | ✅ | ✅ | ✅ | — |
| 流时 | — | — | — | — | — | ✅ | — |
| 起名 | 3 条截断（无含义详解） | 3 条截断 | ✅ 10 条完整 | ✅ 5 名精解 | ✅ 无限 | ✅ 无限 | — |
| 月报 / 年报 | — | — | — | 年报基础版 | 月报✅ | 月报✅+年报 2 份 | — |
| 每日运势 | — | 打开可见 | — | — | 基础（邮件） | 增强（推送+流时） | — |
| 一对一咨询（$199/45min） | — | 可购买 | 可购买 | 可购买（历史角色） | 9 折 | 优先预约 | ✅ 已含 |

---

## 6. 核心数据结构

### 6.1 候选名 JSON（继承 v6，补工程字段）

```json
{
  "candidate_name": "沐霖",
  "pinyin": "Mù Lín",
  "english_flavor": "Wood Rain",
  "meaning_per_char": { "沐": "to wash, nourish; water element", "霖": "timely rain; blessing" },
  "overall_meaning": "Nourished by timely rain — steady support and growth.",
  "structure": {
    "radical": "沐(氵) 霖(雨)",
    "strokes_kangxi": "沐8 霖16 total24",
    "wuge_summary": "天格10 人格23 地格17 总格33 → 吉（81数理表）",
    "tonal_flow": "4-2 (smooth)",
    "phonetic_note": "no harsh homophone"
  },
  "energy_profile": {
    "five_elements": "Water + Water",
    "supports_day_master": "Yang Wood — Water feeds Wood (favorable)",
    "zodiac_note": "Rabbit year — water names align with wood-energy",
    "balance_comment": "Strengthens favorable Water without overpowering Wood.",
    "xi_yong_source": "engine:wuxing.calcXiYong"
  },
  "cultural_origin": "《诗经·小雅》timely-rain imagery",
  "popularity_warning": "Not in US SSA top 1000 — unique",
  "meta": { "channel": "translit|semantic|hybrid", "score": 87.5, "avoid_list_checked": true }
}
```

规则：`energy_profile` 全部来自引擎输出；`wuge_summary` 仅用既定 81 数理表；不输出无法解释的"废名"。

### 6.2 字元数据库 char-meta（`/api/char-meta` 提供，前端禁引大字库 JSON）

| 字段 | 来源 |
|---|---|
| char / pinyin / tone / radical / strokes_kangxi | Unicode + 康熙笔画表 |
| wuxing（五行归属） | Fate gua.data / lunar 藏干（规则 12，自造需 PR 说明） |
| yima_meaning_zh / _en | 字义库（CC 许可审查） |
| popularity_us | US SSA 数据集 |
| is_rare / taboo_flags | 生僻字表 + 避讳表 |

### 6.3 报告数据结构（M5 先行）

```
reports/{life,year,month}.ts → ReportJSON（分段：chart/ strength/ pattern(带出处)/ xiYong/ dayun/ timeline/ verdicts[{text, source}]）
tests/reports/*.snapshot.test.ts 先行锁定 → 再接 HTML 渲染层
```

---

## 7. 起名引擎设计（M1 核心，本版细化重点）

```
输入 {surname|englishName, gender, birth{y,m,d,h,min}, lon?, lat?, style?}
  │
  ├─① paipan() 确定性引擎 → 喜用神/忌神（wuxing.calcXiYong，禁止 LLM 参与）
  │
  ├─② 候选生成双通道
  │    ├ 音译通道：英文名音节 → 音近汉字簇（声母/韵母/声调相似度 ≥ 阈值）
  │    └ 意译通道：英文名词源/语义 → 字义匹配汉字簇（含《诗经》《楚辞》等典籍意象标签）
  │         + 宝宝名通道：辈分字/定字约束 + 姓氏搭配（字形结构/声调流）
  │
  ├─③ 回灌校验（硬过滤，一票否决）
  │    ├ 五行补缺校验：候选字五行 ∈ {喜用神} ∪ {不忌}，且不加重忌神
  │    ├ 五格/81数理摘要（仅既定表）
  │    ├ 谐音审查：普通话/粤语粗俗谐音黑名单
  │    ├ 避讳审查：长辈名/历史负面人物/品牌商标
  │    ├ 生僻字过滤：Unicode 常用集 + 海外输入法可打性
  │    └ 流行度标注：US SSA / 中文重名率
  │
  ├─④ 评分排序（权重配置化，锁死于 config.ts）
  │    score = 0.35*喜用契合 + 0.20*音律 + 0.15*字义 + 0.10*字形 + 0.10*数理 + 0.10*独特性
  │
  └─⑤ 输出 top N（单次 10 条；Annual Report 交付 5 条精解）候选 JSON（§6.1）
```

测试要求（与既有 168 测试同一门禁）：
- 喜用契合：基准盘（辛金极弱，喜土金）→ 候选名五行含土/金占比 100%，无纯木火水名
- 音译/意译通道各给出确定性输出（固定随机种子）→ snapshot 测试
- 回灌校验反例：构造忌神名/谐音名/生僻字名 → 必须被过滤
- 数理摘要与既定 81 表逐项对照

数据源锁定：Chinese-Names-Corpus（英文名-中文映射 + 姓名语料）；US SSA baby names（公开数据集）。

---

## 8. i18n 与 SEO

### 8.1 双语架构（EN 默认）

- `next-intl` + 路由前缀 `/`（EN）与 `/zh`（简中），M6 加 `/zh-TW`
- 术语对照表锁死（引擎注释层）：Pillars/Four Pillars/Ten Gods/Day Master/True Solar Time/DST/Luck Pillars…
- 全部双层翻译：页面 UI、邮件、报告、PDF、SEO meta、错误提示
- 界面统一 "Luckmi"；中文 "乐祺名"；英文场景解释 "Qi (祺) = auspicious"

### 8.2 SEO 内容矩阵（SSG 生成，一次生产长期受益）

| 页面类型 | 路由 | 数量（M6 起步 → 稳态） | 示例关键词 | CTA |
|---|---|---|---|---|
| 名字详情页 | `/names/[slug]` | 100 → 500+ | "amelia name meaning chinese"、"water element names" | 用八字生成个性化名 |
| 生肖主题页 | `/zodiac/[animal]` | 12 + 年运 60 | "year of rabbit personality" | 测你的八字 → 注册 |
| 博客长文 | `/blog/[slug]` | 5 → 50 | "how bazi naming works" | 试用工具/订阅 |
| 免费工具页 | `/tools/{calendar,auspicious,dream}` | 3 → 10 | "bazi calculator free" | 工具内嵌起名 CTA |

技术：`generateStaticParams` 预渲染 + `hreflang` 双语互链 + Schema.org 结构化数据 + sitemap/robots + GSC/Bing 提交。

### 8.3 合规文案（冻结，全站 footer 双语）

> EN: BaZi, zodiac and dream features are for cultural and entertainment reference only. Not financial, medical or legal advice.
> 中文：八字、生肖及解梦内容仅供传统文化与娱乐参考，不构成投资、医疗或法律建议。

避免词：fortune telling / 改命 / 化解灾祸 / 治病 → BaZi reading / name analysis / cultural energy / enhancement suggestions。
上架类目：App Store「文化娱乐-传统文化 / 工具-日历」，不写"算命"。

---

## 9. 支付与主体（2026-09 修订：Phase 1 改用 Creem MoR）

| 阶段 | 主体 | 渠道 | 触发条件 |
|---|---|---|---|
| Phase 1（M3 沙盒已接入 / M4 切生产） | 国内个人开发者 | **Creem（Merchant of Record）**：支付宝提现、平台代收全球 VAT/GST、内置结账页与订阅管理 | MVP 起 |
| Phase 2（M8） | 香港公司 Luckmi Limited | 保留 Creem + 增接 Stripe HK / PayPal HK 作冗余 | 月流水>$5k、上架前 |
| Phase 3（M8） | 香港公司 | Apple IAP / Play Billing | 商店上架 |

选 Creem 的原因：国内个人即可 KYC（身份证 + 实名支付宝），无外汇/公司主体门槛；MoR 模式由平台承担全球税务申报，最省事。

工程实现：SKU→Creem product_id 单一映射表（§5.1，env `CREEM_PRODUCT_*`，test/live 双环境仅换 API key）；确权双通道——① Creem webhook（`checkout.completed` / `subscription.*` / `refund.created`，HMAC-SHA256 验签）② 支付成功页服务端 verify 主动查询（本地无公网 webhook 时使用）；二者均经幂等的 `markPaidAndGrant` → orders → entitlements → 字段裁剪自动生效。

iOS IAP 策略：单次购买（$4.99/$169/$199）引导 Safari 网页支付（0% 抽成，App 内只展示简版+"Get more on web"）；订阅（Pro Monthly）必须 IAP（定价已含抽成）；真人咨询属服务可站外（WhatsApp/邮件）。

---

## 10. 合规与安全

- 生辰数据加密存储（at rest），不向第三方明文传输；GDPR/CCPA 隐私政策 + 一键注销通道
- 聊天/咨询记录不进业务库，订单只存「咨询完成」布尔位
- 退款政策：AI 报告/数字商品发送后不可退；真人咨询未响应全额退
- Cookie 同意横幅（EU 流量）；GA4 IP 匿名化

---

## 11. 执行步骤（里程碑 M0-M9）

> M0 已完成。每个里程碑验收含：功能验收 + `npm run test:bazi` 全绿 + `npx tsc --noEmit` + 浏览器端到端。

### M0 ✅ 八字引擎与排盘 UI（已完成）
- 引擎 7 模块 + 排盘四图 UI + 168 测试。**较原 16 周计划节省 ~3 周。**

### M1 起名引擎（2-3 周）★当前最优先
- char-meta 数据库 + /api/char-meta（拆包，前端禁引 >2MB 字库）
- 音译表/意译表 + 双通道候选生成 + 回灌校验 + 评分排序（§7）
- 宝宝取名 + 英文名转中文名 两条链路 API + 最小 UI
- 交付/验收：输入基准盘生辰 → 10 候选全部过校验；snapshot 测试锁定；喜用契合率 100%

### M2 i18n + 品牌 UI（1 周）
- next-intl 接入（EN/zh），现有排盘页全部词条化
- LUCKMI 视觉（暖金米色系，manifest theme #1A1426 备选深色）、生肖并入排盘主卡、落地页
- 验收：语言切换无遗漏（脚本扫描硬编码中文）；Lighthouse SEO ≥ 90

### M3 账号/权限/订单（1 周）
- Supabase Auth（邮箱 magic link 优先，海外习惯）+ profiles/orders/entitlements 表 + RLS
- 角色→字段裁剪中间件（§5.2）；游客 3 次/天限流（IP+设备指纹）
- 验收：七种角色 API 集成测试，越权访问返回裁剪字段
- ✅ 已完成（2026-09）：权限字段裁剪（crop 纯函数 + 319 测试）；Creem 沙盒支付闭环——4 个收费项 checkout、webhook 验签 + 成功页 verify 双通道确权、订单→entitlements 幂等发放、定价页中英双语

### M4 支付闭环 Phase 1 + 部署 + PWA（1-1.5 周）
- Creem 完成 KYC（身份证 + 实名支付宝）→ 切 Live API key + live product_id；配置生产 webhook URL
- Vercel/CF 部署 + luckmi.app 域名 + manifest/SW（PWA 可安装）
- 交付验收：**第一笔真实 USD 入账**（关键里程碑）
- 分享卡片（起名结果 OG 图）

### M5 报告产品线（2 周）
- reports/{life,year,month}.ts 数据结构 + snapshot 测试先行 → HTML 渲染（打印样式）
- $169 Annual Report（全量排盘+大运流年+5 名精解+姓名匹配）、Pro Monthly 月报（$9.99 订阅权益）
- 每日运势（网页版+邮件版，Resend 定时）；流时引擎扩展（Annual Report 权益）
- 验收：报告 JSON 与断语出处可溯源（每条 verdict 带 source 字段）

### M6 SEO 矩阵 + 免费工具 + 剩余起名（1-2 周，内容生产持续）
- 名字页/生肖页/博客 SSG + hreflang + Schema + GSC
- 万年历/吉日（引擎复用 lunar-javascript + 择日规则）/解梦（内容库，标 entertainment）
- 网名/宠物名、Sibling Matcher；GA4 漏斗 + 邮件订阅序列

### M7 一对一真人咨询 $199（1 周）
- Creem 咨询 SKU（$199/45min）已上架；订单确认页 + SOP 流程（§v6）+ 师傅 WhatsApp Business 号 + 完成状态标记 + 退款政策文案（未响应全额退）
- 验收：端到端试运行 1 单

### M8 主体升级 + 商店上架（工程 1-2 周，外部依赖并行 4-6 周）
- 港司注册 → 增接 Stripe HK / PayPal HK 作渠道冗余（Creem product_id 映射保留）→ 开发者账号转港司
- TWA（Bubblewrap + Digital Asset Links）上 Google Play；Capacitor + IAP + APNs/FCM 推送上 App Store
- 验收：双商店可下载；订阅双通道（Web Creem / 商店 IAP）权益一致

### M9 增长与运营（持续）
- 推荐返利、联盟计划、TikTok/Reels 选题库、Reddit/Quora 内容
- A/B 框架（落地页/定价/CTA）、运营看板（GMV/转化/留存）、KOL 合作

### 里程碑总览

| 里程碑 | 周期（自 M1 起） | 关键验收 |
|---|---|---|
| M1 起名引擎 | W1-3 | 10 候选过校验 + snapshot 锁定 |
| M2 i18n/UI | W3-4 | 双语零遗漏 |
| M3 账号权限 | W4-5 | 角色裁剪集成测试 |
| M4 支付+PWA | W5-6 | **首笔 USD 入账** |
| M5 报告线 | W7-8 | $169 年度报告可交付、可溯源 |
| M6 SEO+工具 | W8-10 | GSC 收录 50+ |
| M7 真人咨询 | W10 | 端到端 1 单（$199） |
| M8 商店 | W10-14（并行） | 双商店上架 |
| M9 增长 | W12+ | 月营收 $3k 冲刺 |

核心路径：**M1 → M3 沙盒支付已通 → M4（Creem 切 Live 收到首笔钱）→ M5（利润款 $169 年度报告）→ M8（合规进商店）**；M6/M7/M9 可并行穿插。

---

## 12. 风险与应对（合并三文档 + 工程补充）

| 风险 | 等级 | 应对 |
|---|---|---|
| AI 起名质量不稳定 | 高 | 候选全部过确定性校验链（§7③），LLM 仅转写不生成名字本身；用户反馈闭环 |
| 排盘精度争议 | 中 | 已解决：确定性引擎+真太阳时+节气分钟级+168 测试；权威万年历不符=最高优先级 Bug（规则 17） |
| 支付合规/冻结 | 高 | Phase 1 用 Creem MoR（税务合规由平台承担、冻结风险低于自有 PayPal 账号）；M8 增接 Stripe HK/PayPal HK 冗余，不压单一渠道 |
| Apple 审核拒 | 中 | 订阅走 IAP；单次购买引导 Safari 离店支付；被拒 1-2 次预案 |
| 商标近似 | 中 | 组合标 "Luckmi Studio"+律师 TESS 预筛；避裸用 "Luck Name" |
| SEO 起量慢 | 中 | 名字页 SSG 批量生产（一次配置长期产出）+短视频/Reddit 双线 |
| 生辰数据合规 | 高 | 加密存储+不落第三方明文+GDPR/CCPA+注销通道 |
| "封建迷信"认知 | 中 | cultural/entertainment 包装，绝不做确定性命运断言；断语带古籍出处 |
| 大字库拖垮前端 | 中 | char-meta 走 /api/char-meta 分包（规则 2） |

---

## 13. 对原三份文档的优化点索引

1. **排盘从"AI 工作流"改为确定性引擎**——准确、可审计、可测（168 测试），断语可溯源至四部古籍，同时满足合规与专业口碑
2. **技术栈三套并存（Vue/Coze/CF）裁决为 Next.js 单栈**——SSR/SSG 直接支撑 SEO 战略（原方案 SEO 页面生成是痛点）
3. **16 周计划压缩至 8-11 周**——引擎已完成；M4 首单入账从 W3-4 提前能力就绪
4. **权限模型落地为"字段级裁剪"**——原文档只有矩阵概念，本版给出 API 中间件实现路径
5. **报告线"数据结构+snapshot 先行"**——符合既有工程规范，避免渲染层返工
6. **起名引擎补齐校验链细节**——原文档"验证层必做"落为 6 条硬过滤规则 + 评分权重锁 config
7. **LLM 角色降级为转写器**——规避 AI 编造命理断语的法律与口碑风险
