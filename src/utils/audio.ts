/**
 * CicloRadar Audio Engine
 * Sintentizador Web Audio API puro con maximizador de volumen acústico (compresor dinámico + booster de ganancia)
 * Compatible con alarmas de sistema: Radar (Apple iOS), Good Morning (Samsung Galaxy), Bright Morning (Google Pixel).
 * Sin dependencias de archivos de audio externos (cumple directriz RULE[AGENTS_md]).
 */

export type AlarmSoundId = 
  | 'radar_ios' 
  | 'good_morning_samsung' 
  | 'bright_morning_pixel' 
  | 'sirena' 
  | 'alarma' 
  | 'pitido';

export interface AlarmPresetInfo {
  id: AlarmSoundId;
  name: string;
  brand: string;
  device: string;
  description: string;
  badgeColor: string;
}

export const ALARM_PRESETS: AlarmPresetInfo[] = [
  {
    id: 'radar_ios',
    name: 'Radar',
    brand: 'Apple (iOS / iPhone)',
    device: 'iPhone / iPad',
    description: 'Golpes rítmicos percusivos de marimba en doble tono agudo característico de iOS.',
    badgeColor: 'border-zinc-500 text-zinc-300 bg-zinc-800'
  },
  {
    id: 'good_morning_samsung',
    name: 'Good Morning',
    brand: 'Samsung Galaxy',
    device: 'Galaxy S / Z / A',
    description: 'Campana brillante con arpegio alegre ascendente en Do Mayor.',
    badgeColor: 'border-blue-500/40 text-blue-400 bg-blue-500/10'
  },
  {
    id: 'bright_morning_pixel',
    name: 'Bright Morning',
    brand: 'Google Pixel (Android Puro)',
    device: 'Pixel 7 / 8 / 9',
    description: 'Kalimba y vibráfono pentatónico cálido con armónicos resonantes.',
    badgeColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
  },
  {
    id: 'sirena',
    name: 'Sirena Táctica',
    brand: 'Emergencia Urbana',
    device: 'Universal SOS',
    description: 'Barrido oscilante penetrante de alta frecuencia para exteriores y tráfico ruidoso.',
    badgeColor: 'border-red-500/40 text-red-400 bg-red-500/10'
  },
  {
    id: 'alarma',
    name: 'Alarma Industrial',
    brand: 'Bocina de Evacuación',
    device: 'Universal SOS',
    description: 'Pulsos cuadrados de alto impacto con subarmónico para máxima penetración auditiva.',
    badgeColor: 'border-orange-500/40 text-orange-400 bg-orange-500/10'
  },
  {
    id: 'pitido',
    name: 'Sonar de Alta Frecuencia',
    brand: 'Alerta Rápida',
    device: 'Universal SOS',
    description: 'Pitidos intermitentes de 1760 Hz para detección rápida a distancia.',
    badgeColor: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10'
  }
];

class AudioEngine {
  ctx: AudioContext | null = null;
  compressor: DynamicsCompressorNode | null = null;
  masterGain: GainNode | null = null;
  interval: any = null;
  vibrationInterval: any = null;
  wakeLockSentinel: any = null;
  currentSound: AlarmSoundId | null = null;
  isPlaying: boolean = false;
  activeNodes: { stop: () => void }[] = [];

