const CACHE_NAME = 'pati-pet-v2';
const APP_PREFIX = '/peluqueria-pati-pet';  // ¡IMPORTANTE! Tu nombre de repo

const urlsToCache = [
  `${APP_PREFIX}/`,
  `${APP_PREFIX}/index.html`,
  `${APP_PREFIX}/manifest.json`,
  `${APP_PREFIX}/icon-192.png`,
  `${APP_PREFIX}/icon-512.png`
];

// Instalar Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker instalándose para:', APP_PREFIX);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto para:', urlsToCache);
        return cache.addAll(urlsToCache);
      })
  );
  // Forzar activación inmediata
  self.skipWaiting();
});

// Activar Service Worker y limpiar cachés viejos
self.addEventListener('activate', event => {
  console.log('Service Worker activándose');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando caché viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Tomar control de todas las pestañas
      return self.clients.claim();
    })
  );
});

// Interceptar solicitudes
self.addEventListener('fetch', event => {
  // Solo manejar solicitudes de nuestro dominio
  if (!event.request.url.includes('elherrero12-arch.github.io')) {
    return;
  }
  
  // Para navegación, manejar especialmente
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Si falla, devolver index.html
          return caches.match(`${APP_PREFIX}/index.html`);
        })
    );
    return;
  }
  
  // Para otros recursos
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - devolver respuesta del caché
        if (response) {
          return response;
        }
        
        // Clonar la solicitud
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Verificar si es una respuesta válida
          if (!response || response.status !== 200) {
            return response;
          }
          
          // Clonar la respuesta
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(() => {
          // Si falla la red
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});
