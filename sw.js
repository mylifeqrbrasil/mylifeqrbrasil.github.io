const CACHE_NAME = 'mylifeqrbrasil-v1.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/admin.html',
  '/perfil.html',
  '/MyLifeQRLogo.png',
  '/Motoindex.png',
  '/Casco.jpg',
  '/TemplateNegroMyLifeQRBrasil.png',
  '/TemplateVerdeMyLifeQRBrasil.png',
  '/TemplateNegroMyLifeQRBrasilEN.png',
  '/TemplateVerdeMyLifeQRBrasilEN.png',
  '/TemplateNegroMyLifeQRBrasilCuadrado.png',
  '/TemplateVerdeMyLifeQRBrasilCuadrado.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/manifest.json'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker MyLifeQR Brasil] Instalado');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cache salvo');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.log('[Service Worker] Erro no cache:', err))
  );
  self.skipWaiting();
});

// Ativação - limpa caches antigos
self.addEventListener('activate', event => {
  console.log('[Service Worker MyLifeQR Brasil] Ativado');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removendo cache antigo:', key);
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

// Interceptação de requisições
self.addEventListener('fetch', event => {
  // Ignorar requisições para Firebase e EmailJS
  if (event.request.url.includes('firebase') || 
      event.request.url.includes('firestore') ||
      event.request.url.includes('emailjs') ||
      event.request.url.includes('googleapis') ||
      event.request.url.includes('gstatic.com')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(response => {
          // Não cachear respostas de erro
          if (!response || response.status !== 200) {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
      .catch(() => {
        // Fallback para modo offline
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Offline - Verifique sua conexão com a internet', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
  );
});