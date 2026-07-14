import { precacheAndRoute } from 'workbox-precaching';

// Precaché de todos los recursos compilados por Vite
precacheAndRoute((self as any).__WB_MANIFEST);

// Referencia al temporizador activo
let activeTimer: any = null;

// Forzar activación del Service Worker
self.addEventListener('install', () => {
  (self as any).skipWaiting();
});

self.addEventListener('activate', (event: any) => {
  event.waitUntil((self as any).clients.claim());
});

// Manejador de eventos y mensajes en segundo plano
self.addEventListener('message', (event: any) => {
  if (event.data && event.data.type === 'START_TIMER') {
    const { duration } = event.data;

    // Cancelar cualquier temporizador activo previo
    if (activeTimer) {
      clearTimeout(activeTimer);
    }

    // Programar la notificación para cuando expire el tiempo
    activeTimer = setTimeout(() => {
      (self as any).registration.showNotification('¡Descanso Terminado!', {
        body: 'Es hora de tu siguiente serie. ¡A entrenar!',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        vibrate: [200, 100, 200, 100, 200],
        tag: 'rest-timer-complete',
        renotify: true,
        requireInteraction: true,
        // Usar sonido predeterminado del sistema
        sound: 'default'
      });
      activeTimer = null;
    }, duration * 1000);
  } else if (event.data && event.data.type === 'CANCEL_TIMER') {
    if (activeTimer) {
      clearTimeout(activeTimer);
      activeTimer = null;
    }
  }
});

// Al hacer clic en la notificación, reenfocar la aplicación
self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();

  event.waitUntil(
    (self as any).clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList: any[]) => {
      // Si la ventana ya está abierta, hacer foco sobre ella
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Si está cerrada, abrir una nueva pestaña en el inicio de la app
      if ((self as any).clients.openWindow) {
        return (self as any).clients.openWindow('/');
      }
    })
  );
});
