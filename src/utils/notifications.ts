/**
 * Gestor de Notificaciones Push y Alertas en Segundo Plano mediante Service Workers
 */

export interface SosNotificationPayload {
  name: string;
  distance: string;
  lat: number;
  lng: number;
}

interface ExtendedNotificationOptions extends NotificationOptions {
  vibrate?: number[];
  actions?: Array<{ action: string; title: string }>;
  renotify?: boolean;
  requireInteraction?: boolean;
}

class NotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.initServiceWorker();
  }

  /**
   * Obtiene o inicializa el registro del Service Worker
   */
  public async initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }

    try {
      // Si ya hay un SW registrado, reutilizarlo
      const existing = await navigator.serviceWorker.getRegistration();
      if (existing) {
        this.swRegistration = existing;
        return existing;
      }

      // Si no, registrar /sw.js
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      this.swRegistration = registration;
      return registration;
    } catch (err) {
      console.warn('No se pudo registrar Service Worker para notificaciones:', err);
      return null;
    }
  }

  /**
   * Solicita permiso explícito de notificaciones al navegador
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (err) {
      console.error('Error al solicitar permiso de notificaciones:', err);
      return 'denied';
    }
  }

  /**
   * Verifica si el permiso de notificaciones está concedido
   */
  public isPermissionGranted(): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    return Notification.permission === 'granted';
  }

  /**
   * Emite una notificación del sistema mediante Service Worker cuando un SOS está activo.
   * Funciona incluso si la app está minimizada, en otra pestaña o en segundo plano.
   */
  public async triggerSosAlert(payload: SosNotificationPayload): Promise<boolean> {
    if (!this.isPermissionGranted()) {
      const granted = await this.requestPermission();
      if (granted !== 'granted') return false;
    }

    const reg = this.swRegistration || (await this.initServiceWorker());

    // 1. Enviar mensaje al Service Worker activo para que muestre la notificación persistente
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'NOTIFY_SOS_EMERGENCY',
        payload
      });
      return true;
    }

    // 2. Si el controller aún no está listo pero tenemos el registro
    if (reg && reg.showNotification) {
      const title = `🚨 ¡SOS: ${payload.name || 'Ciclista'} en Emergencia!`;
      const options: ExtendedNotificationOptions = {
        body: `A ${payload.distance || '0.5 km'} de ti. Toca para abrir el radar GPS y prestar auxilio.`,
        icon: '/icon-192.svg',
        badge: '/icon-192.svg',
        vibrate: [500, 200, 500, 200, 500],
        tag: 'cicloradar-emergency-alert',
        renotify: true,
        requireInteraction: true,
        data: {
          url: '/?screen=map&sos=true',
          lat: payload.lat,
          lng: payload.lng,
          name: payload.name,
          distance: payload.distance,
          timestamp: Date.now()
        }
      };
      await reg.showNotification(title, options);
      return true;
    }

    // 3. Fallback a Notification API estándar si el navegador lo soporta
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`🚨 ¡SOS: ${payload.name || 'Ciclista'} en Emergencia!`, {
        body: `A ${payload.distance || '0.5 km'} de tu ubicación. Toca para asistir.`,
        icon: '/icon-192.svg',
        tag: 'cicloradar-emergency-alert'
      });
      return true;
    }

    return false;
  }

  /**
   * Programa una notificación de prueba con retraso para que el usuario pueda
   * minimizar la app o apagar la pantalla y comprobar que funciona en segundo plano.
   */
  public async scheduleBackgroundTest(delaySeconds: number = 3): Promise<boolean> {
    if (!this.isPermissionGranted()) {
      const granted = await this.requestPermission();
      if (granted !== 'granted') return false;
    }

    await this.initServiceWorker();

    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_TEST_NOTIFICATION',
        delay: delaySeconds * 1000
      });
      return true;
    }

    // Fallback con setTimeout
    setTimeout(async () => {
      const reg = this.swRegistration || (await this.initServiceWorker());
      if (reg && reg.showNotification) {
        const testOptions: ExtendedNotificationOptions = {
          body: '¡Perfecto! CicloRadar puede alertarte en segundo plano con pantalla apagada.',
          icon: '/icon-192.svg',
          badge: '/icon-192.svg',
          vibrate: [400, 150, 400],
          tag: 'cicloradar-test'
        };
        reg.showNotification('🚨 Prueba de Notificación en Segundo Plano', testOptions);
      }
    }, delaySeconds * 1000);

    return true;
  }
}

export const notificationService = new NotificationService();
