// Service Worker v3 — Mây Elsa
const CACHE_NAME='may-elsa-v3';
const ASSETS=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];

self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE_NAME).then(function(c){return c.addAll(ASSETS);}));
  self.skipWaiting();
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==CACHE_NAME;}).map(function(k){return caches.delete(k);}));
  }));
  self.clients.claim();
});
self.addEventListener('fetch',function(e){
  var url=new URL(e.request.url);
  // Không cache API Gemini
  if(url.hostname.indexOf('generativelanguage')>=0)return;
  // index.html: network-first để luôn có bản mới
  if(e.request.mode==='navigate'||url.pathname.endsWith('index.html')){
    e.respondWith(
      fetch(e.request).then(function(r){
        var clone=r.clone();
        caches.open(CACHE_NAME).then(function(c){c.put(e.request,clone);});
        return r;
      }).catch(function(){return caches.match(e.request).then(function(m){return m||caches.match('./index.html');});})
    );
    return;
  }
  // còn lại: cache-first
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached)return cached;
      return fetch(e.request).then(function(r){
        if(r&&r.status===200&&e.request.method==='GET'){
          var clone=r.clone();
          caches.open(CACHE_NAME).then(function(c){c.put(e.request,clone);});
        }
        return r;
      });
    })
  );
});
