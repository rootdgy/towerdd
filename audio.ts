import { TowerType } from './types';

export class AudioController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  
  // Music Sequencing
  private isPlayingMusic = false;
  private musicTimer: number | null = null;
  private currentTheme = 'Forest';
  private noteIndex = 0;

  private initialized = false;

  // Settings
  private _musicVol = 0.5;
  private _sfxVol = 0.5;

  constructor() {
    // Lazy initialization on first interaction
  }

  init() {
    if (this.initialized) return;
    try {
      const CtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new CtxClass();
      
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();

      this.masterGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);

      this.updateVolumes();
      this.initialized = true;
    } catch (e) {
      console.error("Audio init failed", e);
    }
  }

  setVolumes(music: number, sfx: number) {
    this._musicVol = music;
    this._sfxVol = sfx;
    this.updateVolumes();
  }

  private updateVolumes() {
    if (!this.ctx || !this.sfxGain || !this.musicGain) return;
    const now = this.ctx.currentTime;
    this.sfxGain.gain.setTargetAtTime(this._sfxVol, now, 0.1);
    this.musicGain.gain.setTargetAtTime(this._musicVol, now, 0.1);
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- SFX ---

  public playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1, slideTo: number | null = null) {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
    }

    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  private playNoise(duration: number, vol: number = 0.1) {
    if (!this.ctx || !this.sfxGain) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    
    // Filter for 'explosion' low pass
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start();
  }

  playShoot(type: TowerType) {
    if (!this.initialized) return;
    switch (type) {
        case TowerType.ARCHER:
            this.playTone(600, 'triangle', 0.1, 0.05); // High pluck
            break;
        case TowerType.CANNON:
            this.playNoise(0.2, 0.15); // Boom
            break;
        case TowerType.LASER:
            this.playTone(800, 'sawtooth', 0.1, 0.05, 200); // Pew
            break;
        case TowerType.SNIPER:
            this.playTone(1200, 'square', 0.05, 0.05); // Sharp crack
            break;
        case TowerType.FLAMETHROWER:
            this.playNoise(0.1, 0.05); // Hiss
            break;
        case TowerType.TESLA:
            this.playTone(200, 'sawtooth', 0.1, 0.05, 800); // Zap up
            break;
        default:
            this.playTone(440, 'sine', 0.1, 0.05);
    }
  }

  playHit() {
    if (!this.initialized) return;
    // Very quiet thud
    this.playTone(100, 'triangle', 0.05, 0.05, 50);
  }

  playBuild() {
    if (!this.initialized) return;
    // Chime up
    this.playTone(300, 'sine', 0.1, 0.1);
    setTimeout(() => this.playTone(450, 'sine', 0.1, 0.1), 100);
  }

  playSell() {
    if (!this.initialized) return;
    this.playTone(300, 'square', 0.1, 0.05, 100);
  }

  playError() {
    if (!this.initialized) return;
    this.playTone(150, 'sawtooth', 0.2, 0.1, 100);
  }

  playLevelWin() {
    if (!this.initialized) return;
    // Major Arpeggio
    [0, 100, 200, 300, 600].forEach((delay, i) => {
        setTimeout(() => {
             const freqs = [440, 554, 659, 880, 1108];
             this.playTone(freqs[i], 'triangle', 0.3, 0.1);
        }, delay);
    });
  }

  playGameOver() {
    if (!this.initialized) return;
    this.playTone(300, 'sawtooth', 1.0, 0.2, 50);
  }

  // --- Procedural Music ---

  startMusic(theme: string) {
      this.currentTheme = theme;
      if (this.isPlayingMusic) return;
      this.isPlayingMusic = true;
      this.noteIndex = 0;
      this.scheduleNextNote();
  }

  stopMusic() {
      this.isPlayingMusic = false;
      if (this.musicTimer) window.clearTimeout(this.musicTimer);
  }

  private scheduleNextNote() {
      if (!this.isPlayingMusic || !this.ctx || !this.musicGain) return;
      
      const tempo = this.currentTheme === 'Volcano' ? 150 : (this.currentTheme === 'Desert' ? 250 : 300);
      
      // Simple procedural scales
      let freqs: number[] = [];
      
      if (this.currentTheme === 'Forest') {
          // C Major Pentatonic-ish
          freqs = [261.63, 293.66, 329.63, 392.00, 440.00]; 
      } else if (this.currentTheme === 'Desert') {
          // Phrygian Dominant-ish
          freqs = [220.00, 233.08, 277.18, 293.66, 329.63, 349.23];
      } else {
          // Volcano - Diminished / Dissonant
          freqs = [110.00, 116.54, 146.83, 155.56, 185.00];
      }

      // Random melody walker
      const freq = freqs[Math.floor(Math.random() * freqs.length)];
      // Occasional bass note
      const finalFreq = Math.random() > 0.8 ? freq / 2 : freq;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = this.currentTheme === 'Forest' ? 'sine' : (this.currentTheme === 'Desert' ? 'triangle' : 'sawtooth');
      
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(finalFreq, now);
      
      const volume = this.currentTheme === 'Forest' ? 0.1 : 0.05;
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.musicGain);
      
      osc.start(now);
      osc.stop(now + 1.0);

      this.musicTimer = window.setTimeout(() => this.scheduleNextNote(), tempo);
  }
}