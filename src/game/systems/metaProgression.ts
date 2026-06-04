import type {
  MetaProgressionState,
  PlayerStats,
  PostRunRewardPreview,
  RunUpgradeState,
  ShopCategory,
  ShopItem,
  ShopItemId,
  ShopItemLevels,
  ShopLoadout,
} from "../types/gameplay";
import { applyModifiers } from "./modifiers";

const META_STORAGE_KEY = "space-war-meta-v2";
const MIN_ITEM_UPGRADE_COST = 12;

export const SHOP_CATEGORIES: { id: ShopCategory; label: string }[] = [
  { id: "ships", label: "Navicelle" },
  { id: "weapons", label: "Cannoni" },
  { id: "boosters", label: "Booster" },
  { id: "turrets", label: "Torrette" },
  { id: "mines", label: "Mine" },
];

export const DEFAULT_LOADOUT: ShopLoadout = {
  ships: "shipScout",
  weapons: "weaponBase",
  boosters: "boosterNone",
  turrets: "turretBasic",
  mines: "mineBasic",
};

export const SHOP_ITEMS: ShopItem[] = [
  // ─── NAVICELLE ───────────────────────────────────────────────────────────────

  {
    id: "shipScout",
    category: "ships",
    title: "Standard",
    description: "Telaio bilanciato: nessun bonus nascosto, nessuna penalità.",
    statLine: "HP 8  DMG 2  SPD 245  ROF 390ms",
    accentColor: 0x378add,
    iconKind: "shipStandard",
    cost: 0,
    isDefault: true,
  },
  {
    id: "shipTank",
    category: "ships",
    title: "Tank",
    description:
      "Scafo pesante: colpi più forti e molta vita, ma poca agilità.",
    statLine: "+5 HP  +1.5 DMG  -30 SPD",
    accentColor: 0x2dd4bf,
    iconKind: "shipTank",
    cost: 45,
    isDefault: false,
    modifiers: [
      { target: "playerStat", stat: "maxHp", operation: "add", value: 5 },
      { target: "playerStat", stat: "hp", operation: "add", value: 5 },
      { target: "playerStat", stat: "damage", operation: "add", value: 1.5 },
      { target: "playerStat", stat: "speed", operation: "add", value: -30 },
    ],
  },
  {
    id: "shipLightFighter",
    category: "ships",
    title: "Light Fighter",
    description:
      "Telaio rapido: entra ed esce dal pericolo, ma regge meno colpi.",
    statLine: "-2 HP  +42 SPD  ROF -16%",
    accentColor: 0xfacc15,
    iconKind: "shipLight",
    cost: 42,
    isDefault: false,
    modifiers: [
      {
        target: "playerStat",
        stat: "maxHp",
        operation: "add",
        value: -2,
        min: 1,
      },
      { target: "playerStat", stat: "speed", operation: "add", value: 42 },
      {
        target: "playerStat",
        stat: "fireRate",
        operation: "multiply",
        value: 0.84,
      },
    ],
  },
  {
    id: "shipSupport",
    category: "ships",
    title: "Support",
    description:
      "Scafo tattico: magnete potenziato e 2 slot torrette extra. Perde efficacia offensiva, guadagna controllo del campo.",
    statLine: "+50 pickup  +2 maxTurret  -1 DMG",
    accentColor: 0x34d399,
    iconKind: "shipStandard", // riutilizzi finché non hai un'icona dedicata
    cost: 55,
    isDefault: false,
    modifiers: [
      {
        target: "playerStat",
        stat: "pickupRadius",
        operation: "add",
        value: 50,
      },
      {
        target: "playerStat",
        stat: "damage",
        operation: "add",
        value: -1,
        min: 1,
      },
      {
        target: "runUpgrade",
        stat: "maxTurretBonus",
        operation: "add",
        value: 2,
      },
    ],
  },
  {
    id: "shipSniper",
    category: "ships",
    title: "Sniper",
    description:
      "Lunga gittata e danno chirurgico per colpo, cadenza dimezzata. Parte con 2 barricate gratuite.",
    statLine: "+40 range  +3 DMG  ROF ×0.50  +2 barricade",
    accentColor: 0xf472b6,
    iconKind: "shipSniper",
    cost: 60,
    isDefault: false,
    modifiers: [
      {
        target: "playerStat",
        stat: "bulletRange",
        operation: "add",
        value: 40,
      },
      { target: "playerStat", stat: "damage", operation: "add", value: 3 },
      {
        target: "playerStat",
        stat: "fireRate",
        operation: "multiply",
        value: 0.5,
      },
      {
        target: "runUpgrade",
        stat: "maxBarricades",
        operation: "add",
        value: 2,
      },
    ],
  },

  // ─── CANNONI ─────────────────────────────────────────────────────────────────

  {
    id: "weaponBase",
    category: "weapons",
    title: "Cannon base",
    description: "Arma standard affidabile, buona per ogni archetipo.",
    statLine: "DMG 2  ROF 390ms  range 100",
    accentColor: 0xfef08a,
    iconKind: "weaponBase",
    cost: 0,
    isDefault: true,
  },
  {
    id: "weaponRapid",
    category: "weapons",
    title: "Rapid cannon",
    description:
      "Volume di fuoco alto: meno danno per colpo, più pressione costante.",
    statLine: "ROF ×0.72  -1 DMG",
    accentColor: 0x67e8f9,
    iconKind: "weaponRapid",
    cost: 35,
    isDefault: false,
    modifiers: [
      {
        target: "playerStat",
        stat: "fireRate",
        operation: "multiply",
        value: 0.72,
      },
      {
        target: "playerStat",
        stat: "damage",
        operation: "add",
        value: -1,
        min: 1,
      },
    ],
  },
  {
    id: "weaponHeavy",
    category: "weapons",
    title: "Heavy cannon",
    description: "Colpi lenti e pesanti, utile contro brute ed elite.",
    statLine: "+2 DMG  ROF ×1.28",
    accentColor: 0xfb923c,
    iconKind: "weaponHeavy",
    cost: 42,
    isDefault: false,
    modifiers: [
      { target: "playerStat", stat: "damage", operation: "add", value: 2 },
      {
        target: "playerStat",
        stat: "fireRate",
        operation: "multiply",
        value: 1.28,
      },
    ],
  },
  {
    id: "weaponShotgun",
    category: "weapons",
    title: "Shotgun",
    description:
      "Esplosione a corto raggio: tre proiettili a spread, devastante da vicino.",
    statLine: "+3 multiShot  -20 range  -1 DMG",
    accentColor: 0x399fff,
    iconKind: "weaponShotgun",
    cost: 50,
    isDefault: false,
    modifiers: [
      { target: "playerStat", stat: "multiShot", operation: "add", value: 3 },
      {
        target: "playerStat",
        stat: "bulletRange",
        operation: "add",
        value: -20,
      },
      {
        target: "playerStat",
        stat: "damage",
        operation: "add",
        value: -1,
        min: 1,
      },
    ],
  },
  {
    id: "weaponScatter",
    category: "weapons",
    title: "Scatter gun",
    description:
      "Cinque proiettili a ventaglio ampio. Copertura totale a corto raggio, proiettili più lenti.",
    statLine: "+5 multiShot  -35 range  bSpeed ×0.85",
    accentColor: 0xa78bfa,
    iconKind: "weaponShotgun", // ricicla fino a iconKind dedicata
    cost: 58,
    isDefault: false,
    modifiers: [
      { target: "playerStat", stat: "multiShot", operation: "add", value: 5 },
      {
        target: "playerStat",
        stat: "bulletRange",
        operation: "add",
        value: -35,
      },
      {
        target: "playerStat",
        stat: "bulletSpeed",
        operation: "multiply",
        value: 0.85,
      },
    ],
  },

  // ─── BOOSTER ─────────────────────────────────────────────────────────────────

  {
    id: "boosterNone",
    category: "boosters",
    title: "Nessun booster",
    description: "Assetto pulito: tieni il telaio senza modulo laterale.",
    statLine: "Nessun modificatore",
    accentColor: 0x94a3b8,
    iconKind: "boosterNone",
    cost: 0,
    isDefault: true,
  },
  {
    id: "boosterHull",
    category: "boosters",
    title: "Hull booster",
    description: "Piastre extra: più resistenza, accelerazione meno pronta.",
    statLine: "+2 HP  -16 SPD",
    accentColor: 0x34d399,
    iconKind: "boosterHull",
    cost: 20,
    isDefault: false,
    modifiers: [
      { target: "playerStat", stat: "maxHp", operation: "add", value: 2 },
      { target: "playerStat", stat: "hp", operation: "add", value: 2 },
      { target: "playerStat", stat: "speed", operation: "add", value: -16 },
    ],
  },
  {
    id: "boosterSpeed",
    category: "boosters",
    title: "Speed booster",
    description: "Propulsori leggeri: molta mobilità, scafo più fragile.",
    statLine: "+34 SPD  -1 HP",
    accentColor: 0xa78bfa,
    iconKind: "boosterSpeed",
    cost: 24,
    isDefault: false,
    modifiers: [
      { target: "playerStat", stat: "speed", operation: "add", value: 34 },
      {
        target: "playerStat",
        stat: "maxHp",
        operation: "add",
        value: -1,
        min: 1,
      },
    ],
  },
  {
    id: "boosterMagnet",
    category: "boosters",
    title: "Magnet booster",
    description:
      "Cargo magnetico: raccoglie da lontano, cadenza leggermente penalizzata.",
    statLine: "+50 pickup  ROF ×1.06",
    accentColor: 0x22d3ee,
    iconKind: "boosterMagnet",
    cost: 22,
    isDefault: false,
    modifiers: [
      {
        target: "playerStat",
        stat: "pickupRadius",
        operation: "add",
        value: 50,
      },
      {
        target: "playerStat",
        stat: "fireRate",
        operation: "multiply",
        value: 1.06,
      },
    ],
  },
  {
    id: "boosterOverdrive",
    category: "boosters",
    title: "Overdrive",
    description:
      "Overclock dei cannoni: cadenza alta e danno potenziato. La resistenza ne risente. Stile aggressivo ad alto rischio.",
    statLine: "ROF ×0.78  +1 DMG  -2 HP",
    accentColor: 0xf97316,
    iconKind: "boosterSpeed", // ricicla fino a icona dedicata
    cost: 32,
    isDefault: false,
    modifiers: [
      {
        target: "playerStat",
        stat: "fireRate",
        operation: "multiply",
        value: 0.78,
      },
      { target: "playerStat", stat: "damage", operation: "add", value: 1 },
      {
        target: "playerStat",
        stat: "maxHp",
        operation: "add",
        value: -2,
        min: 1,
      },
    ],
  },

  // ─── TORRETTE ────────────────────────────────────────────────────────────────

  {
    id: "turretBasic",
    category: "turrets",
    title: "Basic turret",
    description:
      "Difesa economica con raggio medio e fuoco stabile. Workhorse di ogni loadout.",
    statLine: "Run 6¢  range 100  ROF 1000ms  DMG 5  HP 20",
    accentColor: 0x38bdf8,
    iconKind: "turretBasic",
    cost: 0,
    isDefault: true,
    turret: {
      cost: 6,
      range: 100,
      fireRate: 1000,
      damage: 5,
      hp: 20,
      radius: 18,
      bodySize: 22,
      color: 0x38bdf8,
      strokeColor: 0xe0f2fe,
      beamColor: 0x67e8f9,
      pulseColor: 0x38bdf8,
    },
  },
  {
    id: "turretLongRange",
    category: "turrets",
    title: "Long range turret",
    description:
      "Copre molto spazio, ma lascia più pausa tra un colpo e l'altro.",
    statLine: "Run 6¢  range 170  ROF 1170ms  DMG 5  HP 20",
    accentColor: 0x818cf8,
    iconKind: "turretLongRange",
    cost: 38,
    isDefault: false,
    turret: {
      cost: 6,
      range: 170,
      fireRate: 1170,
      damage: 5,
      hp: 20,
      radius: 18,
      bodySize: 22,
      color: 0x818cf8,
      strokeColor: 0xe0e7ff,
      beamColor: 0xa5b4fc,
      pulseColor: 0x818cf8,
    },
  },
  {
    id: "turretTesla",
    category: "turrets",
    title: "Tesla Coil",
    description:
      "Fulmina i nemici vicini ad alta frequenza. Eccelle contro swarm.",
    statLine: "Run 6¢  range 60  ROF 500ms  DMG 2  HP 30",
    accentColor: 0xa855f7,
    iconKind: "turretTesla",
    cost: 55,
    isDefault: false,
    turret: {
      cost: 6,
      range: 60,
      fireRate: 500,
      damage: 2,
      hp: 30,
      radius: 18,
      bodySize: 22,
      color: 0xa855f7,
      strokeColor: 0xf3e8ff,
      beamColor: 0xd8b4fe,
      pulseColor: 0xa855f7,
    },
  },
  {
    id: "turretSiege",
    category: "turrets",
    title: "Siege cannon",
    description:
      "Fuoco lentissimo ma colpo devastante. Anti-brute e anti-boss. Inutile contro swarm.",
    statLine: "Run 8¢  range 160  ROF 2500ms  DMG 18  HP 35",
    accentColor: 0xf59e0b,
    iconKind: "turretBasic", // ricicla fino a iconKind dedicata
    cost: 68,
    isDefault: false,
    turret: {
      cost: 8,
      range: 160,
      fireRate: 2500,
      damage: 18,
      hp: 35,
      radius: 20,
      bodySize: 24,
      color: 0xf59e0b,
      strokeColor: 0xfef3c7,
      beamColor: 0xfcd34d,
      pulseColor: 0xf59e0b,
    },
  },

  // ─── MINE ────────────────────────────────────────────────────────────────────

  {
    id: "mineBasic",
    category: "mines",
    title: "Basic mine",
    description: "Trappola compatta: danno pieno in area controllabile.",
    statLine: "Run 3¢  trigger 34  area 92  DMG 4  HP 3",
    accentColor: 0xfacc15,
    iconKind: "mineBasic",
    cost: 0,
    isDefault: true,
    mine: {
      cost: 3,
      triggerRadius: 34,
      damageRadius: 92,
      damage: 4,
      hp: 3,
      radius: 12,
      color: 0xfacc15,
      strokeColor: 0xfef3c7,
      pulseColor: 0xfacc15,
    },
  },
  {
    id: "mineBlast",
    category: "mines",
    title: "Blast mine",
    description: "Esplosione ampia per sciami, danno leggermente ridotto.",
    statLine: "Run 3¢  trigger 34  area 134  DMG 3  HP 3",
    accentColor: 0xfb923c,
    iconKind: "mineBlast",
    cost: 34,
    isDefault: false,
    mine: {
      cost: 3,
      triggerRadius: 34,
      damageRadius: 134,
      damage: 3,
      hp: 3,
      radius: 14,
      color: 0xfb923c,
      strokeColor: 0xfef3c7,
      pulseColor: 0xfb923c,
    },
  },
  {
    id: "mineCluster",
    category: "mines",
    title: "Cluster mine",
    description:
      "Si attiva da lontano e genera danno in tre impulsi ravvicinati. Ottima contro i charger.",
    statLine: "Run 4¢  trigger 55  area 80  DMG 3×3  HP 4",
    accentColor: 0x4ade80,
    iconKind: "mineBasic", // ricicla fino a iconKind dedicata
    cost: 48,
    isDefault: false,
    mine: {
      cost: 4,
      triggerRadius: 55,
      damageRadius: 80,
      damage: 3,
      hp: 4,
      radius: 14,
      color: 0x4ade80,
      strokeColor: 0xd1fae5,
      pulseColor: 0x4ade80,
    },
    // Nota: la logica "3 impulsi" va implementata nel game engine;
    // lato dati la mina ha damage: 3 per impulso.
  },
  {
    id: "mineEMP",
    category: "mines",
    title: "EMP mine",
    description:
      "Danno minimo ma area enorme e slow applicato. Blocca charger e dirada swarm. Sinergizza con torrette.",
    statLine: "Run 4¢  trigger 40  area 180  DMG 1  slow ×0.4  HP 2",
    accentColor: 0x60a5fa,
    iconKind: "mineBasic",
    cost: 52,
    isDefault: false,
    mine: {
      cost: 4,
      triggerRadius: 40,
      damageRadius: 180,
      damage: 1,
      hp: 2,
      radius: 13,
      color: 0x60a5fa,
      strokeColor: 0xdbeafe,
      pulseColor: 0x60a5fa,
      slowMultiplier: 0.4, // aggiungi questo campo a MineDefinition se non c'è
    },
  },
];

