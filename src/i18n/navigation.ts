/**
 * src/i18n/navigation.ts
 * next-intl 导航：组件用此 Link/useRouter（自动带 locale 前缀）。
 */
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
