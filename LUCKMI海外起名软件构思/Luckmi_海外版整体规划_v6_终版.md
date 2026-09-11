### **LUCKMI**

### **乐 祺 名**

### **BaZi Names & Fortune Studio**

Rooted in Chinese metaphysics, powered by BaZi wisdom.

海外版整体规划 · 架构冻结版 v6

Word 终版（交付/排期用）

### 目录

## 1. 品牌与定位

## 2. SKU 与收费体系（USD）

## 3. 功能架构（A / B / C / D）

## 4. 候选名数据结构

## 5. WhatsApp 复核 SOP

## 6. 主体与收款方案

## 7. 合规与文案（海外）

## 8. 技术路径：COZE → PWA → TWA → Capacitor

## 9. 竞品锚定（定价依据）

## 10. 实操落地路线图（10 阶段）

## 11. 风险与应对

## 附录 A · 执行级启动包（COZE Prompt / manifest.json / 支付配置表）

## 1. 品牌与定位

| 项 | 内容 |
| --- | --- |
| 品牌名 | Luckmi（乐祺名） |
| 副标 | BaZi Names & Fortune Studio |
| Slogan | Rooted in Chinese metaphysics, powered by BaZi wisdom. |
| 品类关键词 | BaZi / Four Pillars / Five Elements / Chinese Zodiac / Name Analysis |
| 市场 | 海外（美国、加拿大、澳大利亚为主，兼东南亚华人） |
| 语言 | 中英双语（EN 默认，中文可切换） |
| 形态 | Web → PWA → TWA（Google Play）→ Capacitor（App Store）→ Electron（桌面） |

### **定位句：**

Luckmi is an AI name generator with a real BaZi (Four-Pillars) engine — for overseas Chinese families and Western parents drawn to Eastern naming energy.

### **命名资产确认：**

乐祺名 = 乐（joy）+ 祺（礻示旁 = 吉祥、福气，《说文》"祺，吉也"）✅ 不用衣旁的"褀"

Luckmi = Luck + mi（"名 / 命"谐音，暗扣"祺" Qi 音）

中文文案统一用"乐祺名"，海外副标题统一锁死 BaZi Names & Fortune Studio

## 2. SKU 与收费体系（USD · 海外定价）

**定价原则：海外价 = 国内价 × 5~10 倍；高频低客单按竞品锚定（Legacy Name $4.99–9.99），低频高客单按 10 倍（年报、真人复核对标新加坡 S$230 人工服务）。**

## 2.1 SKU 清单

| 分类 | SKU | 价格 | 对标 / 说明 |
| --- | --- | --- | --- |
| 免费 | 游客 | $0 | 简版测评 3 次/天 |
| 免费 | 注册用户 | $0 | 收藏、历史、万年历、吉日、解梦 |
| 单次类 | Quick Name 首单 | $2.99 | 引流价，每账号一生一次 |
| 单次类 | Quick Name 复购 | $4.99 | 10 条 + 简版含义 + 五行标签（Legacy Name 档锚定） |
| 单次类 | BaZi Name Report | $49 | 八字 + 喜用神 + 5 个精选名，每名含 含义/结构/能量（对标 S$230 人工 AI 版） |
| 单次类 | Annual Report | $169 | 完整八字 + 姓名匹配 PDF |
| 单次类 | BaZi Name Report + 真人复核 | $98 | = $49 报告 + $49 复核，WhatsApp 文字+语音 30 分钟 |
| 会员类 | Pro Monthly | $9.99/mo（首月 $4.95） | 无限起名 + 月报 + 每日运势（基础版） |
| 会员类 | Pro Yearly | $99.9/yr | 无限 + 2 份年报 + 每日运势增强版 + 优先 AI |

## 2.2 权益归属规则

归入会员（不单卖，减少类目）：月度报告 / 年度报告（年会员含 2 份）/ 运势提升 / 好运建议 / 每日运势提醒

单买互斥：月报不单独售卖（防与会员撞车）；Annual Report $169 仅面向非会员单买