export const loadMetaProgression = (): MetaProgressionState => {
  try {
    const serialized = window.localStorage.getItem(META_STORAGE_KEY);

    if (!serialized) {
      return createDefaultMetaState();
    }

    return normalizeMetaProgression(
      JSON.parse(serialized) as Partial<MetaProgressionState>,
    );
  } catch {
    return createDefaultMetaState();
  }
};

export const saveMetaProgression = (state: MetaProgressionState) => {
  window.localStorage.setItem(META_STORAGE_KEY, JSON.stringify(state));
};

export const applyLoadoutBonuses = (
  stats: PlayerStats,
  runUpgrades: RunUpgradeState,
  state: MetaProgressionState,
) => {
  stats.maxHp += state.upgrades.starterHull;
  stats.hp += state.upgrades.starterHull;
  stats.speed += state.upgrades.starterThrusters * 18;
  stats.pickupRadius += state.upgrades.starterMagnet * 18;

  SHOP_CATEGORIES.forEach((category) => {
    const item = getShopItem(state.loadout[category.id]);
    const itemLevel = item ? getShopItemLevel(state, item.id) : 0;

    applyModifiers({ stats, runUpgrades }, item?.modifiers);

    for (let level = 0; level < itemLevel; level += 1) {
      applyModifiers({ stats, runUpgrades }, item?.upgrade?.modifiersPerLevel);
    }
  });

  normalizeEquippedStats(stats);
};

