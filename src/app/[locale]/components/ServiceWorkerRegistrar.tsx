/**
 * ServiceWorkerRegistrar
 * 仅生产环境注册 /sw.js（开发环境跳过，避免拦截 Next HMR）。
 */
'use client';
import { useEffect } from 'react';

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* 注册失败不影响主功能 */
    });
  }, []);

  return null;
}
