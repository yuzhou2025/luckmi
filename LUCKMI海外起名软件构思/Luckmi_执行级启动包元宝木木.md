# Luckmi 乐祺名 · 执行级启动包

> 配套《海外版整体规划 v6 终版》附录 A。直接用于 COZE 首轮需求 + PWA 配置 + 支付产品创建。

---

## A.1 COZE 首轮 Prompt（中英对照）

### 中文版

```
我要做一款海外网页应用 Luckmi 乐祺名（BaZi Names & Fortune Studio）。
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
```

### EN 版

```
Build web app "Luckmi — BaZi Names & Fortune Studio", bilingual EN/中文 (EN default).
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
```

---

## A.2 manifest.json 模板（PWA）

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

配套 Service Worker 最小配置（离线返回 200，满足 Lighthouse 安装条件）：

```js
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => self.clients.claim());
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.open('luckmi-v1').then(cache =>
      cache.match(e.request).then(res => res || fetch(e.request).then(r => {
        cache.put(e.request, r.clone()); return r;
      }))
    ).catch(() => new Response('', { status: 200 }))
  );
});
```

---

## A.3 支付产品配置表（Price ID 占位）

> 统一货币 USD，后端用 price_id 字符串（Stripe / Apple IAP / PayPal 三套映射）。`price_xxx` 为占位，上线前在 Stripe Dashboard 真实创建后替换。

| SKU | 金额 USD | 周期 | Stripe price_id（占位） | Apple IAP 产品 ID | PayPal 方案 |
|---|---|---|---|---|---|
| Quick Name 首单 | 2.99 | one_time | `price_luckmi_quick_first` | `com.luckmi.quick.first` | PLAN_QUICK_FIRST |
| Quick Name 复购 | 4.99 | one_time | `price_luckmi_quick_repeat` | `com.luckmi.quick.repeat` | PLAN_QUICK_REPEAT |
| BaZi Name Report | 49.00 | one_time | `price_luckmi_bazi_report` | `com.luckmi.bazi.report` | PLAN_BAZI_REPORT |
| Annual Report | 169.00 | one_time | `price_luckmi_annual_report` | `com.luckmi.annual.report` | PLAN_ANNUAL_REPORT |
| 1-on-1 Consult (WhatsApp) | 98.00 | one_time | `price_luckmi_consult_wa` | `com.luckmi.consult.wa` | PLAN_CONSULT_WA |
| Pro Monthly | 9.99 | recurring (month) | `price_luckmi_pro_monthly` | `com.luckmi.pro.monthly` | PLAN_PRO_MONTHLY |
| Pro Monthly 首月促销 | 4.95 | recurring (first month) | `price_luckmi_pro_monthly_intro` | `com.luckmi.pro.monthly.intro` | PLAN_PRO_MONTHLY_INTRO |
| Pro Yearly | 99.90 | recurring (year) | `price_luckmi_pro_yearly` | `com.luckmi.pro.yearly` | PLAN_PRO_YEARLY |

### 配置要点

- **Stripe**：创建 Product + Price（one_time / recurring month|year），开启 webhook（`checkout.session.completed` / `invoice.paid`）解锁权益；Phase 2 用港司 Stripe HK 账户。
- **Apple IAP**：App Store Connect 建上述 Product ID，自动续期订阅走 Server-to-Server 通知；数字商品必须 IAP 或跳外部浏览器声明离店。
- **PayPal**：Phase 1 用 Smart Button / Subscription Plan，仅过渡；订单号映射 `first_purchase_done` 标志位。
- **首单判定**：订单表唯一约束 `(user_id, sku=quick)`，存在即按复购 $4.99。

---

*Luckmi · 乐祺名 · BaZi Names & Fortune Studio*
*Rooted in Chinese metaphysics, powered by BaZi wisdom.*
