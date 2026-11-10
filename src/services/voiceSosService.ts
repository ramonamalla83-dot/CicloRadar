/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { audioEngine } from '../utils/audio';

export interface VoiceSosStatus {
  isSupported: boolean;
  isEnabled: boolean;
  isListening: boolean;
  hasPermission: boolean | null;
  lastPhrase: string | null;
  lastTriggerAt: number | null;
  errorMessage: string | null;
}

type TriggerCallback = (detectedPhrase: string) => void;

const STORAGE_VOICE_SOS_KEY = 'cicloradar_voice_sos_enabled_v1';

class VoiceSosService {
  private recognition: any = null;
  private isSupported: boolean = false;
  private isEnabled: boolean = true;
  private isListening: boolean = false;
  private hasPermission: boolean | null = null;
  private lastPhrase: string | null = null;
  private lastTriggerAt: number | null = null;
  private errorMessage: string | null = null;
  private listeners: Set<() => void> = new Set();
  private triggerCallbacks: Set<TriggerCallback> = new Set();
  private restartTimer: any = null;
  private shouldKeepListening: boolean = false;

  constructor() {
    this.checkSupport();
    this.loadSettings();

    if (typeof window !== 'undefined') {
      // Monitorear cuando la app entra o sale de primer plano
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
      window.addEventListener('focus', this.handleFocus.bind(this));
      window.addEventListener('blur', this.handleBlur.bind(this));
    }
  }

