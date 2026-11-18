import { DIFFICULTIES, LIMITS, WAVE } from "../config";
import { SPAWNABLE } from "../data/enemies";
import type { GameScene } from "../scenes/GameScene";
import type { AffixId, EnemyId } from "../types";
import { clamp, pick, pickWeighted, rand, randInt } from "../utils";
import { hitsAsteroid } from "./arena";
import { spawnEnemy } from "./enemies";

const AFFIX_IDS: AffixId[] = ["swift", "armored", "splitter"];

/** Regia delle wave del survival: ritmo degli spawn, eventi orda e boss. */
export class Director {
  private nextSpawn = 0;

  constructor(private readonly g: GameScene) {}

  update() {
    const { g } = this;
    const run = g.run;

    if (run.inBreak) {
      if (g.now >= run.nextWaveAt) this.startWave();
      return;
    }

    const bossAlive = g.enemies.some((e) => e.def.id === "boss" && !e.dead);
    if (run.event === "boss" ? !bossAlive : g.now >= run.waveEndsAt) {
      this.endWave();
      return;
    }

    if (g.now >= this.nextSpawn) this.spawnTick();
  }

  private startWave() {
    const { g } = this;
    const run = g.run;
    run.wave += 1;
    run.inBreak = false;
    run.waveEndsAt = g.now + WAVE.duration;
    run.event =
      run.wave % WAVE.bossEvery === 0 ? "boss" : run.wave % WAVE.bossEvery === WAVE.hordeOffset ? "horde" : "normal";
    this.nextSpawn = g.now + 300;

    if (run.event === "boss") {
      const p = this.spawnPoint(560);
      const boss = spawnEnemy(g, "boss", p.x, p.y);
      g.onBossSpawned(boss);
    } else if (run.event === "horde") {
      g.banner(`WAVE ${run.wave}`, "Orda in arrivo: tieniti libero un varco!", "warning");
      const count = 14 + run.wave;
      for (let i = 0; i < count; i += 1) {
        const a = (i / count) * Math.PI * 2;
        const x = clamp(g.player.x + Math.cos(a) * 560, 40, g.arena.width - 40);
        const y = clamp(g.player.y + Math.sin(a) * 560, 40, g.arena.height - 40);
        spawnEnemy(g, "swarm", x, y);
      }
    } else {
      g.banner(`WAVE ${run.wave}`, run.wave === 1 ? "Sopravvivi." : "");
    }
  }

  private endWave() {
    const { g } = this;
    const run = g.run;
    run.inBreak = true;
    run.nextWaveAt = g.now + WAVE.breakDuration;
    run.hp = Math.min(run.stats.maxHp, run.hp + 1);
    g.toast(`Wave ${run.wave} superata · +1 HP`, "heart", "good");
  }

  private spawnTick() {
    const { g } = this;
    const run = g.run;
    const density = DIFFICULTIES[run.difficulty].density;
    const boss = run.event === "boss";
    const interval = Math.max(240, 1250 - run.wave * 55) / density;
    const cap = Math.min(LIMITS.maxEnemies, (14 + run.wave * 7) * density) * (boss ? 0.45 : 1);
    this.nextSpawn = g.now + interval * (boss ? 1.8 : 1);
    if (g.enemies.length >= cap) return;

    const def = pickWeighted(
      SPAWNABLE.filter((d) => d.minWave <= run.wave),
      (d) => d.weight(run.wave),
    );
    if (!def) return;

    const origin = this.spawnPoint(rand(700, 820));
    const count = def.group ? randInt(def.group[0], def.group[1]) + Math.floor(run.wave / 8) : run.wave >= 12 && Math.random() < 0.3 ? 2 : 1;
    const eliteChance = Math.min(0.18, 0.025 * (run.wave - 3));

    for (let i = 0; i < count; i += 1) {
      const affix = def.id !== "swarm" && Math.random() < eliteChance ? pick(AFFIX_IDS) : undefined;
      spawnEnemy(g, def.id as EnemyId, origin.x + rand(-50, 50), origin.y + rand(-50, 50), { affix });
    }
    g.hints.enemy(def.id);
  }

  /** Punto su un anello attorno alla nave, dentro l'arena e fuori dagli asteroidi. */
  private spawnPoint(radius: number) {
    const { g } = this;
    let best = { x: g.player.x + radius, y: g.player.y };
    for (let tries = 0; tries < 12; tries += 1) {
      const a = rand(0, Math.PI * 2);
      const x = g.player.x + Math.cos(a) * radius;
      const y = g.player.y + Math.sin(a) * radius;
      const { width, height } = g.arena;
      const inside = x > 60 && y > 60 && x < width - 60 && y < height - 60;
      if (inside && !hitsAsteroid(g.arena, x, y, 50)) return { x, y };
      if (inside) best = { x, y };
    }
    return { x: clamp(best.x, 60, g.arena.width - 60), y: clamp(best.y, 60, g.arena.height - 60) };
  }
}