export const calculatePostRunReward = (run: {
  level: number;
  wave: number;
}): PostRunRewardPreview => {
  const reachedLevel = Math.max(1, Math.floor(run.level));
  const reachedWave = Math.max(0, Math.floor(run.wave));

  return {
    reachedLevel,
    reachedWave,
    earnedCredits: reachedLevel * 2 + reachedWave * 3,
  };
};

export const grantPostRunCredits = (
  state: MetaProgressionState,
  reward: PostRunRewardPreview,
) => {
  state.postRunCredits += Math.max(0, Math.floor(reward.earnedCredits));
  saveMetaProgression(state);
};

export const isShopItemUnlocked = (
  state: MetaProgressionState,
  itemId: ShopItemId,
) => {
  const item = getShopItem(itemId);

  return Boolean(item?.isDefault || state.unlockedItems.includes(itemId));
};

export const equipShopItem = (
  state: MetaProgressionState,
  itemId: ShopItemId,
) => {
  const item = getShopItem(itemId);

  if (!item || !isShopItemUnlocked(state, item.id)) {
    return false;
  }

  state.loadout[item.category] = item.id;
  saveMetaProgression(state);

  return true;
};

export const buyShopItem = (
  state: MetaProgressionState,
  itemId: ShopItemId,
) => {
  const item = getShopItem(itemId);

  if (!item) {
    return false;
  }

  if (isShopItemUnlocked(state, item.id)) {
    return equipShopItem(state, item.id);
  }

  const cost = Math.max(0, Math.floor(item.cost));

  if (state.postRunCredits < cost) {
    return false;
  }

  state.postRunCredits -= cost;
  state.unlockedItems = mergeUnique(state.unlockedItems, [item.id]);
  state.loadout[item.category] = item.id;
  saveMetaProgression(state);

  return true;
};

