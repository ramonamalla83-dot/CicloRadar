class AudioEngine {
  ctx: AudioContext | null = null;
  interval: NodeJS.Timeout | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  play(type: string) {
    this.stop();
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (type === 'sirena') {
      let isHigh = false;
      this.beep(400, 0.4, 'sine');
      this.interval = setInterval(() => {
        isHigh = !isHigh;
        this.beep(isHigh ? 800 : 400, 0.4, 'sine');
      }, 400);
    } else if (type === 'alarma') {
      this.beep(1000, 0.2, 'square');
      this.interval = setInterval(() => {
        this.beep(1000, 0.2, 'square');
      }, 300);
    } else if (type === 'pitido') {
      this.beep(600, 0.1, 'triangle');
      this.interval = setInterval(() => {
        this.beep(600, 0.1, 'triangle');
      }, 800);
    }
  }

  beep(freq: number, duration: number, type: OscillatorType) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

export const audioEngine = new AudioEngine();