  private checkSupport() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.isSupported = !!SpeechRecognition;
    }
  }

  private loadSettings() {
    try {
      const stored = localStorage.getItem(STORAGE_VOICE_SOS_KEY);
      // Por defecto activado para máxima seguridad del ciclista en marcha
      this.isEnabled = stored !== null ? stored === 'true' : true;
    } catch (_) {
      this.isEnabled = true;
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem(STORAGE_VOICE_SOS_KEY, String(this.isEnabled));
    } catch (_) {}
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public onSosTrigger(callback: TriggerCallback): () => void {
    this.triggerCallbacks.add(callback);
    return () => {
      this.triggerCallbacks.delete(callback);
    };
  }

  public getStatus(): VoiceSosStatus {
    return {
      isSupported: this.isSupported,
      isEnabled: this.isEnabled,
      isListening: this.isListening,
      hasPermission: this.hasPermission,
      lastPhrase: this.lastPhrase,
      lastTriggerAt: this.lastTriggerAt,
      errorMessage: this.errorMessage,
    };
  }

  /**
   * Alterna la activación del comando de voz
   */
  public toggleEnabled(force?: boolean): boolean {
    const next = force !== undefined ? force : !this.isEnabled;
    this.isEnabled = next;
    this.saveSettings();

    if (next) {
      this.startListening();
    } else {
      this.stopListening();
    }

    this.notify();
    return this.isEnabled;
  }

  /**
   * Inicia la escucha continua en primer plano
   */
  public startListening(): boolean {
    if (!this.isSupported || !this.isEnabled) {
      return false;
    }

    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      // No escuchar en segundo plano para ahorrar batería y respetar privacidad
      return false;
    }

    this.shouldKeepListening = true;

    if (this.recognition && this.isListening) {
      return true;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        this.isSupported = false;
        this.notify();
        return false;
      }

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'es-ES'; // Optimizado para español (acepta modismos latinos y de España)
      rec.maxAlternatives = 3;

      rec.onstart = () => {
        this.isListening = true;
        this.hasPermission = true;
        this.errorMessage = null;
        this.notify();
      };

      rec.onresult = (event: any) => {
        this.handleSpeechResult(event);
      };

      rec.onerror = (event: any) => {
        const err = event.error;
        if (err === 'not-allowed' || err === 'permission-denied') {
          this.hasPermission = false;
          this.errorMessage = 'Permiso de micrófono no concedido';
          this.shouldKeepListening = false;
          this.isListening = false;
        } else if (err === 'no-speech') {
          // Normal cuando el ciclista rueda en silencio
        } else if (err === 'aborted') {
          // Aborto manual
        } else {
          this.errorMessage = `Nota de voz: ${err}`;
        }
        this.notify();
      };

      rec.onend = () => {
        this.isListening = false;
        this.notify();

        // Reinicio automático inmediato si la app sigue en primer plano y debe escuchar
        if (this.shouldKeepListening && this.isEnabled && typeof document !== 'undefined' && document.visibilityState === 'visible') {
          if (this.restartTimer) clearTimeout(this.restartTimer);
          this.restartTimer = setTimeout(() => {
            if (this.shouldKeepListening && this.isEnabled && document.visibilityState === 'visible') {
              this.startListening();
            }
          }, 300);
        }
      };

      this.recognition = rec;
      rec.start();
      return true;
    } catch (e: any) {
      console.warn('Error inicializando SpeechRecognition:', e);
      this.isListening = false;
      this.errorMessage = e?.message || 'No se pudo iniciar el micrófono';
      this.notify();
      return false;
    }
  }

  /**
   * Detiene la escucha de voz
   */
  public stopListening() {
    this.shouldKeepListening = false;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (_) {}
      this.recognition = null;
    }

    this.isListening = false;
    this.notify();
  }

  private handleVisibilityChange() {
    if (typeof document === 'undefined') return;

    if (document.visibilityState === 'visible') {
      // Reanudar escucha en primer plano
      if (this.isEnabled) {
        this.startListening();
      }
    } else {
      // Pausar inmediatamente cuando pasa a segundo plano
      if (this.recognition) {
        try {
          this.recognition.stop();
        } catch (_) {}
      }
      this.isListening = false;
      this.notify();
    }
  }

  private handleFocus() {
    if (this.isEnabled && !this.isListening && typeof document !== 'undefined' && document.visibilityState === 'visible') {
      this.startListening();
    }
  }

  private handleBlur() {
    // Si la ventana pierde el foco, pausar
  }

  /**
   * Analiza el texto capturado para detectar 'CicloRadar SOS'
   */
  private handleSpeechResult(event: any) {
    let combinedTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const result = event.results[i];
      if (result && result[0]) {
        combinedTranscript += ' ' + result[0].transcript;
      }
    }

    const normalized = this.normalizeText(combinedTranscript);
    if (!normalized) return;

    this.lastPhrase = normalized;
    this.notify();

    // Verificación de patrones del comando de voz
    if (this.isSosPhrase(normalized)) {
      this.triggerSos(normalized);
    }
  }

  /**
   * Normaliza texto: minúsculas, sin tildes ni caracteres especiales
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Elimina tildes
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Comprueba si el texto coincide con 'CicloRadar SOS' o variantes de emergencia
   */
  private isSosPhrase(text: string): boolean {
    // 1. Comando exacto principal: "cicloradar sos" / "ciclo radar sos"
    if (
      text.includes('cicloradar sos') ||
      text.includes('ciclo radar sos') ||
      text.includes('ciclo radar s o s') ||
      text.includes('cicloradar s o s')
    ) {
      return true;
    }

    // 2. Mención de CicloRadar + auxilio / socorro / emergencia
    const mentionsApp = text.includes('cicloradar') || text.includes('ciclo radar') || text.includes('radar');
    const mentionsEmergency = 
      text.includes('sos') || 
      text.includes('emergencia') || 
      text.includes('auxilio') || 
      text.includes('socorro') || 
      text.includes('ayuda me cai') ||
      text.includes('alerta roja');

    if (mentionsApp && mentionsEmergency) {
      return true;
    }

    return false;
  }

  /**
   * Ejecuta el disparo de emergencia por voz
   */
  public triggerSos(detectedPhrase: string = 'CicloRadar SOS') {
    const now = Date.now();
    // Prevenir disparos duplicados en menos de 8 segundos
    if (this.lastTriggerAt && now - this.lastTriggerAt < 8000) {
      return;
    }

    this.lastTriggerAt = now;
    this.lastPhrase = detectedPhrase;

    // 1. Sonido acústico de confirmación de comando reconocido + vibración táctil
    try {
      this.playVoiceRecognitionChime();
    } catch (_) {}

    // 2. Notificar a los suscriptores y componentes escuchando
    this.triggerCallbacks.forEach((cb) => {
      try {
        cb(detectedPhrase);
      } catch (err) {
        console.error('Error ejecutando callback de SOS por voz:', err);
      }
    });

    this.notify();
  }

  /**
   * Emite un tono percusivo agudo y vibración para alertar al ciclista que el comando fue detectado
   */
  private playVoiceRecognitionChime() {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        // Tres notas de alarma ascendentes (La5 -> Re6 -> La6)
        const freqs = [880, 1174, 1760];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          gain.gain.setValueAtTime(0.01, now + idx * 0.08);
          gain.gain.linearRampToValueAtTime(0.35, now + idx * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.07);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.08);
        });
      } catch (_) {}
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200, 100, 400]);
      } catch (_) {}
    }
  }
}

export const voiceSosService = new VoiceSosService();