export const getShopItemLevel = (
  state: MetaProgressionState,
  itemId: ShopItemId,
) => {
  const level = state.itemLevels[itemId];

  return typeof level === "number" && Number.isFinite(level)
    ? Math.max(0, Math.floor(level))
    : 0;
};

export const getShopItemUpgradeCost = (
  item: ShopItem,
  currentLevel: number,
) => {
  const level = Math.max(0, Math.floor(currentLevel));
  const baseCost = Math.max(MIN_ITEM_UPGRADE_COST, Math.floor(item.cost));

  return baseCost + level * Math.ceil(baseCost * 0.45) + level * level * 3;
};

export const upgradeShopItem = (
  state: MetaProgressionState,
  itemId: ShopItemId,
) => {
  const item = getShopItem(itemId);

  if (!item || !isShopItemUnlocked(state, item.id) || !item.upgrade) {
    return false;
  }

  const currentLevel = getShopItemLevel(state, item.id);
  const upgradeCost = getShopItemUpgradeCost(item, currentLevel);

  if (state.postRunCredits < upgradeCost) {
    return false;
  }

  state.postRunCredits -= upgradeCost;
  state.itemLevels[item.id] = currentLevel + 1;
  saveMetaProgression(state);

  return true;
};

export const getShopItem = (itemId: ShopItemId) => {
  return SHOP_ITEMS.find((item) => item.id === itemId);
};

