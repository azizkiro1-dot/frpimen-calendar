const CACHE = 'frpimen-v1'
const ASSETS = ['/', '/manifest.json', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return
  e.respondWith(
    fetch(request).then(res => {
      const clone = res.clone()
      if (res.ok && url.origin === location.origin) {
        caches.open(CACHE).then(c => c.put(request, clone)).catch(() => {})
      }
      return res
    }).catch(() => caches.match(request).then(r => r || caches.match('/')))
  )
})