Quick Name 首单 $2.99 vs 复购 $4.99：订单表记录 first_purchase_done 标志位

## 2.3 权限矩阵（角色 → 能力）

| 角色 | 起名 | 测评全解 | 八字排盘 | 月报 | 年报 | 每日运势 | 复核 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| guest | 简版3条 | 基础 | — | 简版(App内) | — |  |  |
| registered | 简版 | 全解 | 简版 | — | 简版 | — |  |
| single_paid | 完整10条 | 全解 | 简版 | — | 基础 | — |  |
| bazi_report | — | 全解 | 5名精解 | — | 基础 | — |  |
| pro_monthly | 无限 | 全解 | ✅ | — | 基础版 | — |  |
| pro_yearly | 无限 | 全解 | ✅ | 2份 | 增强版 | — |  |
| consult_owner | — | ✅ 30min |  |  |  |  |  |

## 3. 功能架构（A / B / C / D）

### A. 起名（Naming）

宝宝取名：姓+性别+生辰 → 八字排盘 → 五行喜用神 → 定字/避讳/辈分字 → 10 条候选（含义、文化解释、五行、谐音、流行度）

网名 / 宠物名：主人姓名 + 宠物领养日/网名起用日 + 风格开关（古风/赛博/可爱）→ 批量生成

英文名转中文名：音近 + 意译 + 五行适配（高价值小众需求，竞品空白）

Sibling Name Matcher：已有孩子名 → 推荐风格/音节协调名

Favorites & Share：收藏、生成卡片、分享朋友圈 / 自媒体

### B. 八字（BaZi）

四柱排盘、日主、五行百分比、喜用神 / 忌神

生肖并入八字排盘 —— 主卡显示 五行是什么 + 生肖属什么（Year Pillar），展开四柱显示各地支动物

大运、流年 / 流月 / 流日（流时仅年会员）

### C. 报告 / 咨询（Reports & Consulting）

Monthly Report（Pro 会员）

Annual Report（单买 $169 / 年会员含 2 份）

Luck Enhancement Tips（运势提升 / 好运建议）

1-on-1 Consult（WhatsApp，$98 = $49 报告 + $49 复核）

### D. 永久免费（引流，不上支付）

万年历、吉日查询、解梦（Dream Explorer，标 "For entertainment & cultural reference only"）

不做：三才五格独立模块、占卜（Divination）独立模块

## 4. 候选名数据结构

每名候选返回完整 JSON，前端按语言渲染。对标新加坡人工 S$230 服务（含义 / 字形结构 / 五行能量效益）。

  - {
  "candidate_name": "沐霖",
  "pinyin": "Mu Lin",
  "english_flavor": "Wood Rain",
  "meaning_per_char": { "沐": "to wash, nourish; water element",
                        "霖": "timely rain; water element; blessing" },
  "overall_meaning": "Nourished by timely rain — steady support and growth.",
  "structure": { "radical": "沐(氵) 霖(雨)",
                 "strokes_kangxi": "沐8 霖16 total24",
                 "tonal_flow": "4-2 (smooth)",
                 "phonetic_note": "no harsh homophone" },
  "energy_profile": { "five_elements": "Water + Water",
                      "supports_day_master": "Yang Wood — Water feeds Wood (favorable)",
                      "zodiac_note": "Rabbit year — water names align with wood-energy",
                      "balance_comment": "Strengthens favorable Water without overpowering Wood." },
  "cultural_origin": "《诗经·小雅》timely-rain imagery",
  "popularity_warning": "Not in US SSA top 1000 — unique"
}

英文界面三栏：Meaning / Structure / Energy Benefit；中文界面同上 + 术语原文。

## 5. WhatsApp 复核 SOP（$98 包）

  - 1. 用户付款 $98 → 系统自动发送 AI 报告 PDF 到邮箱
2. 订单确认页 + 邮件提示：「7 天内通过 WhatsApp 联系师傅复核」
3. 用户加师傅 WhatsApp，备注订单号
4. 师傅：文字确认 → 语音问候 → 对 5 名逐一语音解释 → 用户提问 → 文字总结推荐
5. 系统内标记「复核完成」→ 订单关闭

