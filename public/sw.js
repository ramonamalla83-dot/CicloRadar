// CicloRadar Service Worker for PWA, Push Notifications and Background SOS Alerts
const CACHE_NAME = 'cicloradar-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg'
];

// 1. INSTALACIÓN
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        // Fallback si recursos de desarrollo se generan dinámicamente
      });
    })
  );
  self.skipWaiting();
});

// 2. ACTIVACIÓN Y LIMPIEZA DE CACHÉ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. ESTRATEGIA DE RED / CACHÉ
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Excluir capas de mapas de terceros y APIs dinámicas
  if (
    url.hostname.includes('google') || 
    url.hostname.includes('cartocdn') || 
    url.hostname.includes('openstreetmap') ||
    url.hostname.includes('fastly')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).catch(() => {
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// 4. EVENTO PUSH DEL SISTEMA (NOTIFICACIONES EN SEGUNDO PLANO)
self.addEventListener('push', (event) => {
  let data = {
    title: '🚨 ¡ALERTA SOS: CICLISTA EN PELIGRO!',
    body: 'Un ciclista cercano ha activado la baliza de emergencia. Toca para ver ubicación GPS en el radar.',
    name: 'Ciclista Cercano',
    distance: '0.8 km',
    lat: -33.3,
    lng: -66.3,
    url: '/?screen=map&sos=true'
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    vibrate: [500, 200, 500, 200, 500, 200, 500],
    tag: 'cicloradar-emergency-alert',
    renotify: true,
    requireInteraction: true, // No desaparece hasta que el usuario responda
    data: {
      url: data.url || '/?screen=map&sos=true',
      name: data.name,
      distance: data.distance,
      lat: data.lat,
      lng: data.lng,
      timestamp: Date.now()
    },
    actions: [
      { action: 'open_sos', title: '🚨 IR A ASISTIR' },
      { action: 'dismiss', title: 'Cerrar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

// 5. MENSAJES DESDE EL CLIENTE (PARA DISPARAR NOTIFICACIONES CUANDO LA APP ESTÁ MINIMIZADA)
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'NOTIFY_SOS_EMERGENCY') {
    const payload = event.data.payload || {};
    const title = `🚨 ¡SOS: ${payload.name || 'Ciclista'} en Emergencia!`;
    const body = `A ${payload.distance || 'corta distancia'} de ti. Toca para abrir el radar GPS y prestar auxilio.`;

    const notificationOptions = {
      body: body,
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      vibrate: [500, 200, 500, 200, 500, 200, 500],
      tag: 'cicloradar-emergency-alert',
      renotify: true,
      requireInteraction: true,
      data: {
        url: '/?screen=map&sos=true',
        name: payload.name,
        distance: payload.distance,
        lat: payload.lat,
        lng: payload.lng,
        timestamp: Date.now()
      },
      actions: [
        { action: 'open_sos', title: '🚨 IR A ASISTIR' },
        { action: 'dismiss', title: 'Ignorar' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(title, notificationOptions)
    );
  }

  if (event.data.type === 'SCHEDULE_TEST_NOTIFICATION') {
    const delayMs = event.data.delay || 3000;
    setTimeout(() => {
      self.registration.showNotification('🚨 Prueba de Notificación SOS en 2do Plano', {
        body: '¡Excelente! Las alertas de CicloRadar funcionan en segundo plano con pantalla apagada o app minimizada.',
        icon: '/icon-192.svg',
        badge: '/icon-192.svg',
        vibrate: [400, 150, 400],
        tag: 'cicloradar-test-alert',
        renotify: true,
        data: { url: '/?screen=home' }
      });
    }, delayMs);
  }
});

// 6. CLIC EN LA NOTIFICACIÓN PUSH
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const notificationData = event.notification.data || {};
  const targetUrl = notificationData.url || '/?screen=map&sos=true';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si la ventana ya existe, la enfocamos y le comunicamos las coordenadas SOS
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: 'NAVIGATE_TO_SOS',
            payload: notificationData
          });
          return client.focus();
        }
      }
      // Si la app estaba en segundo plano cerrado, abrimos la ventana
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
