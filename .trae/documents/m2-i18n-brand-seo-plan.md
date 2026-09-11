# M2: i18n + LUCKMI 品牌视觉 + Lighthouse SEO

## Context

当前项目 UI 全部中文硬编码，无 i18n 库。v7 规划明确要求 EN 默认双语、海外市场定位（US/CA/UK/AU + SEA）。M2 需接入 next-intl、抽取所有 UI 文案到消息包、实现语言切换、品牌视觉系统、生肖主卡、SEO 基础（metadata/hreflang/SSG），验收标准为"双语零遗漏 + Lighthouse SEO ≥ 90"。

## 实现步骤

### 步骤 1：next-intl 接入与路由配置

**安装**：`npm install next-intl`

**新建文件**：
- `src/i18n/routing.ts` — 路由配置：locales=['en','zh']，defaultLocale='en'，localePrefix='as-needed'（EN 走 `/`，zh 走 `/zh`，M6 加 zh-TW）
- `src/i18n/request.ts` — getRequestConfig：按 locale 加载 messages/{locale}.json
- `src/middleware.ts` — next-intl middleware（匹配路由除 /api、/_next、/favicon 外）
- `src/i18n/navigation.ts` — 导出 Link/redirect/useRouter（基于 createNavigation）

**修改文件**：
- `next.config.mjs` — 加 withNextIntl(plugin) 插件
- `tsconfig.json` — 无需改（@/* 已指向 src/*）

### 步骤 2：App Router 重构为 [locale] 动态段

**移动**：
- `src/app/page.tsx` → `src/app/[locale]/page.tsx`
- `src/app/layout.tsx` → `src/app/[locale]/layout.tsx`
- `src/app/components/` → `src/app/[locale]/components/`（保持相对引用）
- `src/app/globals.css` 留在 `src/app/`（全局样式）
- `src/app/api/` 留在 `src/app/`（API 不参与 locale 路由）

**新根 layout**：
- `src/app/layout.tsx` — 极简根 layout（仅 children 传递，不设 lang），由 [locale]/layout.tsx 设 `<html lang={locale}>`

**[locale]/layout.tsx**：
- 设 NextIntlClientProvider + messages
- 设 `<html lang={locale}>` + metadata（generateMetadata 按 locale 生成 title/description）
- 含合规 footer + 语言切换器

### 步骤 3：消息包（messages/en.json + messages/zh.json）

**namespace 划分**（基于 UI 文案调研）：

```
common     — 通用：按钮(排盘/重置/加载中)、错误提示、性别/历法选项
paipan     — 排盘页：表单标签(年/月/日/时/分/出生地经度/时区)、区块标题(四柱八字/五行与喜用/大运流年流月流日)
pillar     — 四柱表：列头(年柱/月柱/日柱/时柱)、行标签(干神/天干/地支/藏干/支神/纳音/空亡/地势/自坐/神煞)、关系(冲/合/刑/破/害/生/克/泄/耗)
wuxing     — 五行图：五行名(木火土金水)、生克(生/克)、日主、旺相休囚死、幸运颜色/方位/数字、喜用标注
shishen    — 十神：比肩/劫财/食神/伤官/偏财/正财/七杀/正官/偏印/正印/日主
timeline   — 时间轴：大运/流年/流月/流日、起运、童限、节气
summary    — 摘要面板：日主/强弱/格局/用神/喜神/忌神/调候用神
strength   — 强弱：极弱/偏弱/均衡/偏强/极强
pattern    — 格局：八正格名(正官格/七杀格/正财格/偏财格/正印格/偏印格/食神格/伤官格)
shensha    — 神煞：天乙贵人/文昌/福星/学堂/太极/词馆/桃花/驿马/华盖 等
dishi      — 地势：长生/沐浴/冠带/临官/帝旺/衰/病/死/墓/绝/胎/养
brand      — 品牌：LUCKMI/乐祺名/BaZi Names & Fortune Studio/Qi(祺)=auspicious
compliance — 合规：footer 免责声明(EN/zh)
```

**翻译原则**：
- 引擎层（src/lib/bazi/*, src/lib/naming/*）保持中文不变（单一事实源）
- 展示层用 `t()` 翻译；领域常量通过 `src/lib/i18n/terms.ts` 映射表转 i18n key
- 天干/地支/纳音：EN 用拼音 romanization（jia/yi/bing/ding...），不意译

### 步骤 4：领域常量翻译层

**新建 `src/lib/i18n/terms.ts`**：
- `termKey(term: string): string` — 中文领域词 → i18n key（如 '七杀' → 'shishen.qisha'）
- 映射表覆盖：十神、五行、强弱、格局、神煞、地势、干支关系
- 干支名用 romanization 表（甲=jia, 乙=yi, 子=zi, 午=wu...）
- 纳音保留中文（30 对，EN 场景展示拼音+注释）

### 步骤 5：组件词条化迁移

**迁移 8 个文件**（替换硬编码中文为 `useTranslations(namespace)` + `t('key')`）：

| 文件 | namespace | 主要文案 |
|------|-----------|----------|
| `[locale]/page.tsx` | common, paipan | 表单标签、按钮、区块标题 |
| `[locale]/layout.tsx` | brand, compliance | metadata、footer |
| `PaipanTable.tsx` | pillar, shishen, dishi, shensha | 列头、行标签、关系 |
| `WuxingChart.tsx` | wuxing, strength | 五行名、生克、旺相休囚死 |
| `ShishenChart.tsx` | shishen | 十神名、占比标题 |
| `SummaryPanel.tsx` | summary, pattern, strength | 摘要字段、格局名 |
| `TimelineView.tsx` | timeline | 大运/流年/流月/流日、起运 |
| `ui-utils.ts` | (工具函数) | 无直接文案，但如有格式化可接 Intl |

**领域常量处理**：组件中出现的 `shishen`/`wuxing`/`dishi` 等中文值（来自引擎返回），经 `termKey()` 映射后 `t()` 翻译。

### 步骤 6：语言切换器 + 合规 footer

**新建 `[locale]/components/LocaleSwitcher.tsx`**：
- 使用 `useLocale()` + `useRouter()` 切换 `/` ↔ `/zh`
- 下拉或 toggle，保持当前路径

**合规 footer**（在 [locale]/layout.tsx 底部）：
- EN: "BaZi, zodiac and dream features are for cultural and entertainment reference only. Not financial, medical or legal advice."
- zh: "八字、生肖及解梦内容仅供传统文化与娱乐参考，不构成投资、医疗或法律建议。"
- 避免词：fortune telling / 改命 / 化解灾祸 → BaZi reading / name analysis

### 步骤 7：LUCKMI 品牌视觉 + 生肖主卡

**主题色系**（v7 §M2：暖金米色系，manifest theme #1A1426 备选深色）：
- `globals.css` 加 CSS 变量：`--brand-gold: #C9A961; --brand-cream: #F5F0E8; --brand-deep: #1A1426`
- 字体：英文 serif 标题（Cormorant/Playfair）、中文 serif（Noto Serif SC）

**新建 `[locale]/components/ZodiacCard.tsx`**：
- 输入：年柱地支 → 生肖（子鼠/丑牛...）
- 展示：生肖图标（SVG inline）+ 生肖名（EN/zh）+ 简述
- 生肖数据表 `src/lib/i18n/zodiac.ts`：12 生肖 × {en, zh, emoji/svg, traits}

**品牌 header**：
- `[locale]/components/BrandHeader.tsx`：LUCKMI logo 文字 + 副标 + 语言切换器
- 生肖主卡嵌在排盘结果区顶部（当年柱计算后展示）

### 步骤 8：SEO / Lighthouse ≥ 90

**metadata（generateMetadata in [locale]/layout.tsx）**：
- title: "LUCKMI · BaZi Names & Fortune Studio" (en) / "LUCKMI · 乐祺名 · 八字排盘" (zh)
- description: 双语
- alternates: `languages` 设 hreflang（en-x-default, zh）

**SSG**：
- `[locale]/page.tsx` 加 `generateStaticParams` → ['en', 'zh']（静态预渲染）

**性能（Lighthouse ≥ 90）**：
- 现有组件已 client component，确保动态 import 大组件（PaipanTable/TimelineView）
- 图片/生肖 SVG 用 inline，不引入图片依赖
- metadata + semantic HTML + alt text

### 步骤 9：测试

**新建测试**：
- `tests/i18n/messages-parity.test.ts` — en.json 与 zh.json key 集合完全一致（零遗漏校验）
- `tests/i18n/terms.test.ts` — termKey 映射表覆盖全部十神/五行/格局/神煞/地势
- `tests/i18n/no-hardcoded-chinese.test.ts` — 扫描 src/app/[locale]/components/*.tsx 无硬编码中文字面量（除注释）

## 文件清单

**新建**：
- `src/i18n/routing.ts`、`src/i18n/request.ts`、`src/i18n/navigation.ts`
- `src/i18n/terms.ts`、`src/i18n/zodiac.ts`
- `src/middleware.ts`
- `messages/en.json`、`messages/zh.json`
- `src/app/[locale]/layout.tsx`、`src/app/[locale]/page.tsx`
- `src/app/[locale]/components/LocaleSwitcher.tsx`
- `src/app/[locale]/components/BrandHeader.tsx`
- `src/app/[locale]/components/ZodiacCard.tsx`
- `src/app/layout.tsx`（新根 layout）
- `tests/i18n/messages-parity.test.ts`、`tests/i18n/terms.test.ts`、`tests/i18n/no-hardcoded-chinese.test.ts`

**移动**（内容不变，路径变）：
- `src/app/components/{PaipanTable,WuxingChart,ShishenChart,SummaryPanel,TimelineView,ui-utils}.tsx` → `src/app/[locale]/components/`

**修改**：
- `next.config.mjs`（withNextIntl）
- `src/app/globals.css`（品牌色 CSS 变量）
- 上述 6 个组件 + page.tsx + layout.tsx（词条化）

**不动**：
- `src/app/api/`、`src/lib/bazi/*`、`src/lib/naming/*`（引擎层保持中文单一事实源）

## 验证

1. `npm run dev` → 访问 `/` 看到 EN 界面、`/zh` 看到 zh 界面
2. 语言切换器切换后路径正确、无遗漏中文
3. `npx tsc --noEmit` 通过
4. `npx vitest run` 全绿（含新 i18n 测试）
5. `npm run build` SSG 预渲染成功（en + zh 两个静态页）
6. Lighthouse SEO ≥ 90（metadata/hreflang/semantic HTML/SSG）
