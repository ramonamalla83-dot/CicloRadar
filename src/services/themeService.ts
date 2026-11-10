/**
 * Servicio inteligente de Detección de Hora Local y Configuración del Sistema
 * para activación de Tema Oscuro Avanzado (Mapa y UI) en rutas ciclistas.
 */

export type ThemeMode = 'auto' | 'night' | 'day';

export interface ThemeState {
  mode: ThemeMode;
  isNightActive: boolean;
  comfortFilterEnabled: boolean;
  reason: 'local_time' | 'system_preference' | 'manual';
  recommendedMapLayer: 'dark' | 'streets';
  timeStr: string;
}

const STORAGE_MODE_KEY = 'cicloradar_theme_mode';
const STORAGE_COMFORT_KEY = 'cicloradar_comfort_filter';

type Listener = (state: ThemeState) => void;

class ThemeService {
  private mode: ThemeMode = 'auto';
  private comfortFilterEnabled: boolean = true;
  private listeners: Set<Listener> = new Set();
  private timer: NodeJS.Timeout | null = null;
  private mediaQuery: MediaQueryList | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // 1. Cargar preferencias guardadas
    try {
      const savedMode = localStorage.getItem(STORAGE_MODE_KEY) as ThemeMode | null;
      if (savedMode && ['auto', 'night', 'day'].includes(savedMode)) {
        this.mode = savedMode;
      }

      const savedComfort = localStorage.getItem(STORAGE_COMFORT_KEY);
      if (savedComfort !== null) {
        this.comfortFilterEnabled = savedComfort === 'true';
      }
    } catch (_) {}

    // 2. Escuchar cambios de preferencia del sistema operativo
    if (window.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', () => {
        if (this.mode === 'auto') {
          this.applyTheme();
        }
      });
    }

    // 3. Temporizador cada 60s para evaluar paso entre día y noche según reloj local
    this.timer = setInterval(() => {
      if (this.mode === 'auto') {
        this.applyTheme();
      }
    }, 60000);

    // 4. Aplicar de inmediato
    this.applyTheme();
  }

  /**
   * Determina si la hora local se encuentra en periodo nocturno (19:30 a 06:30)
   */
  public isNightTime(): boolean {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    // Noche: entre las 19:30 (1170 min) y las 06:30 (390 min)
    return totalMinutes >= 1170 || totalMinutes < 390;
  }

  /**
   * Evalúa el estado actual del tema
   */
  public getThemeState(): ThemeState {
    const isNightByTime = this.isNightTime();
    const systemDark = this.mediaQuery ? this.mediaQuery.matches : true;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let isNightActive = false;
    let reason: 'local_time' | 'system_preference' | 'manual' = 'manual';

    if (this.mode === 'auto') {
      if (isNightByTime) {
        isNightActive = true;
        reason = 'local_time';
      } else if (systemDark) {
        isNightActive = true;
        reason = 'system_preference';
      } else {
        isNightActive = false;
        reason = 'local_time';
      }
    } else if (this.mode === 'night') {
      isNightActive = true;
      reason = 'manual';
    } else {
      isNightActive = false;
      reason = 'manual';
    }

    return {
      mode: this.mode,
      isNightActive,
      comfortFilterEnabled: this.comfortFilterEnabled,
      reason,
      recommendedMapLayer: isNightActive ? 'dark' : 'streets',
      timeStr,
    };
  }

  /**
   * Aplica clases al DOM (`<html>`) y notifica a los suscriptores
   */
  public applyTheme(): ThemeState {
    const state = this.getThemeState();

    if (typeof document !== 'undefined') {
      const root = document.documentElement;

      if (state.isNightActive) {
        root.classList.add('dark');
        root.classList.add('night-oled');

        if (state.comfortFilterEnabled) {
          root.classList.add('night-comfort-filter');
        } else {
          root.classList.remove('night-comfort-filter');
        }
      } else {
        // En modo diurno desactivamos OLED y filtro de luz azul
        root.classList.remove('night-oled');
        root.classList.remove('night-comfort-filter');
      }
    }

    // Notificar a componentes reactivos
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.warn('Error en listener de tema:', err);
      }
    });

    return state;
  }

  /**
   * Cambia el modo de tema ('auto', 'night', 'day')
   */
  public setMode(mode: ThemeMode) {
    this.mode = mode;
    try {
      localStorage.setItem(STORAGE_MODE_KEY, mode);
    } catch (_) {}
    this.applyTheme();
  }

  /**
   * Activa o desactiva el filtro cálido de confort visual nocturno
   */
  public setComfortFilter(enabled: boolean) {
    this.comfortFilterEnabled = enabled;
    try {
      localStorage.setItem(STORAGE_COMFORT_KEY, String(enabled));
    } catch (_) {}
    this.applyTheme();
  }

  /**
   * Suscribe un callback a cambios de estado del tema
   */
  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // Ejecutar una vez con el estado inicial
    listener(this.getThemeState());
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const themeService = new ThemeService();
