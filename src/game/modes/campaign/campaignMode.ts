import { BlendModes } from "phaser";
import { icon } from "../../art/svg";
import { DEPTH, DIFFICULTIES, VIEW_H, VIEW_W, type DifficultyId } from "../../config";
import { AFFIXES } from "../../data/enemies";
import type { GameScene } from "../../scenes/GameScene";
import { ceilAt, floorAt } from "../../systems/terrain";
import { spawnEnemy } from "../../systems/enemies";
import { dropPickup } from "../../systems/pickups";
import type { AffixId, Enemy } from "../../types";
import { esc } from "../../ui/dom";
import { banner } from "../../ui/hud";
import { clamp, hex, pick, rand } from "../../utils";
import { defaultLoadout } from "../../data/upgrades";
import { WeaponRack } from "../../systems/rack";
import type { GameMode, HudInfo, ModeSetup, RunOutcome, SkillInfo } from "../mode";
import { mustGearDef, rollGear, type GearItem } from "./gear";
import { showMissionResult } from "./hub";
import { pickFormation } from "./formations";
import { SEGMENT_LABELS, generateLevel, segmentAt, type Prop, type Segment, type SegmentKind } from "./level";
import { missionById, type MissionDef } from "./missions";
import {
  DIFFICULTY_STARS,
  addLoot,
  buildLoadout,
  itemByUid,
  loadProfile,
  recordVictory,
  saveProfile,
  slotKeys,
  type CampaignLoadout,
  type CampaignProfile,
} from "./profile";

const AFFIX_IDS: AffixId[] = ["swift", "armored", "splitter"];

const BASE_SCROLL = 78;

/**
 * Missione di campagna: corridoio orizzontale che scorre da solo verso destra.
 * Si vince raggiungendo il portale d'uscita (o abbattendo il boss).
 */
export class CampaignMode implements GameMode {
  readonly id = "campaign" as const;
  readonly heading = 0;
  readonly allowDash = false;
  private mission: MissionDef;
  private profile: CampaignProfile;
  private loadout: CampaignLoadout;
  private rack: WeaponRack | null = null;
  private loot: Omit<GearItem, "uid">[] = [];
  private capsule: { x: number; y: number } | undefined;
  private capsuleFound = false;
  private miniBossSpawned = false;
  private miniBoss: Enemy | null = null;
  private scroll = 0;
  private speed = BASE_SCROLL;
  private nextSpawnX = VIEW_W + 200;
  private bossSpawned = false;
  private exitX = 0;
  private segments: Segment[] = [];
  private props: Prop[] = [];
  private currentSegment: SegmentKind | null = null;
  private shield = 0;
  private lastHitAt = -99999;
  private combo = 0;
  private lastKillAt = -99999;

  constructor(
    private readonly missionId: string,
    private readonly difficulty: DifficultyId = "normal",
  ) {
    this.mission = missionById(missionId);
    this.profile = loadProfile();
    this.loadout = buildLoadout(this.profile);
  }

  setup(): ModeSetup {
    const seed = Math.floor(Math.random() * 0x7fffffff);
    const { arena, segments, props, capsule } = generateLevel(this.mission, seed);
    this.segments = segments;
    this.props = props;
    this.capsule = capsule;
    return {
      arena,
      start: { x: 220, y: VIEW_H / 2 },
      base: {
        ...defaultLoadout(),
        ...this.loadout.ship,
        damage: 2 * this.loadout.rack.damageMul,
        maxTurrets: 0,
        maxMines: 0,
      },
      wave: this.mission.tier * 2 - 1,
      difficulty: this.difficulty,
    };
  }

  createArmament(g: GameScene) {
    this.rack = new WeaponRack(g, this.loadout);
    return this.rack;
  }

  begin(g: GameScene) {
    const cam = g.cameras.main;
    cam.stopFollow();
    cam.setBounds(0, 0, g.arena.width, g.arena.height);
    cam.setScroll(0, 0);
    this.exitX = g.arena.width - 170;

    if (!this.mission.boss) {
      // Portale d'uscita: una colonna di luce in fondo al corridoio.
      const gate = g.add.graphics().setDepth(DEPTH.hazard + 2);
      gate.fillStyle(0x4ade80, 0.08);
      gate.fillRect(this.exitX, 0, 170, VIEW_H);
      gate.lineStyle(6, 0x4ade80, 0.8);
      gate.lineBetween(this.exitX, 0, this.exitX, VIEW_H);
      g.trackRunObject(gate);
      for (let y = 60; y < VIEW_H; y += 150) {
        g.trackRunObject(
          g.add.image(this.exitX, y, "glow").setTint(0x4ade80).setBlendMode(BlendModes.ADD).setDisplaySize(140, 140).setDepth(DEPTH.hazard + 2),
        );
      }
      g.trackRunObject(
        g.add
          .text(this.exitX + 85, VIEW_H / 2, "USCITA", { fontFamily: "Orbitron, Arial Black", fontSize: "26px", color: "#bbf7d0" })
          .setOrigin(0.5)
          .setRotation(Math.PI / 2)
          .setDepth(DEPTH.hazard + 3),
      );
    }

    this.shield = this.loadout.ship.shield;
    // La capsula segreta compare solo finché non è stata trovata.
    if (this.capsule && !this.profile.secrets.includes(this.mission.id)) dropPickup(g, "capsule", this.capsule.x, this.capsule.y);
    banner(`MISSIONE ${this.mission.code}`, this.mission.title);
    g.hints.trigger("fire");
  }

