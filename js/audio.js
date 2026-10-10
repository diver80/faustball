/**
 * SoundEngine - 100% Procedural Web Audio API Sound Synthesizer for Faustball
 *
 * Zero external audio files required - works offline with instant loading.
 * Features:
 * - Fist strike & smash punches (procedural oscillator + impact noise transient)
 * - Grass turf bounce thud
 * - Center ribbon tape ping
 * - Authentic dual-tone modulated referee whistle
 * - Stadium crowd applause & cheers
 * - Point scored arpeggio
 * - World Championship trophy fanfare
 * - Bavarian Biergarten brass oompah chiptune riff
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.masterVolume = 0.35;
    this.oompahPlaying = false;
    this.oompahTimers = [];
  }

  /**
   * Lazily initialize or resume AudioContext on user interaction
   */
  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        try {
          this.ctx = new AudioCtxClass();
        } catch (e) {
          this.ctx = null;
        }
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Toggle mute on/off
   * @returns {boolean} New muted state
   */
  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopBiergartenOompah();
    }
    return this.muted;
  }

  /**
   * Helper to create noise buffer for physical punch impact or crowd cheers
   */
  _createNoiseBuffer(duration = 0.1) {
    if (!this.ctx) return null;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * Fist impact sound on the ball (forearm dig, set, or hammer spike)
   * @param {boolean} [isSpike=false]
   */
  playPunch(isSpike = false) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Tonal body with pitch drop
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = isSpike ? 'sawtooth' : 'triangle';

    const startFreq = isSpike ? 320 : 180;
    const endFreq = isSpike ? 55 : 42;
    const duration = isSpike ? 0.18 : 0.11;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    const peakVol = isSpike ? this.masterVolume * 0.9 : this.masterVolume * 0.65;
    oscGain.gain.setValueAtTime(peakVol, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);

    // 2. Physical impact noise snap
    const noiseBuffer = this._createNoiseBuffer(duration * 0.7);
    if (noiseBuffer) {
      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isSpike ? 3500 : 1800, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + duration * 0.7);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(this.masterVolume * 0.4, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.7);

      noiseNode.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noiseNode.start(now);
    }
  }

  /**
   * Grass turf bounce sound (low frequency damp thud)
   * @param {number} [vy=200]
   */
  playBounce(vy = 200) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.08);

    const intensity = Math.min(1.0, Math.max(0.3, Math.abs(vy) / 400));
    gain.gain.setValueAtTime(this.masterVolume * 0.5 * intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * Ribbon net hit (metallic/resonant tape ping)
   */
  playRibbonHit() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(440, now + 0.16);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1320, now);
    osc2.frequency.exponentialRampToValueAtTime(660, now + 0.16);

    gain.gain.setValueAtTime(this.masterVolume * 0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.18);
    osc2.stop(now + 0.18);
  }

  /**
   * Authentic referee whistle (dual oscillator trill modulated at 35Hz)
   */
  playWhistle() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 0.38;

    // Dual frequencies typical of European referee whistles
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'square';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(2850, now);
    osc2.frequency.setValueAtTime(3120, now);

    // LFO for the iconic pea-whistle trill flutter
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(38, now); // 38Hz trill
    lfoGain.gain.setValueAtTime(140, now);

    lfo.connect(osc1.frequency);
    lfo.connect(osc2.frequency);

    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(this.masterVolume * 0.35, now + 0.04);
    masterGain.gain.setValueAtTime(this.masterVolume * 0.35, now + duration - 0.06);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Filter to soften the square wave harshness
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4500, now);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(this.ctx.destination);

    lfo.start(now);
    osc1.start(now);
    osc2.start(now);

    lfo.stop(now + duration);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  }

  /**
   * Stadium crowd applause and cheer burst
   */
  playCheer() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 1.1;

    const noiseBuffer = this._createNoiseBuffer(duration);
    if (!noiseBuffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.linearRampToValueAtTime(1400, now + 0.5);
    filter.frequency.linearRampToValueAtTime(700, now + duration);
    filter.Q.setValueAtTime(1.2, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(this.masterVolume * 0.45, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  /**
   * Uplifting 3-note arpeggio when a point is scored
   */
  playPointScored() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(this.masterVolume * 0.4, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.24);
    });
  }

  /**
   * Tournament victory fanfare
   */
  playFanfare() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    // Fanfare melody: C4, G4, C5, E5, G5
    const melody = [
      { f: 261.63, d: 0.12 },
      { f: 392.00, d: 0.12 },
      { f: 523.25, d: 0.15 },
      { f: 659.25, d: 0.15 },
      { f: 783.99, d: 0.45 }
    ];

    let t = this.ctx.currentTime;
    melody.forEach(note => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note.f, t);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, t);

      gain.gain.setValueAtTime(this.masterVolume * 0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + note.d + 0.05);

      t += note.d + 0.03;
    });
  }

  /**
   * Stop Biergarten oompah loop
   */
  stopBiergartenOompah() {
    this.oompahPlaying = false;
    this.oompahTimers.forEach(id => clearTimeout(id));
    this.oompahTimers = [];
  }

  /**
   * Bavarian brass oompah chiptune riff (Tuba root/fifth + brass chords)
   */
  playBiergartenOompah() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    this.stopBiergartenOompah();
    this.oompahPlaying = true;

    // Riff: Tuba on beat 1 (C2) & 3 (G2), Brass chord on beats 2 & 4
    const tempo = 124;
    const beatSec = 60 / tempo;
    const startTime = this.ctx.currentTime + 0.05;

    const playBassNote = (freq, time, dur) => {
      if (!this.ctx || this.muted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(this.masterVolume * 0.45, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + dur + 0.02);
    };

    const playBrassChord = (freqs, time, dur) => {
      if (!this.ctx || this.muted) return;
      freqs.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, time);

        gain.gain.setValueAtTime(this.masterVolume * 0.16, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(time);
        osc.stop(time + dur + 0.02);
      });
    };

    // 2-measure Bavarian polka phrase
    // Measure 1: C major (Bass: C2, Chord: E3+G3+C4, Bass: G2, Chord)
    // Measure 2: G7 to C (Bass: G2, Chord: F3+G3+B3, Bass: C2, Chord: E3+G3+C4)
    const sequence = [
      { type: 'bass', freq: 65.41, t: 0 },
      { type: 'chord', freqs: [164.81, 196.00, 261.63], t: 0.5 },
      { type: 'bass', freq: 98.00, t: 1.0 },
      { type: 'chord', freqs: [164.81, 196.00, 261.63], t: 1.5 },
      { type: 'bass', freq: 98.00, t: 2.0 },
      { type: 'chord', freqs: [174.61, 196.00, 246.94], t: 2.5 },
      { type: 'bass', freq: 65.41, t: 3.0 },
      { type: 'chord', freqs: [164.81, 196.00, 261.63], t: 3.5 }
    ];

    sequence.forEach(step => {
      const stepTime = startTime + step.t * beatSec;
      if (step.type === 'bass') {
        playBassNote(step.freq, stepTime, beatSec * 0.42);
      } else {
        playBrassChord(step.freqs, stepTime, beatSec * 0.32);
      }
    });
  }
}

// Browser export
if (typeof window !== 'undefined') {
  window.SoundEngine = SoundEngine;
  window.soundEngine = new SoundEngine();
} else if (typeof globalThis !== 'undefined') {
  globalThis.SoundEngine = SoundEngine;
}

// Node.js CommonJS export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SoundEngine };
}
