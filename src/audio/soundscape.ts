/**
 * Ambient Gallery Soundscape using Web Audio API
 * Generates an ethereal, warm, museum acoustic hum with gentle melodic resonances.
 * No external asset dependency or network delay.
 */

class SoundscapeManager {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private masterGain: GainNode | null = null;
  private nodes: (OscillatorNode | GainNode | BiquadFilterNode)[] = [];
  private chimeTimer: number | null = null;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    } catch (e) {
      console.warn('Web Audio not supported', e);
    }
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.pause();
      return false;
    } else {
      this.play();
      return true;
    }
  }

  public play() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isPlaying) return;
    this.isPlaying = true;

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.masterGain.gain.exponentialRampToValueAtTime(0.35, this.ctx.currentTime + 3);
    this.masterGain.connect(this.ctx.destination);

    // Warm Low Drone (Acoustic room resonance)
    const baseFreqs = [110, 164.81, 220, 329.63]; // A major 9th chord
    baseFreqs.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, this.ctx.currentTime);

      // Very soft gain
      gain.gain.setValueAtTime(0.04 / (idx + 1), this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      this.nodes.push(osc, gain, filter);
    });

    // Random soft acoustic chimes
    this.scheduleChime();
  }

  private scheduleChime() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    const delay = Math.random() * 4000 + 3500;
    this.chimeTimer = window.setTimeout(() => {
      this.triggerChime();
      this.scheduleChime();
    }, delay);
  }

  public triggerChime(pitchMultiplier = 1.0) {
    if (!this.ctx || !this.masterGain || !this.isPlaying) return;

    const pentatonic = [440, 493.88, 554.37, 659.25, 739.99, 880];
    const freq = pentatonic[Math.floor(Math.random() * pentatonic.length)] * pitchMultiplier;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, this.ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 2.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 3.0);
  }

  public pause() {
    if (!this.ctx || !this.isPlaying) return;
    this.isPlaying = false;

    if (this.chimeTimer) {
      clearTimeout(this.chimeTimer);
      this.chimeTimer = null;
    }

    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
      this.masterGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);
      setTimeout(() => {
        this.nodes.forEach(node => {
          if ('stop' in node) {
            try { (node as OscillatorNode).stop(); } catch { /* ignore */ }
          }
          node.disconnect();
        });
        this.nodes = [];
      }, 1300);
    }
  }

  public getStatus() {
    return this.isPlaying;
  }
}

export const soundscape = new SoundscapeManager();
