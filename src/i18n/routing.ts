/**
 * src/i18n/routing.ts
 * next-intl 路由配置（v7 §8.1：EN 默认 + /zh 简中；M6 加 /zh-TW）。
 */
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'zh'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
});
