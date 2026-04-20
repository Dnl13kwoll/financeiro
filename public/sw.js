const CACHE_STATIC = 'financeiro-static-v2'
const CACHE_PAGES  = 'financeiro-pages-v2'
const CACHE_DATA   = 'financeiro-data-v2'
const ALL_CACHES   = [CACHE_STATIC, CACHE_PAGES, CACHE_DATA]

// Static assets to pre-cache on install
const STATIC_PRECACHE = ['/icon.svg', '/manifest.json']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((c) => c.addAll(STATIC_PRECACHE))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !ALL_CACHES.includes(k)).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== location.origin) return

  // Skip Next.js internals and HMR
  if (url.pathname.startsWith('/_next/webpack-hmr') ||
      url.pathname.startsWith('/__nextjs')) return

  // Static assets (_next/static): cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached
        return fetch(event.request).then((res) => {
          caches.open(CACHE_STATIC).then((c) => c.put(event.request, res.clone()))
          return res
        })
      })
    )
    return
  }

  // Navigation requests (HTML pages): network-first, cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          // Only cache successful responses
          if (res.ok) {
            caches.open(CACHE_PAGES).then((c) => c.put(event.request, res.clone()))
          }
          return res
        })
        .catch(() =>
          caches.match(event.request).then((cached) => {
            if (cached) return cached
            // Offline fallback: return cached dashboard if available
            return caches.match('/dashboard') ?? Response.error()
          })
        )
    )
    return
  }

  // API/data requests: network-first, stale fallback (max 50 entries)
  if (url.pathname.startsWith('/api/') || url.pathname.includes('supabase')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok) {
            caches.open(CACHE_DATA).then((c) => c.put(event.request, res.clone()))
          }
          return res
        })
        .catch(() => caches.match(event.request).then((r) => r ?? Response.error()))
    )
    return
  }

  // Everything else: stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((res) => {
        caches.open(CACHE_STATIC).then((c) => c.put(event.request, res.clone()))
        return res
      })
      return cached ?? fetchPromise
    })
  )
})

// ── Push Notifications ──
self.addEventListener('push', (event) => {
  let data = { title: 'Financeiro', body: 'Você tem vencimentos próximos.', url: '/dashboard' }
  try { data = { ...data, ...event.data.json() } } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: 'financeiro-notification',
      renotify: true,
      data: { url: data.url },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/dashboard'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find((c) => c.url.includes(self.location.origin))
      if (existing) { existing.focus(); existing.navigate(url) }
      else clients.openWindow(url)
    })
  )
})
