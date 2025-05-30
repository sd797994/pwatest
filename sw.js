const CACHE_NAME = 'lianliankan-pwa-cache-v1.2'; // 每次更新资源时，可以更改版本号来更新缓存
const urlsToCache = [
  './', // 代表根目录，通常是 index.html
  './index.html', // 明确指定主HTML文件
  './manifest.json',
  // './style.css', // 如果你有独立的CSS文件
  // './game.js',   // 如果你有独立的JS文件
  // 图标也应该被缓存，这样离线时应用图标也能显示
  'icons/icon-72x72.png',
  'icons/icon-96x96.png',
  'icons/icon-128x128.png',
  'icons/icon-144x144.png',
  'icons/icon-152x152.png',
  'icons/icon-192x192.png',
  'icons/icon-384x384.png',
  'icons/icon-512x512.png'
  // 如果你的游戏还依赖其他图片、音频等资源，也把它们的路径加到这里
];

// 1. 安装 Service Worker 并缓存核心资源
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[ServiceWorker] Failed to cache app shell:', error);
      })
  );
});

// 2. 激活 Service Worker 并清理旧缓存 (可选但推荐)
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) { // 删除不是当前版本的缓存
            console.log('[ServiceWorker] Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // 让新的Service Worker立即控制页面
});

// 3. 拦截网络请求，实现离线访问 (缓存优先策略)
self.addEventListener('fetch', event => {
  // console.log('[ServiceWorker] Fetching:', event.request.url);
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果在缓存中找到了资源，则返回缓存的资源
        if (response) {
          // console.log('[ServiceWorker] Serving from cache:', event.request.url);
          return response;
        }
        // 如果缓存中没有，则通过网络去获取
        // console.log('[ServiceWorker] Fetching from network:', event.request.url);
        return fetch(event.request).then(
            function(networkResponse) {
              // 可选：对于非核心资源，获取到后也可以缓存起来，供下次使用
              // 但要注意不要缓存所有东西，避免缓存过大
              // if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET' && !urlsToCache.includes(new URL(event.request.url).pathname.substring(1))) {
              //   caches.open(CACHE_NAME).then(cache => {
              //     cache.put(event.request, networkResponse.clone());
              //   });
              // }
              return networkResponse;
            }
        ).catch(error => {
            console.error('[ServiceWorker] Fetch failed; returning offline page if available or error.', error);
            // 你可以准备一个离线时显示的通用页面 (可选)
            // return caches.match('./offline.html');
        });
      })
  );
});