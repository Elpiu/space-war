import { icon } from "../art/svg";
import { CHEST_KILL_STEP, DEPLOY, DIFFICULTIES, LIMITS, type DifficultyId } from "../config";
import { ITEMS, RARITIES, TOMES, defaultLoadout, rollItem, rollTomeOffers, tomeById, tomeLevel } from "../data/upgrades";
import { runCredits, saveMeta, unlockedItems, unlockedTomes } from "../meta";
import type { GameScene } from "../scenes/GameScene";
import { arenaCenter, generateArena } from "../systems/arena";
import { Director } from "../systems/director";
import { dropChestNearby, dropPickup } from "../systems/pickups";
import type { Enemy, TomeOffer } from "../types";
import { banner } from "../ui/hud";
import { closeScreen, showGameOver, showLevelUp } from "../ui/screens";
import { esc } from "../ui/dom";
import { formatTime, hex, pick } from "../utils";
import type { GameMode, HudInfo, ModeSetup, RunOutcome, SkillInfo } from "./mode";

/** Survival roguelite: wave infinite, tomi al level-up, oggetti dalle chest. */
export class SurvivalMode implements GameMode {
  readonly id = "survival" as const;
  readonly heading = null;
  readonly allowDash = true;
  private director: Director | null = null;
  private offers: TomeOffer[] = [];

  constructor(private readonly difficulty: DifficultyId) {}

  setup(): ModeSetup {
    const arena = generateArena(Math.floor(Math.random() * 0x7fffffff));
    return { arena, start: arenaCenter(arena), base: defaultLoadout(), wave: 0, difficulty: this.difficulty };
  }

  begin(g: GameScene) {
    this.director = new Director(g);
    g.run.nextWaveAt = 1500;
    g.run.inBreak = true;
    g.hints.trigger("move");
  }

  update() {
    this.director?.update();
  }

  onKill(g: GameScene, e: Enemy) {
    const run = g.run;
    const { x, y, def } = e;
    const reward = DIFFICULTIES[run.difficulty].reward;
    const elite = Boolean(e.affix);
    const isBoss = Boolean(def.boss);

    dropPickup(g, "xp", x, y, Math.ceil(def.xp * (elite ? 3 : 1) * reward));
    if (elite || isBoss || Math.random() < 0.45) {
      dropPickup(g, "coin", x + 10, y + 6, Math.ceil(def.coins * (elite ? 2 : 1) * reward));
    }
    if (Math.random() < (elite ? 0.15 : 0.012)) dropPickup(g, "heart", x - 10, y + 4, 2);
    if (Math.random() < (elite ? 0.08 : 0.005)) dropPickup(g, pick(["magnet", "venom", "emp"] as const), x, y - 12);
    if (isBoss || (elite && Math.random() < 0.2)) dropPickup(g, "chest", x, y);
    if (isBoss) {
      banner("BOSS ABBATTUTO", "Una chest ti aspetta nel relitto.", "epic");
      for (let i = 0; i < 8; i += 1) dropPickup(g, "coin", x + Math.cos(i) * 50, y + Math.sin(i) * 50, 3);
    }

    if (run.kills >= run.nextChestKills) {
      run.nextChestKills += CHEST_KILL_STEP + run.wave * 4;
      dropChestNearby(g);
      g.hints.trigger("chest");
    }
  }

  onChest(g: GameScene) {
    const item = rollItem(g.run, unlockedItems(g.meta));
    if (!item) {
      g.run.coins += 25;
      g.toast("Chest: +25 monete", "coin", "good");
      return;
    }
    const level = (g.run.items[item.id] ?? 0) + 1;
    g.run.items[item.id] = level;
    g.refreshStats();
    if (item.id === "bulkhead") g.heal(3);
    g.toast(`${item.title} ${level > 1 ? `Liv. ${level}` : ""} · ${item.perLevel}`, item.icon, "epic");
  }

  // ---------- Level-up ----------

  onLevelUp(g: GameScene) {
    this.offers = rollTomeOffers(g.run, unlockedTomes(g.meta));
    if (this.offers.length === 0) {
      g.pendingLevels = 0;
      g.run.coins += 10;
      g.toast("Tomi al massimo: +10 monete", "coin");
      return;
    }
    g.freeze("levelup");
    g.sfx("levelUp");
    this.renderLevelUp(g);
  }

  private rerollCost(g: GameScene) {
    return Math.round(15 * (g.run.paidRerolls + 1) ** 1.5);
  }

  private renderLevelUp(g: GameScene) {
    const run = g.run;
    const cost = this.rerollCost(g);
    const free = run.freeRerolls > 0;
    showLevelUp(
      run,
      this.offers,
      {
        label: free ? `Reroll gratis (${run.freeRerolls})` : `Reroll ${cost} monete (hai ${run.coins})`,
        enabled: free || run.coins >= cost,
      },
      { pick: (offer) => this.applyTome(g, offer), reroll: () => this.reroll(g) },
    );
  }