### **合规：**

初期用师傅 Business 号；量上来接 WhatsApp Business API（Twilio / 360Dialog）

明确服务时段（如 Mon–Fri 9AM–6PM SGT）+ 时区

隐私：聊天记录不进 COZE 库，订单表只存「是否完成复核」

退款：AI 报告一旦发送不可退；WhatsApp 复核若师傅未响应可全额退

## 6. 主体与收款方案

### **方案：先国内主体 + PayPal / 第三方过渡，同时注册香港公司。**

## 6.1 阶段路径

| 阶段 | 主体 | 收款方式 | 适用 |
| --- | --- | --- | --- |
| Phase 1（现在） | 国内主体（个体户/有限公司） | PayPal + 国内第三方聚合（PingPong/连连/Asiabill） | MVP 起步、< $5k/月 |
| Phase 2（上量前） | 注册香港公司（Limited） | Stripe HK + PayPal HK + 对公账户 | 月流水 > $5k、准备上架 |
| Phase 3（商店） | 香港公司 | Apple IAP / Google Play Billing / Stripe | 上 App Store & Google Play |

## 6.2 关键合规提醒

不要国内主体直连 Stripe（内地企业无法开通港/美账户），用聚合平台过渡

PayPal 是过渡而非长期（~4.4%+$0.3、冻结风险），仅用于 Phase 1 验证

港司名称：Luckmi Limited；配套香港对公银行账户；利得税 16.5%，离岸收入可主张离岸豁免

商标：香港 IPD + 美国 USPTO 双报；第 9 类（APP）+ 第 41 类（起名咨询），组合标 Luckmi Studio

域名/手柄：luckmi.app / luckmi.names / luckmi.hk / @luckmi.studio 尽早占位

## 6.3 收款渠道对比

| 渠道 | 手续费 | 开户门槛 | 适用阶段 |
| --- | --- | --- | --- |
| PayPal | ~4.4% + $0.3 | 低 | Phase 1 过渡 |
| 国内聚合（PingPong/连连等） | 1%–2.5% + 年费 | 中 | Phase 1 收 USD |
| Stripe HK（港司） | 2.9% + $0.3 | 需港司+港户 | Phase 2 主力 |
| Apple IAP | 15%–30% | 港司 Apple 开发者 $99/年 | iOS 内购 |
| Google Play Billing | 9%–20% | 港司 Play 开发者 $25 | Android 内购 |

## 7. 合规与文案（海外）

### **Footer 固定声明（中英双语）：**

EN: BaZi, zodiac and dream features are for cultural and entertainment reference only. Not financial, medical or legal advice.

中文：八字、生肖及解梦内容仅供传统文化与娱乐参考，不构成投资、医疗或法律建议。

### **避免词：**

fortune telling / 改命 / 化解灾祸 / 治病 → 改用 BaZi reading / name analysis / cultural energy / enhancement suggestions

生辰加密存储，不向第三方明文传输，GDPR / CCPA 隐私政策 + 注销通道

上架类目：App Store 走「文化娱乐-传统文化 / 工具-日历」，不写"算命"

## 8. 技术路径：COZE → PWA → TWA → Capacitor

| 阶段 | 形态 | 能否收款 | 收银方式 |
| --- | --- | --- | --- |
| COZE 网页版 | 扣子编程 + 自有域名 | ✅ | 导出代码 + Cloudflare Worker + Stripe Checkout（Phase 2 港司 Stripe HK）；Phase 1 用 PayPal/聚合 |
| PWA | manifest + SW + 主屏安装 | ✅ 最自由 | Stripe（2.9%+$0.3），无商店抽成 |
| TWA（Google Play） | 全屏 Chrome 套壳 | ✅ | 美国区可 Stripe；稳妥做法跳外部浏览器 Stripe，或接 Play Billing |
| Capacitor（App Store） | iOS 原生壳 + 推送 | ✅ 最严 | 美国店可跳 Safari Stripe（声明离店）；其他店 / 稳妥走 Apple IAP（15–30%） |

