/**
 * public/sw.js — LUCKMI 最小 Service Worker
 * 策略：网络直通（不缓存业务数据，保证排盘/支付/角色永远最新）。
 * 存在 fetch handler 即满足 PWA 可安装条件；后续 M4 可再演进为 App Shell 缓存。
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 不调用 respondWith → 请求走浏览器默认网络流程
self.addEventListener('fetch', () => {});