const normalizeMetaProgression = (
  parsed: Partial<MetaProgressionState>,
): MetaProgressionState => {
  const defaultState = createDefaultMetaState();
  const permanentCoins = Number.isFinite(parsed.permanentCoins)
    ? Math.max(0, Math.floor(parsed.permanentCoins ?? 0))
    : 0;
  const postRunCredits = Number.isFinite(parsed.postRunCredits)
    ? Math.max(0, Math.floor(parsed.postRunCredits ?? 0))
    : 0;
  const unlockedItems = normalizeUnlockedItems(parsed.unlockedItems, parsed);
  const loadout = normalizeLoadout(parsed.loadout, unlockedItems);
  const itemLevels = normalizeShopItemLevels(parsed.itemLevels);

  return {
    permanentCoins,
    postRunCredits,
    upgrades: {
      starterHull: normalizeLegacyLevel(parsed.upgrades?.starterHull),
      starterThrusters: normalizeLegacyLevel(parsed.upgrades?.starterThrusters),
      starterMagnet: normalizeLegacyLevel(parsed.upgrades?.starterMagnet),
    },
    unlockedItems: mergeUnique(defaultState.unlockedItems, unlockedItems),
    itemLevels,
    loadout,
  };
};

const normalizeShopItemLevels = (itemLevels: unknown): ShopItemLevels => {
  if (!itemLevels || typeof itemLevels !== "object") {
    return {};
  }

  return Object.entries(itemLevels as Record<string, unknown>).reduce(
    (normalized, [itemId, level]) => {
      if (!isShopItemId(itemId) || typeof level !== "number") {
        return normalized;
      }

      normalized[itemId] = Math.max(0, Math.floor(level));
      return normalized;
    },
    {} as ShopItemLevels,
  );
};

