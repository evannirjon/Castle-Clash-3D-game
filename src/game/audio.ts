// Procedural Web Audio API synthesizer for medieval background music and weight-scaled sound effects

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted = false;
  private musicInterval: number | null = null;
  private musicStep = 0;
  private isPlayingMusic = false;

  private ensureContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.stopMusic();
    } else if (this.isPlayingMusic) {
      this.startMusic();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public startMusic(): void {
    this.isPlayingMusic = true;
    if (this.isMuted) return;
    if (this.musicInterval !== null) return;

    // Rich Dorian medieval scale (D3, E3, F3, G3, A3, B3, C4, D4, E4, F4, G4, A4)
    const melodyNotes = [
      146.83, 164.81, 174.61, 196.0, 220.0, 246.94, 261.63, 293.66, 329.63, 349.23, 392.0, 440.0,
    ];
    // 32-step heroic medieval ballad melody
    const pattern = [
      0, 4, 7, 8, 9, 8, 7, 4,
      3, 6, 7, 9, 10, 9, 7, 4,
      0, 4, 7, 11, 10, 9, 8, 7,
      6, 4, 3, 2, 0, 4, 7, 4,
    ];
    const bassNotes = [73.42, 73.42, 65.41, 87.31, 73.42, 98.0, 87.31, 65.41];

    this.musicInterval = window.setInterval(() => {
      if (this.isMuted || !this.isPlayingMusic) return;
      const ctx = this.ensureContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const step = this.musicStep;
      const idx = pattern[step % pattern.length];
      const freq = melodyNotes[idx];

      // 1. Plucked Medieval Lute / Harp Lead
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.042, now + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.34);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);

      // 2. Warm Royal Horn / Strings Fifth Harmony on every 2nd beat
      if (step % 2 === 0) {
        const harmOsc = ctx.createOscillator();
        const harmGain = ctx.createGain();
        harmOsc.type = 'sine';
        const bassFreq = bassNotes[Math.floor(step / 4) % bassNotes.length];
        harmOsc.frequency.setValueAtTime(bassFreq * 1.5, now);

        harmGain.gain.setValueAtTime(0.001, now);
        harmGain.gain.linearRampToValueAtTime(0.028, now + 0.05);
        harmGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.48);

        harmOsc.connect(harmGain);
        harmGain.connect(ctx.destination);
        harmOsc.start(now);
        harmOsc.stop(now + 0.5);
      }

      // 3. Deep War-Drum & Marching Cadence
      if (step % 4 === 0 || step % 4 === 2) {
        const isDownbeat = step % 4 === 0;
        const drumOsc = ctx.createOscillator();
        const drumGain = ctx.createGain();
        drumOsc.type = 'sine';
        drumOsc.frequency.setValueAtTime(isDownbeat ? 96 : 68, now);
        drumOsc.frequency.exponentialRampToValueAtTime(32, now + 0.17);

        drumGain.gain.setValueAtTime(isDownbeat ? 0.058 : 0.032, now);
        drumGain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

        drumOsc.connect(drumGain);
        drumGain.connect(ctx.destination);
        drumOsc.start(now);
        drumOsc.stop(now + 0.21);
      }

      this.musicStep++;
    }, 240);
  }

  public stopMusic(): void {
    this.isPlayingMusic = false;
    if (this.musicInterval !== null) {
      window.clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  // Light pitch-varied events (±8%)
  private pitchJitter(base: number): number {
    return base * (0.92 + Math.random() * 0.16);
  }

  public playSwordSwing(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(this.pitchJitter(320), now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.09);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  public playBowRelease(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(this.pitchJitter(540), now);
    osc.frequency.exponentialRampToValueAtTime(210, now + 0.08);

    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.095);
  }

  public playHit(heavy = false): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = heavy ? 'square' : 'triangle';
    osc.frequency.setValueAtTime(this.pitchJitter(heavy ? 140 : 210), now);
    osc.frequency.exponentialRampToValueAtTime(heavy ? 42 : 75, now + (heavy ? 0.16 : 0.09));

    gain.gain.setValueAtTime(heavy ? 0.11 : 0.065, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (heavy ? 0.17 : 0.1));

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + (heavy ? 0.18 : 0.11));
  }

  public playSiegeBoom(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.32);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playDeploy(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(330, now);
    osc.frequency.setValueAtTime(440, now + 0.05);

    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playHeroSkill(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [293.66, 369.99, 440, 587.33];
    notes.forEach((n, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n, now + i * 0.045);
      gain.gain.setValueAtTime(0.08, now + i * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.045 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.045);
      osc.stop(now + i * 0.045 + 0.26);
    });
  }

  public playDragonRoar(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(165, now);
    osc1.frequency.exponentialRampToValueAtTime(52, now + 0.65);
    osc2.frequency.setValueAtTime(110, now);
    osc2.frequency.exponentialRampToValueAtTime(38, now + 0.65);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.68);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.7);
    osc2.stop(now + 0.7);
  }

  public playPurchase(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.08, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.2);
    });
  }

  public playVictory(isHighScore = false): void {
    this.stopMusic();
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const fanfare = isHighScore
      ? [293.66, 369.99, 440, 587.33, 739.99, 880]
      : [293.66, 369.99, 440, 587.33];
    fanfare.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.11);
      gain.gain.setValueAtTime(0.11, now + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.11);
      osc.stop(now + idx * 0.11 + 0.48);
    });
  }

  public playFireworkBurst(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(this.pitchJitter(680), now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.22);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playDefeat(): void {
    this.stopMusic();
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [246.94, 220.0, 196.0, 146.83].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.16);
      gain.gain.setValueAtTime(0.08, now + idx * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.16 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.16);
      osc.stop(now + idx * 0.16 + 0.42);
    });
  }
}

export const soundEngine = new SoundEngine();
