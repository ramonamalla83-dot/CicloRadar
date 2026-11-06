importScripts(
  'https://www.gstatic.com/firebasejs/13.1.0/firebase-app-compat.js',
);
importScripts(
  'https://www.gstatic.com/firebasejs/13.1.0/firebase-messaging-compat.js',
);
importScripts('firebase-config.js');

const config = self.CICLORADAR_FIREBASE_CONFIG;
if (config && config.apiKey && config.projectId && config.appId) {
  firebase.initializeApp(config);
  const messaging = firebase.messaging();
  messaging.onBackgroundMessage((payload) => {
    if (payload.notification) return;

    const data = payload.data || {};
    const title = data.title || 'Alerta SOS CicloRadar';
    const body = data.body || 'Un ciclista cercano activó una alerta SOS.';
    self.registration.showNotification(title, {
      body,
      icon: 'icons/Icon-192.png',
      tag: data.sosId || 'cicloradar-sos',
      data,
      requireInteraction: true,
    });
  });
}