  update(g: GameScene, dt: number) {
    const cam = g.cameras.main;
    const ship = this.loadout.ship;

    // Dispositivi: lo scudo si ricarica dopo 2.5 s senza colpi, i nanobot riparano.
    if (ship.shield > 0 && g.now - this.lastHitAt > 2500) this.shield = Math.min(ship.shield, this.shield + ship.shieldRegen * dt);
    if (ship.regen > 0) g.heal(ship.regen * dt);
    const maxScroll = g.arena.width - VIEW_W;

    // Lo scorrimento rallenta quando lo schermo è affollato di volanti.
    const crowded = g.enemies.filter((e) => !e.dead && !e.anchor && !e.def.structure && e.x > this.scroll && e.x < this.scroll + VIEW_W).length;
    // Mini-boss: a una certa distanza lo scorrimento si ferma finché non cade.
    const maxScrollNow = g.arena.width - VIEW_W;
    if (this.mission.miniBoss && !this.miniBossSpawned && this.scroll >= maxScrollNow * this.mission.miniBoss) this.spawnMiniBoss(g);
    if (this.miniBoss?.dead) this.miniBoss = null;
    const target = this.miniBoss ? 0 : crowded > 8 ? 24 : crowded > 4 ? 50 : BASE_SCROLL;
    this.speed += (target - this.speed) * Math.min(1, dt * 2);
    this.scroll = Math.min(maxScroll, this.scroll + this.speed * dt);
    cam.setScroll(this.scroll, 0);

    // Annuncio del segmento in cui sta entrando lo schermo.
    const ahead = segmentAt(this.segments, this.scroll + VIEW_W * 0.6);
    if (ahead.kind !== this.currentSegment) {
      if (this.currentSegment !== null && ahead.kind !== "open") g.toast(SEGMENT_LABELS[ahead.kind], ahead.kind === "boss" ? "boss" : "map");
      this.currentSegment = ahead.kind;
    }

    // Spawn innescati dalla distanza percorsa (niente spawn nell'arena del boss).
    const bossSeg = this.segments.find((sg) => sg.kind === "boss");
    const spawnLimit = bossSeg ? bossSeg.start : g.arena.width - 700;
    while (this.scroll + VIEW_W >= this.nextSpawnX && this.nextSpawnX < spawnLimit) {
      this.spawnGroup(g);
      this.nextSpawnX += rand(190, 330) * (1 - this.mission.tier * 0.05);
    }

    // Unità di terra e strutture compaiono appena prima del bordo destro.
    while (this.props.length > 0 && this.props[0].x < this.scroll + VIEW_W + 120) {
      const prop = this.props.shift()!;
      spawnEnemy(g, prop.id, prop.x, prop.anchor === "floor" ? VIEW_H - 40 : 40, { anchor: prop.anchor });
      g.hints.enemy(prop.id);
    }

    // I nemici rimasti indietro o usciti di lato escono di scena senza ricompense.
    for (const e of g.enemies) {
      if (e.dead || e.def.id === "boss" || e.def.id === "gunship") continue;
      if (e.x < this.scroll - 280 || e.y < -180 || e.y > VIEW_H + 180) g.killEnemy(e, false, true);
    }

    if (this.scroll >= maxScroll) {
      if (this.mission.boss) {
        if (!this.bossSpawned) {
          this.bossSpawned = true;
          const bx = this.scroll + VIEW_W - 220;
          const terrain = g.arena.terrain;
          const by = terrain ? (Math.max(0, ceilAt(terrain, bx)) + Math.min(VIEW_H, floorAt(terrain, bx))) / 2 : VIEW_H / 2;
          const boss = spawnEnemy(g, "boss", bx, by);
          g.onBossSpawned(boss);
        } else if (!g.enemies.some((e) => e.def.id === "boss" && !e.dead)) {
          g.endRun("victory");
        }
      } else if (g.player.x > this.exitX) {
        g.endRun("victory");
      }
    }
  }

