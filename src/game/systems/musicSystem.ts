import type { Scene } from "phaser";

const MENU_MUSIC_KEY = "music-menu";
const GAME_MUSIC_KEY = "music-game";
const MUSIC_VOLUME = 0.45;
const EFFECT_VOLUME = 0.72;
const LEVEL_UP_EFFECT_KEY = "effect-level-up";
const REWARD_EFFECT_KEY = "effect-reward";

type MusicTrack = "menu" | "game";
type SoundEffect = "levelUp" | "reward";

const MUSIC_ASSETS: Record<MusicTrack, { key: string; path: string }> = {
  menu: {
    key: MENU_MUSIC_KEY,
    path: "sounds/music/Server Drift Intro.mp3",
  },
  game: {
    key: GAME_MUSIC_KEY,
    path: "sounds/music/Server Drones Game.mp3",
  },
};

const EFFECT_ASSETS: Record<SoundEffect, { key: string; path: string }> = {
  levelUp: {
    key: LEVEL_UP_EFFECT_KEY,
    path: "sounds/effects/level-up.mp3",
  },
  reward: {
    key: REWARD_EFFECT_KEY,
    path: "sounds/effects/reward.mp3",
  },
};

export const preloadMusic = (scene: Scene) => {
  Object.values(MUSIC_ASSETS).forEach(({ key, path }) => {
    scene.load.audio(key, path);
  });
  Object.values(EFFECT_ASSETS).forEach(({ key, path }) => {
    scene.load.audio(key, path);
  });
};

export class MusicController {
  private currentTrack: MusicTrack | null = null;
  private currentSound: Phaser.Sound.BaseSound | null = null;

  constructor(private readonly scene: Scene) {}

  play(track: MusicTrack) {
    if (this.currentTrack === track && this.currentSound?.isPlaying) {
      return;
    }

    this.stop();

    const { key } = MUSIC_ASSETS[track];
    this.currentTrack = track;
    this.currentSound = this.scene.sound.add(key, {
      loop: true,
      volume: MUSIC_VOLUME,
    });
    this.currentSound.play();
  }

  stop() {
    this.currentSound?.stop();
    this.currentSound?.destroy();
    this.currentSound = null;
    this.currentTrack = null;
  }

  pause() {
    this.currentSound?.pause();
  }

  resume() {
    this.currentSound?.resume();
  }

  playEffect(effect: SoundEffect) {
    this.scene.sound.play(EFFECT_ASSETS[effect].key, {
      volume: EFFECT_VOLUME,
    });
  }
}
