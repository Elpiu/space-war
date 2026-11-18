// Audio senza preload: la musica va in streaming con <audio>, gli effetti
// brevi sono sintetizzati con WebAudio (zero file da scaricare).

type Track = "menu" | "game";
export type Sfx =
  | "shoot"
  | "hit"
  | "kill"
  | "hurt"
  | "dash"
  | "boom"
  | "gem"
  | "coin"
  | "deploy"
  | "alarm"
  | "shield"
  | "zap"
  | "levelUp"
  | "reward";

const base = import.meta.env.BASE_URL;
const TRACKS: Record<Track, string> = {
  menu: `${base}sounds/music/menu.mp3`,
  game: `${base}sounds/music/game.mp3`,
};
const SAMPLES: Partial<Record<Sfx, string>> = {
  levelUp: `${base}sounds/effects/level-up.mp3`,
  reward: `${base}sounds/effects/reward.mp3`,
};

const MIN_GAP: Partial<Record<Sfx, number>> = { shoot: 70, hit: 45, gem: 40, coin: 60, kill: 35, zap: 80 };

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: HTMLAudioElement | null = null;
  private track: Track | null = null;
  private last = new Map<Sfx, number>();
  private samples = new Map<Sfx, HTMLAudioElement>();
  muted = false;

  /** Va chiamato dopo un gesto dell'utente (policy autoplay dei browser). */
  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.35;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    if (this.music && this.music.paused && !this.muted) void this.music.play().catch(() => undefined);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.35;
    if (this.music) this.music.muted = muted;
  }

  playMusic(track: Track) {
    if (this.track === track && this.music) {
      if (this.music.paused && !this.muted) void this.music.play().catch(() => undefined);
      return;
    }
    this.music?.pause();
    const el = new Audio(TRACKS[track]);
    el.loop = true;
    el.volume = 0.4;
    el.muted = this.muted;
    el.preload = "auto";
    this.music = el;
    this.track = track;
    void el.play().catch(() => undefined);
  }

  pauseMusic() {
    this.music?.pause();
  }

  resumeMusic() {
    if (this.music && !this.muted) void this.music.play().catch(() => undefined);
  }

  play(sfx: Sfx) {
    if (this.muted) return;
    const now = performance.now();
    const gap = MIN_GAP[sfx] ?? 0;
    if (gap && now - (this.last.get(sfx) ?? 0) < gap) return;
    this.last.set(sfx, now);

    const sample = SAMPLES[sfx];
    if (sample) {
      let el = this.samples.get(sfx);
      if (!el) {
        el = new Audio(sample);
        el.volume = 0.6;
        this.samples.set(sfx, el);
      }
      el.currentTime = 0;
      void el.play().catch(() => undefined);
      return;
    }

    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;

    switch (sfx) {
      case "shoot": return this.tone("square", 880, 520, 0.05, 0.07, t);
      case "hit": return this.tone("triangle", 320, 180, 0.04, 0.12, t);
      case "kill": this.noise(0.12, 0.25, 1800, t); return this.tone("sine", 240, 60, 0.12, 0.2, t);
      case "hurt": this.noise(0.25, 0.5, 900, t); return this.tone("sawtooth", 160, 60, 0.25, 0.3, t);
      case "dash": return this.noiseSweep(0.18, 0.28, 600, 3200, t);
      case "boom": this.noise(0.45, 0.6, 700, t); return this.tone("sine", 110, 30, 0.45, 0.5, t);
      case "gem": return this.tone("sine", 1200 + Math.random() * 400, 1800, 0.06, 0.08, t);
      case "coin": this.tone("square", 1320, 1320, 0.05, 0.05, t); return this.tone("square", 1760, 1760, 0.08, 0.05, t + 0.05);
      case "deploy": return this.tone("triangle", 300, 900, 0.14, 0.2, t);
      case "shield": return this.tone("sine", 600, 1400, 0.25, 0.22, t);
      case "zap": return this.noiseSweep(0.12, 0.2, 4000, 1200, t);
      case "alarm":
        for (let i = 0; i < 3; i += 1) this.tone("sawtooth", 440, 330, 0.22, 0.18, t + i * 0.3);
        return;
      default:
        return;
    }
  }

  private tone(type: OscillatorType, from: number, to: number, dur: number, vol: number, t: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(this.master!);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noiseBuffer: AudioBuffer | null = null;

  private noiseSource(dur: number) {
    const ctx = this.ctx!;
    if (!this.noiseBuffer) {
      this.noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = dur > 1;
    return src;
  }

  private noise(dur: number, vol: number, cutoff: number, t: number) {
    this.noiseSweep(dur, vol, cutoff, cutoff * 0.3, t);
  }

  private noiseSweep(dur: number, vol: number, from: number, to: number, t: number) {
    const ctx = this.ctx!;
    const src = this.noiseSource(dur);
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(from, t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, to), t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(gain).connect(this.master!);
    src.start(t);
    src.stop(t + dur + 0.02);
  }
}

export const audio = new AudioEngine();