  private reroll(g: GameScene) {
    const run = g.run;
    if (run.freeRerolls > 0) run.freeRerolls -= 1;
    else {
      const cost = this.rerollCost(g);
      if (run.coins < cost) return;
      run.coins -= cost;
      run.paidRerolls += 1;
    }
    this.offers = rollTomeOffers(run, unlockedTomes(g.meta));
    this.renderLevelUp(g);
  }

  private applyTome(g: GameScene, offer: TomeOffer) {
    const run = g.run;
    const current = run.tomes[offer.tome.id] ?? { level: 0, bonus: 0 };
    run.tomes[offer.tome.id] = { level: current.level + 1, bonus: current.bonus + offer.value };
    g.refreshStats();

    const level = tomeLevel(run, offer.tome.id);
    if (level === LIMITS.tomeMaxLevel - 1) g.hints.trigger("evolve");
    if (level >= LIMITS.tomeMaxLevel) {
      const tome = tomeById(offer.tome.id);
      if (tome.id === "wisdom") run.freeRerolls += 1;
      banner(`EVOLUZIONE: ${tome.evolution.title.toUpperCase()}`, tome.evolution.description, "epic");
      g.sfx("reward");
    }
    if (offer.rarity === "legendary") g.fx.ring(g.player.x, g.player.y, RARITIES.legendary.color, 160);

    g.pendingLevels -= 1;
    closeScreen();
    g.unfreeze();
  }

  // ---------- Fine run ----------

  end(g: GameScene, _outcome: RunOutcome) {
    const run = g.run;
    const credits = runCredits(run, DIFFICULTIES[run.difficulty].reward);
    const record = run.wave > g.meta.bestWave;
    g.meta.credits += credits;
    g.meta.bestWave = Math.max(g.meta.bestWave, run.wave);
    g.meta.runs += 1;
    saveMeta(g.meta);

    showGameOver(run, { credits, totalCredits: g.meta.credits, record }, {
      retry: () => g.startMode(new SurvivalMode(this.difficulty)),
      shop: () => g.showShop(),
      menu: () => g.showMenu(),
    });
  }

  // ---------- HUD ----------

  hud(g: GameScene): HudInfo {
    const run = g.run;
    let detail: string;
    if (run.inBreak) detail = `prossima ${Math.max(0, Math.ceil((run.nextWaveAt - g.now) / 1000))}s`;
    else if (run.event === "boss") detail = "abbatti il boss";
    else detail = formatTime(Math.max(0, run.waveEndsAt - g.now));
    const event = run.inBreak ? "" : run.event === "boss" ? "BOSS" : run.event === "horde" ? "ORDA" : "";
    return {
      label: "WAVE",
      value: `${run.wave}`,
      detail,
      event,
      bar: { ratio: run.xp / run.xpToNext, text: `LV ${run.level}`, kind: "xp" },
    };
  }

  skills(g: GameScene): SkillInfo[] {
    const run = g.run;
    const s = run.stats;
    const dashLeft = Math.max(0, run.dashReadyAt - g.now);
    const turrets = g.deployables.turrets.length;
    const mines = g.deployables.mines.length;
    return [
      { id: "dash", icon: "dash", key: "SPAZIO", ratio: 1 - dashLeft / s.dashCooldown, ready: dashLeft <= 0 },
      {
        id: "turret",
        icon: "turret",
        key: "Q",
        ratio: 1,
        ready: turrets < s.maxTurrets && run.coins >= DEPLOY.turretCost,
        info: `${turrets}/${s.maxTurrets} · ${DEPLOY.turretCost}¢`,
      },
      {
        id: "mine",
        icon: "mine",
        key: "E",
        ratio: 1,
        ready: mines < s.maxMines && run.coins >= DEPLOY.mineCost,
        info: `${mines}/${s.maxMines} · ${DEPLOY.mineCost}¢`,
      },
    ];
  }

  build(g: GameScene) {
    const run = g.run;
    const tomes = TOMES.filter((t) => run.tomes[t.id]).map((t) => {
      const level = run.tomes[t.id]!.level;
      const evolved = level >= LIMITS.tomeMaxLevel;
      const pips = Array.from({ length: LIMITS.tomeMaxLevel }, (_, i) => `<i class="${i < level ? "on" : ""}"></i>`).join("");
      return `<div class="build-chip build-chip--tome ${evolved ? "is-evolved" : ""}" style="--c:${hex(t.color)}" title="${esc(evolved ? t.evolution.title : t.title)}">
        ${icon(t.icon)}<span class="pips">${pips}</span></div>`;
    });
    const empty = Array.from({ length: LIMITS.maxRunTomes - tomes.length }, () => `<div class="build-chip build-chip--empty"></div>`);
    const items = ITEMS.filter((it) => run.items[it.id]).map(
      (it) => `<div class="build-chip build-chip--item" style="--c:${hex(it.color)}" title="${esc(it.title)}">${icon(it.icon)}<b>${run.items[it.id]}</b></div>`,
    );
    return `<div class="build-row">${[...tomes, ...empty].join("")}</div><div class="build-row">${items.join("")}</div>`;
  }
}
