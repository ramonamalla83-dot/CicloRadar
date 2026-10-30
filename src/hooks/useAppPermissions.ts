import { useState, useEffect, useCallback } from 'react';
import { audioEngine } from '../utils/audio';

export interface PermissionItem {
  id: 'geolocation' | 'audio' | 'notifications' | 'wakelock' | 'vibration';
  title: string;
  description: string;
  status: 'granted' | 'denied' | 'prompt' | 'unsupported';
  isCrucial: boolean;
}

export function useAppPermissions() {
  const [geoStatus, setGeoStatus] = useState<'granted' | 'denied' | 'prompt' | 'unsupported'>('prompt');
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);
  const [notifStatus, setNotifStatus] = useState<'granted' | 'denied' | 'prompt' | 'unsupported'>('prompt');
  const [wakeLockSupported, setWakeLockSupported] = useState<boolean>(true);
  const [vibrationSupported, setVibrationSupported] = useState<boolean>(true);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  // Comprobar estado inicial de permisos
  const checkPermissions = useCallback(async () => {
    // 1. Detectar si ya está en modo Standalone (PWA instalada)
    if (typeof window !== 'undefined') {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);

      // Detectar iOS Safari
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(isAppleDevice);

      // Soportes de hardware
      setWakeLockSupported('wakeLock' in navigator);
      setVibrationSupported('vibrate' in navigator);
    }

    // 2. Permiso de Notificaciones
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setNotifStatus('granted');
      } else if (Notification.permission === 'denied') {
        setNotifStatus('denied');
      } else {
        setNotifStatus('prompt');
      }
    } else {
      setNotifStatus('unsupported');
    }

    // 3. Permiso de Geolocalización
    if (typeof navigator !== 'undefined' && 'permissions' in navigator && navigator.permissions.query) {
      try {
        const geoQuery = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        setGeoStatus(geoQuery.state as any);
        geoQuery.onchange = () => {
          setGeoStatus(geoQuery.state as any);
        };
      } catch {
        // Fallback básico si query no está disponible
        setGeoStatus('prompt');
      }
    } else if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      setGeoStatus('prompt');
    } else {
      setGeoStatus('unsupported');
    }
  }, []);

  useEffect(() => {
    checkPermissions();

    // Capturar evento beforeinstallprompt para PWA
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [checkPermissions]);

  // Solicitar Geolocalización
  const requestGeolocation = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        setGeoStatus('unsupported');
        resolve(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        () => {
          setGeoStatus('granted');
          resolve(true);
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setGeoStatus('denied');
          }
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, []);

  // Desbloquear Audio a volumen máximo
  const requestAudioUnlock = useCallback(async (): Promise<boolean> => {
    try {
      const ok = await audioEngine.ensureAudioContext();
      if (ok) {
        setAudioUnlocked(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Solicitar Notificaciones
  const requestNotifications = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      setNotifStatus('unsupported');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setNotifStatus(result as any);
      return result === 'granted';
    } catch {
      return false;
    }
  }, []);

  // Solicitar Todos los Permisos de una vez
  const grantAllPermissions = useCallback(async () => {
    await requestAudioUnlock();
    await requestGeolocation();
    if ('Notification' in window && notifStatus !== 'granted') {
      await requestNotifications();
    }
    // Probar pequeña vibración háptica de confirmación
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([100, 50, 100]);
      } catch {}
    }
    checkPermissions();
  }, [requestAudioUnlock, requestGeolocation, requestNotifications, notifStatus, checkPermissions]);

  // Lanzar diálogo nativo de instalación PWA
  const triggerInstallPrompt = useCallback(async (): Promise<boolean> => {
    if (installPromptEvent) {
      installPromptEvent.prompt();
      const choiceResult = await installPromptEvent.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsStandalone(true);
        setInstallPromptEvent(null);
        return true;
      }
    }
    return false;
  }, [installPromptEvent]);

  return {
    geoStatus,
    audioUnlocked,
    notifStatus,
    wakeLockSupported,
    vibrationSupported,
    isStandalone,
    installPromptEvent,
    isIOS,
    requestGeolocation,
    requestAudioUnlock,
    requestNotifications,
    grantAllPermissions,
    triggerInstallPrompt,
    checkPermissions
  };
}