### **⚠️ iOS 禁止在 WebView 内裸弹 Stripe 卡面收数字商品 → 必须跳系统浏览器。**

每日运势推送（会员权益）：Capacitor @capacitor/push-notifications（FCM + APNs），每日 06:00 用户本地时间；月会员基础版、年会员增强版（含流时 + 周摘要）。

## 9. 竞品锚定（定价依据）

| 竞品 | 模式 / 价格 | 启示 |
| --- | --- | --- |
| FateTell | 命之书 $39.99 / 运之书 $19.99 / 年订 $59.99，客单 $60+，复购 ~40% | 纯命理不起名 → Luckmi "八字+起名一体"是空位 |
| Legacy Name | Free / Noble $4.99（5名）/ Imperial $9.99（10名+全解） | Quick Name 复购 $4.99 锚定此档 |
| BabyNameAi（好名宝） | 三层引擎：八字 + AI + 验证（谐音/流行度/生僻字） | 验证层必做 |
| myfate.ai | 免费排盘 + fortune points | 点数制海外接受度低，美元直标更优 |
| 新加坡人工起名 | S$230（≈US$181）= 完整八字 + 5名 + 含义/结构/能量 | BaZi Name Report $49 = 人工价 25–30% 的 AI 版，利润款 |

### 10. 实操落地路线图（10 阶段）

| 阶段 | 内容 | 工期 | 验收 |
| --- | --- | --- | --- |
| P0 | 立项+资产占位：Luckmi Limited 注册启动、域名、商标预筛、开发者账号、PayPal/聚合开户、COZE 项目 | 1–2 周 | luckmi.app 在手、商标检索完成 |
| P1 | MVP 起名引擎+免费层：排盘算法、10 条候选、i18n、PWA、manifest+SW | 2–4 周 | 可访问、可加主屏、简版能跑 |
| P2 | 付费闭环（Phase 1）：PayPal/聚合接入、Quick Name $2.99/$4.99、权限工作流、订单表 | 4–6 周 | 第一笔 USD 入账 |
| P3 | 八字深度+报告：BaZi Name Report $49（5名全结构）、Annual $169、月报、每日推送、PDF | 6–8 周 | $49 报告可交付 |
| P4 | WhatsApp 复核 $98：SOP、订单确认页、师傅号、退款政策、完成状态 | 8–9 周 | 端到端跑通 |
| P5 | 剩余起名功能：英文名转中文、Sibling Matcher、分享卡片、解梦 | 9–11 周 | 全功能闭环 |
| P6 | 注册香港公司 + 切换 Stripe HK：港司下证、港户、Stripe 激活、主体变更、开发者改港司 | 11–13 周 | Stripe HK 收款、主体合规 |
| P7 | Google Play 上架（TWA / Bubblewrap / Digital Asset Links） | 13–15 周 | Play 可下载 |
| P8 | App Store 上架（Capacitor 原生壳 + 推送 + IAP） | 15–18 周 | App Store 可下载 |
| P9 | Electron 桌面端（可与 P7/P8 并行） | 18–20 周 | 桌面启动可用 |
| P10 | 增长+合规复盘（第 6 个月起）：SEO/社媒、CPI 测试、税务、商标补正 | 持续 | 月流水稳定 |

**关键路径：P0(资产+主体) → P1(免费MVP) → P2(收第一笔) → P3($49利润款) → P6(港司+Stripe合规) → P7/P8(进商店)**

### 11. 风险与应对

| 风险 | 应对 |
| --- | --- |
| 港司注册周期拖慢 P2 收款 | Phase 1 用国内主体 + PayPal/聚合先收，港司并行办理，不阻塞 MVP |
| Apple 审核拒 Stripe 内购 | 跳外部浏览器 + 声明"Manage Subscription"离店链接 |
| 商标近似（Luckmi / Luck / Lucky Name） | 组合标 Luckmi Studio + 图形 + 律师 TESS 预筛；避裸用 "Luck Name" |
| 海外用户读不懂"祺" | 界面统一用 Luckmi；中文"乐祺名"+ 英文副标解释"祺=auspicious" |
| 生辰数据合规 | 加密 + 不落第三方明文 + GDPR/CCPA + 注销通道 |
| "封建迷信"认知 | 包装为 Chinese metaphysics / BaZi culture / entertainment reference，绝不做确定性命运断言 |

