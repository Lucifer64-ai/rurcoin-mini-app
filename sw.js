// Service Worker для RURCoin Mini App
const CACHE_NAME = 'rurcoin-v5';
const ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/contracts.js',
    '/manifest.json'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
    console.log('📦 RURCoin Service Worker: Установка...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Кэширование assets...');
                return cache.addAll(ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
    console.log('🎉 RURCoin Service Worker: Активация...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Удаление старого кэша:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// Обработка сообщений от приложения
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