  private spawnMiniBoss(g: GameScene) {
    this.miniBossSpawned = true;
    const x = this.scroll + VIEW_W + 120;
    const terrain = g.arena.terrain;
    const y = terrain ? (Math.max(0, ceilAt(terrain, x)) + Math.min(VIEW_H, floorAt(terrain, x))) / 2 : VIEW_H / 2;
    this.miniBoss = spawnEnemy(g, "gunship", x, y, {
      path: { kind: "hold", t: 0, x0: x, y0: y, speed: 140, holdAt: 0.74, holdFor: 1e9 },
    });
    g.hud.setBoss(this.miniBoss);
    banner("MINI-BOSS", "Cannoniera pirata: lo scorrimento si ferma finché non la abbatti", "warning");
    g.sfx("alarm");
    g.hints.enemy("gunship");
  }

  private spawnGroup(g: GameScene) {
    if (this.miniBoss) return;
    const alive = g.enemies.filter((e) => !e.dead && !e.anchor && !e.def.structure).length;
    if (alive >= 18 + this.mission.tier * 6) return;

    const x = this.scroll + VIEW_W + rand(60, 140);
    const segment = segmentAt(this.segments, x);
    const formation = pickFormation(segment.kind, this.mission.tier);
    if (!formation) return;

    // L'ondata entra nello spazio libero fra soffitto e pavimento.
    const terrain = g.arena.terrain;
    const top = (terrain ? Math.max(0, ceilAt(terrain, x)) : 0) + 40;
    const bottom = (terrain ? Math.min(VIEW_H, floorAt(terrain, x)) : VIEW_H) - 40;
    const eliteChance = Math.min(0.25, 0.04 * this.mission.tier);
    const id = formation.spawn({
      g,
      x,
      top,
      bottom: Math.max(top + 40, bottom),
      tier: this.mission.tier,
      elite: () => (Math.random() < eliteChance ? pick(AFFIX_IDS) : undefined),
    });
    g.hints.enemy(id);
  }

  constrainPlayer(_g: GameScene, pos: { x: number; y: number }) {
    pos.x = clamp(pos.x, this.scroll + 30, this.scroll + VIEW_W - 30);
  }

  absorbDamage(g: GameScene, damage: number) {
    this.lastHitAt = g.now;
    const taken = Math.min(this.shield, damage);
    this.shield -= taken;
    return damage - taken;
  }

  /** Moltiplicatore monete: dispositivi taglia e combo. */
  private coinMul() {
    const steps = Math.min(10, Math.max(0, this.combo - 1));
    return this.loadout.rack.coinMul * (1 + this.loadout.rack.comboBonus * steps);
  }

  onKill(g: GameScene, e: Enemy) {
    this.combo = g.now - this.lastKillAt < 1800 ? this.combo + 1 : 1;
    this.lastKillAt = g.now;
    const { x, y, def } = e;
    const elite = Boolean(e.affix);
    const isBoss = def.id === "boss" || def.id === "gunship";
    const tier = this.mission.tier;
    if (def.id === "gunship") {
      g.hud.setBoss(null);
      banner("CANNONIERA ABBATTUTA", "Il percorso riparte", "epic");
    }

    const ground = Boolean(e.anchor || def.structure || def.id === "cargo");
    if (elite || isBoss || ground || Math.random() < 0.6) {
      dropPickup(g, "coin", x, y, Math.ceil(def.coins * (1 + tier * 0.5) * (elite ? 2 : 1) * this.coinMul() * DIFFICULTIES[this.difficulty].reward));
    }
    if (Math.random() < (elite ? 0.15 : 0.025)) dropPickup(g, "heart", x - 10, y + 4, 2);
    if (Math.random() < (elite ? 0.06 : 0.006)) dropPickup(g, pick(["magnet", "venom", "emp"] as const), x, y - 12);
    if (isBoss || def.id === "cargo" || (elite && Math.random() < 0.35) || Math.random() < 0.006) dropPickup(g, "chest", x, y);
    if (isBoss) {
      for (let i = 0; i < 10; i += 1) dropPickup(g, "coin", x + Math.cos(i) * 60, y + Math.sin(i) * 60, 5 * tier);
    }
  }

  /** Le difficoltà più alte pescano bottino come se la missione fosse di tier superiore. */
  private get lootTier() {
    return this.mission.tier + DIFFICULTY_STARS[this.difficulty] - 1;
  }

  onCapsule(g: GameScene) {
    this.capsuleFound = true;
    const coins = 50 * this.mission.tier;
    g.run.coins += coins;
    const item = rollGear(this.lootTier, "rare");
    this.loot.push(item);
    banner("CAPSULA SEGRETA", `+${coins} monete e ${mustGearDef(item.defId).title}`, "epic");
    g.sfx("reward");
  }

