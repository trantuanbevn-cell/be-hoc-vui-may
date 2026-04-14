// Service Worker v2 - Bé Học Vui Mây
// Đổi CACHE_NAME thành v2 → tự động xóa cache v1 cũ

const CACHE_NAME = 'be-hoc-vui-may-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// Cài đặt - cache assets mới
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  // skipWaiting: kích hoạt ngay, không chờ tab cũ đóng
  self.skipWaiting();
});

// Activate - XÓA SẠCH tất cả cache cũ
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) {
              console.log('Xóa cache cũ:', k);
              return caches.delete(k);
            })
      );
    })
  );
  // Claim: kiểm soát tất cả tab ngay lập tức
  self.clients.claim();
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', function(e) {
  // Luôn lấy index.html từ network trước (không cache cứng)
  if (e.request.url.includes('index.html') || e.request.url.endsWith('/')) {
    e.respondWith(
      fetch(e.request).then(function(response) {
        // Cập nhật cache với bản mới nhất
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
        return response;
      }).catch(function() {
        // Nếu offline mới dùng cache
        return caches.match(e.request);
      })
    );
    return;
  }

  // Các file khác: cache first
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function() {
        return caches.match('./index.html');
      });
    })
  );
});