## 附录 A · 执行级启动包

### A.1 COZE 首轮 Prompt（中英对照）

说明：直接粘贴进 coze.cn 编程项目首轮需求，COZE 生成前端 + 后端 + 数据库 + 预览。

  - 【CN】我要做一款海外网页应用 Luckmi 乐祺名（BaZi Names & Fortune Studio）。
定位：AI 起名 + 真八字(BaZi Four-Pillars)引擎，服务海外华人 + 西方用户。
语言：中英双语，默认 EN，可切换中文。
形态：网页 → PWA → TWA(Google Play) → Capacitor(App Store)。

功能四大模块：
A 起名：宝宝取名(姓+性别+生辰→排盘→喜用神→定字/避讳/辈分→10条候选，含含义/文化/五行/谐音/流行度)、
   网名宠物名(主人名+领养日/起用日+风格开关 古风/赛博/可爱→批量)、
   英文名转中文名(音近+意译+五行)、Sibling Name Matcher、Favorites & Share 卡片。
B 八字：四柱排盘、日主、五行%、喜用神/忌神；生肖并入排盘(主卡显示 五行+生肖Year Pillar，展开四柱地支动物)；大运、流年/流月/流日(流时仅年会员)。
C 报告/咨询：Monthly Report(Pro)、Annual Report($169/年会员含2份)、Luck Enhancement Tips、1-on-1 Consult WhatsApp($98=$49+$49, 30min)。
D 永久免费：万年历、吉日查询、解梦(Dream Explorer，"For entertainment & cultural reference only")；不做三才五格/占卜独立模块。

收费(USD)：Quick Name 首单$2.99/复购$4.99；BaZi Name Report $49(5名,含义/结构/能量)；Annual $169；复核$98；Pro Monthly $9.99(首月$4.95)；Pro Yearly $99.9(含2份年报)。
收款：Phase1 国内主体+PayPal/聚合；Phase2 香港公司 Luckmi Limited + Stripe HK。
权限：工作流按角色(guest/registered/single_paid/bazi_report/pro_monthly/pro_yearly/consult_owner)返回完整或截断字段。
每日运势：Capacitor 推送，月会员基础版、年会员增强版。
合规：footer 声明 cultural & entertainment reference only；生辰加密。

### A.2 COZE Prompt（EN）

  - [EN] Build web app "Luckmi — BaZi Names & Fortune Studio", bilingual EN/中文 (EN default).
Tagline: Rooted in Chinese metaphysics, powered by BaZi wisdom.
Form factor: Web → PWA → TWA (Google Play) → Capacitor (App Store).

Modules:
A Naming: Baby Name (surname+gender+birth→bazi→favorable element→fixed/avoid/clan chars→10 candidates with meaning/culture/element/homophone/popularity);
   Username/Pet Name (owner name + adoption/start date + style ancient/cyber/cute → batch);
   English→Chinese Name (phonetic+semantic+element); Sibling Matcher; Favorites & share card.
B BaZi: 4 pillars, day master, element %, favorable/avoid elements; Chinese Zodiac merged into chart (main card: element + Year Pillar animal, expand to show 4 branch animals); luck pillars, yearly/monthly/daily flow (hourly for yearly members only).
C Reports: Monthly (Pro), Annual ($169 / 2 included in yearly), Luck Enhancement Tips, 1-on-1 Consult via WhatsApp ($98 = $49+$49, 30min).
D Free forever: Chinese calendar, auspicious day, dream explorer ("For entertainment & cultural reference only"); no San-cai-wu-ge / divination modules.