  constructor() {
    // Escuchar el primer toque de pantalla para desbloquear el AudioContext de inmediato
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };
      window.addEventListener('click', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });
    }
  }

  /**
   * Inicializa la cadena de audio con compresor de dinámica y ganancia reforzada (Auto-Boost)
   */
  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }

    if (this.ctx && !this.compressor) {
      // 1. Compresor de dinámica: Eleva sonidos suaves y evita clipping distorsionado
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-24, this.ctx.currentTime); // Atrapa sonidos débiles
      this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(14, this.ctx.currentTime);     // Compresión agresiva para máxima sonoridad
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.20, this.ctx.currentTime);

      // 2. Booster de Ganancia Maestra: Multiplica la salida acústica a nivel máximo
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(2.4, this.ctx.currentTime); // Boost 240% para forzar volumen bajo

      // Conexión en cadena: Fuentes ➔ Compresor ➔ Master Gain ➔ Parlante
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }
  }

  /**
   * Asegura que el contexto esté activo
   */
  async ensureAudioContext(): Promise<boolean> {
    this.init();
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (e) {
        console.warn('AudioContext resume deferred:', e);
      }
    }
    return true;
  }

  /**
   * Activa el WakeLock de pantalla para evitar que el teléfono se suspenda o corte el audio
   */
  private async acquireWakeLock() {
    try {
      if ('wakeLock' in navigator && !this.wakeLockSentinel) {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        this.wakeLockSentinel.addEventListener('release', () => {
          this.wakeLockSentinel = null;
        });
      }
    } catch {
      // Los navegadores restringen WakeLock si la pestaña pierde foco
    }
  }

  /**
   * Inicia el patrón de vibración háptica de emergencia
   */
  private startVibration() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([600, 200, 600, 200, 900, 300]);
        this.vibrationInterval = setInterval(() => {
          if (this.isPlaying && 'vibrate' in navigator) {
            navigator.vibrate([600, 200, 600, 200, 900, 300]);
          }
        }, 2800);
      } catch {
        // Ignorar si la vibración no está disponible
      }
    }
  }

  /**
   * Configura la sesión multimedia del sistema para dar prioridad al audio de alarma
   */
  private setupMediaSession(soundTitle: string) {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: `🚨 ALERTA SOS: ${soundTitle}`,
          artist: 'CicloRadar Seguridad',
          album: 'Emergencia Ciclista',
        });
        navigator.mediaSession.playbackState = 'playing';
      } catch {
        // Silencioso si no está soportado
      }
    }
  }

  /**
   * Reproduce el tono de alarma seleccionado con maximización de volumen acústico
   */
  async play(type: string = 'radar_ios') {
    this.stop();
    await this.ensureAudioContext();
    if (!this.ctx || !this.compressor) return;

    this.isPlaying = true;
    const soundId = (type as AlarmSoundId) || 'radar_ios';
    this.currentSound = soundId;

    // Activar bloqueo de suspensión de pantalla y vibración
    this.acquireWakeLock();
    this.startVibration();

    const preset = ALARM_PRESETS.find(p => p.id === soundId);
    this.setupMediaSession(preset ? `${preset.name} (${preset.brand})` : 'Alarma Activa');

    switch (soundId) {
      case 'radar_ios':
        this.playAppleRadar();
        break;
      case 'good_morning_samsung':
        this.playSamsungGoodMorning();
        break;
      case 'bright_morning_pixel':
        this.playGooglePixelBrightMorning();
        break;
      case 'alarma':
        this.playIndustrialAlarm();
        break;
      case 'pitido':
        this.playSonarBeep();
        break;
      case 'sirena':
      default:
        this.playTacticalSiren();
        break;
    }
  }

  // =========================================================================
  // 1. RADAR (Apple iOS / iPhone)
  // Timbre de marimba percusivo con golpes dobles y cadencia rítmica sincopada
  // =========================================================================
  private playAppleRadar() {
    const playRadarCycle = () => {
      if (!this.isPlaying) return;

      // Secuencia clásica de Radar:
      // Tono 1: Si5 (987.8 Hz)
      // Tono 2: Mi6 (1318.5 Hz)
      // Tono 3: Fa#6 (1480 Hz)
      // Patrón de tiempo:
      // 0ms: Si5 + Mi6 (golpe doble 1)
      // 360ms: Si5 + Mi6 (golpe doble 2)
      // 720ms: Si5 -> Mi6 -> Fa#6 -> Mi6 (resolución rápida)
      const now = this.ctx!.currentTime;

      // Golpe 1
      this.strikeMarimba(987.8, now + 0.00, 0.14, 0.9);
      this.strikeMarimba(1318.5, now + 0.11, 0.18, 1.0);

      // Golpe 2
      this.strikeMarimba(987.8, now + 0.38, 0.14, 0.9);
      this.strikeMarimba(1318.5, now + 0.49, 0.18, 1.0);

      // Golpe 3 con resolución sincopada
      this.strikeMarimba(987.8, now + 0.76, 0.14, 0.9);
      this.strikeMarimba(1318.5, now + 0.88, 0.16, 0.95);
      this.strikeMarimba(1480.0, now + 1.02, 0.18, 1.0);
      this.strikeMarimba(1318.5, now + 1.18, 0.22, 0.9);
    };

    playRadarCycle();
    this.interval = setInterval(playRadarCycle, 1950);
  }

  /**
   * Genera el timbre característico de marimba/xilófono de Apple con fundamental + 2do/3er armónico
   */
  private strikeMarimba(freq: number, startTime: number, duration: number, gainScale: number = 1.0) {
    if (!this.ctx || !this.compressor) return;

    // Oscilador Fundamental (Onda triangular para cuerpo de madera)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, startTime);

    // Envolvente de golpe rápido y decaimiento exponencial
    gain1.gain.setValueAtTime(0.001, startTime);
    gain1.gain.linearRampToValueAtTime(1.1 * gainScale, startTime + 0.004);
    gain1.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    // Oscilador Armónico Superior (Onda senoidal para el brillo metálico del percutor)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.01, startTime);

    gain2.gain.setValueAtTime(0.001, startTime);
    gain2.gain.linearRampToValueAtTime(0.4 * gainScale, startTime + 0.003);
    gain2.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.5);

    osc1.connect(gain1);
    gain1.connect(this.compressor);

    osc2.connect(gain2);
    gain2.connect(this.compressor);

    osc1.start(startTime);
    osc1.stop(startTime + duration + 0.05);
    osc2.start(startTime);
    osc2.stop(startTime + duration + 0.05);
  }

  // =========================================================================
  // 2. GOOD MORNING (Samsung Galaxy)
  // Arpegio brillante en Do Mayor con campana de glockenspiel
  // =========================================================================
  private playSamsungGoodMorning() {
    const playSamsungCycle = () => {
      if (!this.isPlaying || !this.ctx) return;

      const now = this.ctx.currentTime;
      // Secuencia Melódica Samsung Good Morning:
      // C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.5), B5 (987.77), G5 (783.99), A5 (880), G5 (783.99)
      const notes = [
        { f: 523.25, t: 0.00, d: 0.22 },
        { f: 659.25, t: 0.16, d: 0.22 },
        { f: 783.99, t: 0.32, d: 0.24 },
        { f: 1046.5, t: 0.48, d: 0.35 },
        { f: 987.77, t: 0.72, d: 0.22 },
        { f: 783.99, t: 0.88, d: 0.22 },
        { f: 880.00, t: 1.06, d: 0.26 },
        { f: 783.99, t: 1.28, d: 0.45 },
      ];

      notes.forEach(({ f, t, d }) => {
        this.strikeBell(f, now + t, d, 0.95);
      });
    };

    playSamsungCycle();
    this.interval = setInterval(playSamsungCycle, 2100);
  }

  /**
   * Genera una campana de glockenspiel con armónico metálico (ratio 2.75x)
   */
  private strikeBell(freq: number, startTime: number, duration: number, gainScale: number = 1.0) {
    if (!this.ctx || !this.compressor) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(1.0 * gainScale, startTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    // Armónico de campana
    const chime = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chime.type = 'triangle';
    chime.frequency.setValueAtTime(freq * 2.76, startTime);

    chimeGain.gain.setValueAtTime(0.001, startTime);
    chimeGain.gain.linearRampToValueAtTime(0.35 * gainScale, startTime + 0.005);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.4);

    osc.connect(gain);
    gain.connect(this.compressor);
    chime.connect(chimeGain);
    chimeGain.connect(this.compressor);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
    chime.start(startTime);
    chime.stop(startTime + duration + 0.02);
  }

  // =========================================================================
  // 3. BRIGHT MORNING (Google Pixel / Android Puro)
  // Kalimba pentatónica suave y resonante con reverberación armónica
  // =========================================================================
  private playGooglePixelBrightMorning() {
    const playPixelCycle = () => {
      if (!this.isPlaying || !this.ctx) return;

      const now = this.ctx.currentTime;
      // Melodía Bright Morning de Pixel:
      // E5 (659.25), G#5 (830.61), B5 (987.77), E6 (1318.5), D#6 (1244.5), B5 (987.77), C#6 (1108.7)
      const notes = [
        { f: 659.25, t: 0.00, d: 0.30 },
        { f: 830.61, t: 0.18, d: 0.30 },
        { f: 987.77, t: 0.36, d: 0.32 },
        { f: 1318.5, t: 0.56, d: 0.42 },
        { f: 1244.5, t: 0.80, d: 0.30 },
        { f: 987.77, t: 1.00, d: 0.30 },
        { f: 1108.7, t: 1.22, d: 0.48 },
      ];

      notes.forEach(({ f, t, d }) => {
        this.strikeKalimba(f, now + t, d);
      });
    };

    playPixelCycle();
    this.interval = setInterval(playPixelCycle, 2200);
  }

  private strikeKalimba(freq: number, startTime: number, duration: number) {
    if (!this.ctx || !this.compressor) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    // Ataque suave pero definido con cuerpo sostenido
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(1.1, startTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    // Segundo armónico cálido
    const warmOsc = this.ctx.createOscillator();
    const warmGain = this.ctx.createGain();
    warmOsc.type = 'triangle';
    warmOsc.frequency.setValueAtTime(freq * 2.0, startTime);

    warmGain.gain.setValueAtTime(0.001, startTime);
    warmGain.gain.linearRampToValueAtTime(0.28, startTime + 0.010);
    warmGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.7);

    osc.connect(gain);
    gain.connect(this.compressor);
    warmOsc.connect(warmGain);
    warmGain.connect(this.compressor);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
    warmOsc.start(startTime);
    warmOsc.stop(startTime + duration + 0.05);
  }

  // =========================================================================
  // 4. SIRENA TÁCTICA (Wailing Siren)
  // Doble oscilador desafinado para batimiento sonoro penetrante en la calle
  // =========================================================================
  private playTacticalSiren() {
    let phase = 0;
    const sweep = () => {
      if (!this.isPlaying || !this.ctx || !this.compressor) return;
      const now = this.ctx.currentTime;
      const lowFreq = 520;
      const highFreq = 1180;
      const duration = 0.45;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sine';

      const startF = phase % 2 === 0 ? lowFreq : highFreq;
      const endF = phase % 2 === 0 ? highFreq : lowFreq;

      osc1.frequency.setValueAtTime(startF, now);
      osc1.frequency.exponentialRampToValueAtTime(endF, now + duration);

      osc2.frequency.setValueAtTime(startF * 1.01, now); // Desafinación para efecto Doppler
      osc2.frequency.exponentialRampToValueAtTime(endF * 1.01, now + duration);

      gain.gain.setValueAtTime(0.9, now);
      gain.gain.linearRampToValueAtTime(0.9, now + duration - 0.02);
      gain.gain.linearRampToValueAtTime(0.01, now + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.compressor);

      osc1.start(now);
      osc1.stop(now + duration);
      osc2.start(now);
      osc2.stop(now + duration);

      phase++;
    };

    sweep();
    this.interval = setInterval(sweep, 450);
  }

  // =========================================================================
  // 5. ALARMA INDUSTRIAL (Bocina Continua)
  // =========================================================================
  private playIndustrialAlarm() {
    const pulse = () => {
      if (!this.isPlaying || !this.ctx || !this.compressor) return;
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'square';
      osc1.frequency.setValueAtTime(880, now);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(440, now);

      gain.gain.setValueAtTime(1.1, now);
      gain.gain.setValueAtTime(1.1, now + 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.compressor);

      osc1.start(now);
      osc1.stop(now + 0.21);
      osc2.start(now);
      osc2.stop(now + 0.21);
    };

    pulse();
    this.interval = setInterval(pulse, 280);
  }

  // =========================================================================
  // 6. PITIDO SONAR (Sonar Ping de Alta Frecuencia)
  // =========================================================================
  private playSonarBeep() {
    const ping = () => {
      if (!this.isPlaying || !this.ctx || !this.compressor) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1760, now); // La6

      gain.gain.setValueAtTime(1.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.compressor);

      osc.start(now);
      osc.stop(now + 0.13);
    };

    ping();
    this.interval = setInterval(ping, 750);
  }

  /**
   * Notificación acústica de pelotón / grupo de ruta (Web Audio API puro, un solo toque)
   */
  playGroupNotification(type: 'join' | 'ping' | 'regroup' = 'ping') {
    this.init();
    if (!this.ctx || !this.compressor) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const now = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.5, now);
    masterGain.connect(this.compressor);

    if (type === 'join') {
      // Arpegio ascendente brillante C5 -> E5 -> G5
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const noteGain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        noteGain.gain.setValueAtTime(0, now + idx * 0.08);
        noteGain.gain.linearRampToValueAtTime(0.8, now + idx * 0.08 + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.22);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.23);
      });
    } else if (type === 'regroup') {
      // Tono de campana de dos acordes (silbato de pelotón)
      [880, 1174.66].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const noteGain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        noteGain.gain.setValueAtTime(0, now + idx * 0.12);
        noteGain.gain.linearRampToValueAtTime(0.9, now + idx * 0.12 + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.36);
      });
    } else {
      // Ping corto de coordinación
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      noteGain.gain.setValueAtTime(0.8, now);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(noteGain);
      noteGain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.19);
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(type === 'regroup' ? [100, 50, 100] : [60]);
      } catch {}
    }
  }

  /**
   * Detiene cualquier sonido en reproducción, libera el wake lock y apaga vibración
   */
  stop() {
    this.isPlaying = false;
    this.currentSound = null;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    if (this.vibrationInterval) {
      clearInterval(this.vibrationInterval);
      this.vibrationInterval = null;
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch {}
    }

    if (this.wakeLockSentinel) {
      try {
        this.wakeLockSentinel.release();
        this.wakeLockSentinel = null;
      } catch {}
    }

    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'none';
      } catch {}
    }
  }
}

export const audioEngine = new AudioEngine();