  /** In campagna la chest è una cassa di bottino: un pezzo d'equipaggiamento. */
  onChest(g: GameScene) {
    const item = rollGear(this.lootTier);
    this.loot.push(item);
    const def = mustGearDef(item.defId);
    g.toast(`Bottino: ${def.title}`, def.icon, item.rarity === "legendary" || item.rarity === "rare" ? "epic" : "good");
  }

  end(g: GameScene, outcome: RunOutcome) {
    const profile = loadProfile();
    const victory = outcome === "victory";
    const stars = DIFFICULTY_STARS[this.difficulty];
    // Prima vittoria a questa difficoltà: bonus doppio e bottino migliore.
    const firstClear = victory && (profile.stars[this.mission.id] ?? 0) < stars;
    const bonus = victory ? Math.round(40 * this.mission.tier * DIFFICULTIES[this.difficulty].reward * (firstClear ? 2 : 1)) : 0;
    const minRarity = stars >= 3 ? "rare" : stars === 2 || firstClear ? "uncommon" : "common";
    const reward = victory ? [rollGear(this.lootTier, minRarity)] : [];

    // Non è un roguelite: monete e bottino raccolti si tengono sempre.
    profile.coins += g.run.coins + bonus;
    const added = addLoot(profile, [...this.loot, ...reward]);
    if (victory) recordVictory(profile, this.mission.id, this.difficulty);
    if (this.capsuleFound && !profile.secrets.includes(this.mission.id)) profile.secrets.push(this.mission.id);
    saveProfile(profile);

    showMissionResult(
      {
        mission: this.mission,
        victory,
        coins: g.run.coins,
        bonus,
        items: added,
        firstClear,
        kills: g.run.kills,
        time: g.run.time,
      },
      {
        map: () => g.showCampaign(),
        retry: () => g.startMode(new CampaignMode(this.missionId, this.difficulty)),
      },
    );
  }

  hud(g: GameScene): HudInfo {
    const maxScroll = g.arena.width - VIEW_W;
    const ratio = maxScroll > 0 ? this.scroll / maxScroll : 1;
    const segment = segmentAt(this.segments, this.scroll + VIEW_W / 2);
    let detail = `${SEGMENT_LABELS[segment.kind]} · ${Math.floor(ratio * 100)}%`;
    if (ratio >= 1) detail = this.mission.boss ? "abbatti il boss" : "raggiungi l'uscita";
    return {
      label: "MISSIONE",
      value: this.mission.code,
      detail,
      event: this.bossSpawned ? "BOSS" : this.miniBoss ? "MINI-BOSS" : this.combo >= 3 && g.now - this.lastKillAt < 1800 ? `COMBO x${this.combo}` : "",
      shield: this.loadout.ship.shield > 0 ? { value: this.shield, max: this.loadout.ship.shield } : undefined,
      bar: {
        ratio,
        text: this.mission.title.toUpperCase(),
        kind: "route",
        marks: this.segments.slice(1).map((sg) => Math.min(1, Math.max(0, (sg.start - VIEW_W / 2) / Math.max(1, maxScroll)))),
      },
    };
  }

  skills(): SkillInfo[] {
    const rack = this.rack;
    if (!rack) return [];
    const heatRatio = rack.heat / rack.heatCap;
    const list: SkillInfo[] = [
      {
        id: "heat",
        icon: "heat",
        key: "SPAZIO",
        ratio: heatRatio,
        ready: !rack.overheated,
        hot: rack.overheated || heatRatio > 0.75,
        info: rack.overheated ? "SURRISCALDATO" : `calore ${Math.round(heatRatio * 100)}%`,
      },
    ];
    if (rack.hasBomb) {
      list.push({ id: "bomb", icon: "gear-bomb", key: "B", ratio: rack.bombCharge, ready: rack.bombCharge >= 1, info: rack.bombCharge >= 1 ? "pronta" : "" });
    }
    if (rack.hasMissiles) {
      list.push({ id: "missile", icon: "gear-missile", key: "AUTO", ratio: rack.missileReady, ready: rack.missileReady >= 1 });
    }
    return list;
  }

  build() {
    const gear = slotKeys(this.profile)
      .map((key) => itemByUid(this.profile, this.profile.equipped[key]))
      .filter((item): item is GearItem => Boolean(item))
      .map((item) => {
        const def = mustGearDef(item.defId);
        return `<div class="build-chip build-chip--item rarity-${item.rarity}" style="--c:${hex(def.color)}" title="${esc(def.title)}">${icon(def.icon)}<b>${item.level}</b></div>`;
      });
    const loot = `<div class="build-chip build-chip--loot" style="--c:${hex(AFFIXES.splitter.color)}" title="Bottino raccolto">${icon("crate")}<b>${this.loot.length}</b></div>`;
    return `<div class="build-row">${gear.join("")}${loot}</div>`;
  }
}