const normalizeUnlockedItems = (
  unlockedItems: unknown,
  parsed: Partial<MetaProgressionState>,
) => {
  const ids = Array.isArray(unlockedItems)
    ? unlockedItems
        .map(normalizeLegacyShopItemId)
        .filter((itemId): itemId is ShopItemId => Boolean(itemId))
    : [];

  if ((parsed.upgrades?.starterThrusters ?? 0) > 0) {
    ids.push("boosterSpeed");
  }

  if ((parsed.upgrades?.starterMagnet ?? 0) > 0) {
    ids.push("boosterMagnet");
  }

  return mergeUnique(DEFAULT_UNLOCKED_ITEMS, ids);
};

const normalizeLoadout = (
  loadout: unknown,
  unlockedItems: ShopItemId[],
): ShopLoadout => {
  const candidate = loadout as Partial<ShopLoadout> | undefined;

  return {
    ships: normalizeLoadoutItem(candidate?.ships, "ships", unlockedItems),
    weapons: normalizeLoadoutItem(candidate?.weapons, "weapons", unlockedItems),
    boosters: normalizeLoadoutItem(
      candidate?.boosters,
      "boosters",
      unlockedItems,
    ),
    turrets: normalizeLoadoutItem(candidate?.turrets, "turrets", unlockedItems),
    mines: normalizeLoadoutItem(candidate?.mines, "mines", unlockedItems),
  };
};

const normalizeLoadoutItem = (
  itemId: ShopItemId | undefined,
  category: ShopCategory,
  unlockedItems: ShopItemId[],
) => {
  const normalizedItemId = normalizeLegacyShopItemId(itemId);
  const item = normalizedItemId ? getShopItem(normalizedItemId) : null;

  if (item && item.category === category && unlockedItems.includes(item.id)) {
    return item.id;
  }

  return DEFAULT_LOADOUT[category];
};