Pricing USD: Quick Name first $2.99 / repeat $4.99; BaZi Name Report $49 (5 names: meaning/structure/energy); Annual $169; Consult $98; Pro Monthly $9.99 (first $4.95); Pro Yearly $99.9 (2 annual reports).
Payment: Phase1 PRC entity + PayPal/aggregator; Phase2 HK company "Luckmi Limited" + Stripe HK.
Permissions: workflow returns full/truncated fields by role (guest/registered/single_paid/bazi_report/pro_monthly/pro_yearly/consult_owner).
Daily fortune: Capacitor push, basic for monthly / enhanced for yearly.
Compliance: footer "cultural & entertainment reference only"; encrypt birth data.

### A.3 manifest.json 模板（PWA）

```json
{
  "name": "Luckmi — BaZi Names & Fortune Studio",
  "short_name": "Luckmi",
  "description": "Rooted in Chinese metaphysics, powered by BaZi wisdom.",
  "start_url": "/?utm_source=homescreen",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#1A1426",
  "theme_color": "#1A1426",
  "lang": "en",
  "dir": "ltr",
  "categories": ["lifestyle", "education", "productivity"],
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ],
  "splash_pages": { "include": "auto" },
  "shortcuts": [
    { "name": "Baby Name", "url": "/naming/baby", "icons": [{ "src": "/icons/shortcut-baby.png", "sizes": "96x96" }] },
    { "name": "BaZi Reading", "url": "/bazi", "icons": [{ "src": "/icons/shortcut-bazi.png", "sizes": "96x96" }] }
  ],
  "related_applications": [
    { "platform": "play", "url": "https://play.google.com/store/apps/details?id=com.luckmi.app" },
    { "platform": "itunes", "url": "https://apps.apple.com/app/luckmi/idXXXXXXXXXX" }
  ]
}
```
### A.4 支付产品配置表（Price ID 占位）

统一货币 USD，后端用 price_id 字符串（Stripe / Apple IAP / PayPal 三套映射）。以下 price_xxx 为占位，上线前在 Stripe Dashboard 真实创建后替换。

| SKU | 金额 USD | 计费周期 | Stripe price_id（占位） | Apple IAP 产品 ID | PayPal 方案 |
| --- | --- | --- | --- | --- | --- |
| Quick Name 首单 | 2.99 | one_time | price_luckmi_quick_first | com.luckmi.quick.first | PLAN_QUICK_FIRST |
| Quick Name 复购 | 4.99 | one_time | price_luckmi_quick_repeat | com.luckmi.quick.repeat | PLAN_QUICK_REPEAT |
| BaZi Name Report | 49.00 | one_time | price_luckmi_bazi_report | com.luckmi.bazi.report | PLAN_BAZI_REPORT |
| Annual Report | 169.00 | one_time | price_luckmi_annual_report | com.luckmi.annual.report | PLAN_ANNUAL_REPORT |
| 1-on-1 Consult (WhatsApp) | 98.00 | one_time | price_luckmi_consult_wa | com.luckmi.consult.wa | PLAN_CONSULT_WA |
| Pro Monthly | 9.99 | recurring (month) | price_luckmi_pro_monthly | com.luckmi.pro.monthly | PLAN_PRO_MONTHLY |
| Pro Monthly（首月促销） | 4.95 | recurring (first month) | price_luckmi_pro_monthly_intro | com.luckmi.pro.monthly.intro | PLAN_PRO_MONTHLY_INTRO |
| Pro Yearly | 99.90 | recurring (year) | price_luckmi_pro_yearly | com.luckmi.pro.yearly | PLAN_PRO_YEARLY |

Stripe：创建 Product + Price（one_time / recurring month|year），开启 webhook（checkout.session.completed / invoice.paid）解锁权益

Apple IAP：App Store Connect 建上述 Product ID，自动续期订阅走 Server-to-Server 通知；数字商品必须 IAP 或跳外部浏览器声明离店

PayPal：Phase 1 用 Smart Button / Subscription Plan，仅过渡；订单号映射 first_purchase_done 标志位

首单判定：订单表唯一约束 (user_id, sku=quick)，存在即按复购 $4.99