const normalizeLegacyLevel = (level: unknown) => {
  if (typeof level !== "number" || !Number.isFinite(level)) {
    return 0;
  }

  return Math.min(3, Math.max(0, Math.floor(level)));
};

const createDefaultMetaState = (): MetaProgressionState => ({
  permanentCoins: 0,
  postRunCredits: 0,
  upgrades: {
    starterHull: 0,
    starterThrusters: 0,
    starterMagnet: 0,
  },
  unlockedItems: [...DEFAULT_UNLOCKED_ITEMS],
  itemLevels: {},
  loadout: { ...DEFAULT_LOADOUT },
});

const normalizeEquippedStats = (stats: PlayerStats) => {
  stats.maxHp = Math.max(1, stats.maxHp);
  stats.hp = Math.min(Math.max(1, stats.hp), stats.maxHp);
  stats.damage = Math.max(1, stats.damage);
  stats.fireRate = Math.max(60, stats.fireRate);
  stats.bulletRange = Math.max(80, stats.bulletRange);
  stats.pickupRadius = Math.max(0, stats.pickupRadius);
  stats.multiShot = Math.max(1, Math.floor(stats.multiShot));
};

const createItemUpgradeDefinition = (item: ShopItem): ShopItem["upgrade"] => {
  if (item.category === "ships") {
    if (item.id === "shipTank") {
      return {
        label: "+1 HP, +0.2 DMG",
        modifiersPerLevel: [
          { target: "playerStat", stat: "maxHp", operation: "add", value: 1 },
          { target: "playerStat", stat: "hp", operation: "add", value: 1 },
          {
            target: "playerStat",
            stat: "damage",
            operation: "add",
            value: 0.2,
          },
        ],
      };
    }

    if (item.id === "shipLightFighter") {
      return {
        label: "+8 SPD, ROF -1.5%",
        modifiersPerLevel: [
          { target: "playerStat", stat: "speed", operation: "add", value: 8 },
          {
            target: "playerStat",
            stat: "fireRate",
            operation: "multiply",
            value: 0.985,
          },
        ],
      };
    }

    if (item.id === "shipSupport") {
      return {
        label: "+12 pickup, +4 turret range",
        modifiersPerLevel: [
          {
            target: "playerStat",
            stat: "pickupRadius",
            operation: "add",
            value: 12,
          },
          {
            target: "runUpgrade",
            stat: "turretRangeBonus",
            operation: "add",
            value: 4,
          },
        ],
      };
    }

    if (item.id === "shipSniper") {
      return {
        label: "+8 range, +0.25 DMG",
        modifiersPerLevel: [
          {
            target: "playerStat",
            stat: "bulletRange",
            operation: "add",
            value: 8,
          },
          {
            target: "playerStat",
            stat: "damage",
            operation: "add",
            value: 0.25,
          },
        ],
      };
    }

    return {
      label: "+0.15 DMG, +4 SPD",
      modifiersPerLevel: [
        { target: "playerStat", stat: "damage", operation: "add", value: 0.15 },
        { target: "playerStat", stat: "speed", operation: "add", value: 4 },
      ],
    };
  }

  if (item.category === "weapons") {
    if (item.id === "weaponRapid") {
      return {
        label: "ROF -1.5%, +0.1 DMG",
        modifiersPerLevel: [
          {
            target: "playerStat",
            stat: "fireRate",
            operation: "multiply",
            value: 0.985,
          },
          {
            target: "playerStat",
            stat: "damage",
            operation: "add",
            value: 0.1,
          },
        ],
      };
    }

    if (item.id === "weaponHeavy") {
      return {
        label: "+0.35 DMG, +4 range",
        modifiersPerLevel: [
          {
            target: "playerStat",
            stat: "damage",
            operation: "add",
            value: 0.35,
          },
          {
            target: "playerStat",
            stat: "bulletRange",
            operation: "add",
            value: 4,
          },
        ],
      };
    }

    if (item.id === "weaponShotgun" || item.id === "weaponScatter") {
      return {
        label: "+0.2 DMG, +5 range",
        modifiersPerLevel: [
          {
            target: "playerStat",
            stat: "damage",
            operation: "add",
            value: 0.2,
          },
          {
            target: "playerStat",
            stat: "bulletRange",
            operation: "add",
            value: 5,
          },
        ],
      };
    }

    return {
      label: "+0.2 DMG",
      modifiersPerLevel: [
        { target: "playerStat", stat: "damage", operation: "add", value: 0.2 },
      ],
    };
  }

  if (item.category === "boosters") {
    if (item.id === "boosterHull") {
      return {
        label: "+1 HP",
        modifiersPerLevel: [
          { target: "playerStat", stat: "maxHp", operation: "add", value: 1 },
          { target: "playerStat", stat: "hp", operation: "add", value: 1 },
        ],
      };
    }

    if (item.id === "boosterSpeed") {
      return {
        label: "+7 SPD",
        modifiersPerLevel: [
          { target: "playerStat", stat: "speed", operation: "add", value: 7 },
        ],
      };
    }

    if (item.id === "boosterMagnet") {
      return {
        label: "+14 pickup",
        modifiersPerLevel: [
          {
            target: "playerStat",
            stat: "pickupRadius",
            operation: "add",
            value: 14,
          },
        ],
      };
    }

    if (item.id === "boosterOverdrive") {
      return {
        label: "ROF -1%, +0.2 DMG",
        modifiersPerLevel: [
          {
            target: "playerStat",
            stat: "fireRate",
            operation: "multiply",
            value: 0.99,
          },
          {
            target: "playerStat",
            stat: "damage",
            operation: "add",
            value: 0.2,
          },
        ],
      };
    }

    return {
      label: "+3 SPD, +5 pickup",
      modifiersPerLevel: [
        { target: "playerStat", stat: "speed", operation: "add", value: 3 },
        {
          target: "playerStat",
          stat: "pickupRadius",
          operation: "add",
          value: 5,
        },
      ],
    };
  }

  if (item.category === "turrets") {
    if (item.id === "turretTesla") {
      return {
        label: "+0.25 DMG, ROF -1.5%",
        modifiersPerLevel: [
          {
            target: "runUpgrade",
            stat: "turretDamageBonus",
            operation: "add",
            value: 0.25,
          },
          {
            target: "runUpgrade",
            stat: "turretFireRateMultiplier",
            operation: "multiply",
            value: 0.985,
          },
        ],
      };
    }

    return {
      label: "+0.5 DMG, +3 range, +2 HP",
      modifiersPerLevel: [
        {
          target: "runUpgrade",
          stat: "turretDamageBonus",
          operation: "add",
          value: 0.5,
        },
        {
          target: "runUpgrade",
          stat: "turretRangeBonus",
          operation: "add",
          value: 3,
        },
        {
          target: "runUpgrade",
          stat: "turretHpBonus",
          operation: "add",
          value: 2,
        },
      ],
    };
  }

  if (item.id === "mineEMP") {
    return {
      label: "+5 area",
      modifiersPerLevel: [
        {
          target: "runUpgrade",
          stat: "mineRadiusBonus",
          operation: "add",
          value: 5,
        },
      ],
    };
  }

  return {
    label: "+0.5 DMG, +4 area",
    modifiersPerLevel: [
      {
        target: "runUpgrade",
        stat: "mineDamageBonus",
        operation: "add",
        value: 0.5,
      },
      {
        target: "runUpgrade",
        stat: "mineRadiusBonus",
        operation: "add",
        value: 4,
      },
    ],
  };
};

const DEFAULT_UNLOCKED_ITEMS = SHOP_ITEMS.filter((item) => item.isDefault).map(
  (item) => item.id,
);

const mergeUnique = <T>(...groups: T[][]) => {
  return Array.from(new Set(groups.flat()));
};

const normalizeLegacyShopItemId = (value: unknown): ShopItemId | undefined => {
  if (value === "shipCollector") {
    return "shipLightFighter";
  }

  return isShopItemId(value) ? value : undefined;
};

const isShopItemId = (value: unknown): value is ShopItemId => {
  return (
    typeof value === "string" && SHOP_ITEMS.some((item) => item.id === value)
  );
};

SHOP_ITEMS.forEach((item) => {
  item.upgrade = createItemUpgradeDefinition(item);
});
