import type {
  MetaProgressionState,
  PlayerStats,
  ShopCategory,
  ShopItem,
  ShopItemId,
  ShopLoadout,
} from "../types/gameplay";

const META_STORAGE_KEY = "space-war-meta-v1";

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
  {
    id: "shipScout",
    category: "ships",
    title: "Standard",
    description: "Telaio bilanciato: nessun bonus nascosto, nessuna penalita.",
    statLine: "HP 8  DMG 2  SPD 245  ROF 390",
    accentColor: 0x93c5fd,
    iconKind: "shipStandard",
    cost: 0,
    isDefault: true,
  },
  {
    id: "shipTank",
    category: "ships",
    title: "Tank",
    description:
      "Scafo pesante: colpi piu forti e molta vita, ma poca agilita.",
    statLine: "+4 HP  +1 danno  -48 velocita  fuoco +10%",
    accentColor: 0x2dd4bf,
    iconKind: "shipTank",
    cost: 45,
    isDefault: false,
    apply: (stats) => {
      stats.maxHp += 5;
      stats.hp += 5;
      stats.damage += 1.5;
      stats.speed -= 30;
      stats.fireRate *= 1.0;
    },
  },
  {
    id: "shipLightFighter",
    category: "ships",
    title: "Light Fighter",
    description:
      "Telaio rapido: entra ed esce dal pericolo, ma regge meno colpi.",
    statLine: "-2 HP  +42 velocita  fuoco -16%",
    accentColor: 0xfacc15,
    iconKind: "shipLight",
    cost: 42,
    isDefault: false,
    apply: (stats) => {
      stats.maxHp -= 2;
      stats.hp = Math.min(stats.hp, stats.maxHp);
      stats.speed += 42;
      stats.fireRate *= 0.84;
    },
  },
  {
    id: "shipSniper",
    category: "ships",
    title: "Sniper",
    description: "Lunga gittata e precisione chirurgica, ma ricarica lenta.",
    statLine: "+40 range  +3 danno  -50% cadenza",
    accentColor: 0xf472b6,
    iconKind: "shipSniper", // Assicurati di avere l'icona
    cost: 60,
    isDefault: false,
    apply: (stats) => {
      stats.bulletRange += 40;
      stats.damage += 3;
      stats.fireRate *= 0.5;
    },
  },
  {
    id: "weaponBase",
    category: "weapons",
    title: "Cannon base",
    description: "Arma standard affidabile, buona per ogni archetipo.",
    statLine: "Danno 2  cadenza 390ms",
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
      "Volume di fuoco alto: meno danno per colpo, piu pressione costante.",
    statLine: "Fuoco -28%  -1 danno",
    accentColor: 0x67e8f9,
    iconKind: "weaponRapid",
    cost: 35,
    isDefault: false,
    apply: (stats) => {
      stats.fireRate *= 0.72;
      stats.damage = Math.max(1, stats.damage - 1);
    },
  },
  {
    id: "weaponHeavy",
    category: "weapons",
    title: "Heavy cannon",
    description: "Colpi lenti e pesanti, utile contro bersagli resistenti.",
    statLine: "+2 danno  fuoco +28%",
    accentColor: 0xfb923c,
    iconKind: "weaponHeavy",
    cost: 42,
    isDefault: false,
    apply: (stats) => {
      stats.damage += 2;
      stats.fireRate *= 1.28;
    },
  },
  {
    id: "weaponShotgun",
    category: "weapons",
    title: "Shotgun",
    description:
      "Esplosione a corto raggio: proiettili multipli e danno massiccio.",
    statLine: "+3 multi-shot  -20 range  -1 danno",
    accentColor: 0xffffff,
    iconKind: "weaponShotgun",
    cost: 50,
    isDefault: false,
    apply: (stats) => {
      stats.multiShot += 3;
      stats.bulletRange -= 20;
      stats.damage = Math.max(1, stats.damage - 1);
    },
  },
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
    description: "Piastre extra: piu resistenza, accelerazione meno pronta.",
    statLine: "+2 HP  -16 velocita",
    accentColor: 0x34d399,
    iconKind: "boosterHull",
    cost: 20,
    isDefault: false,
    apply: (stats) => {
      stats.maxHp += 2;
      stats.hp += 2;
      stats.speed -= 16;
    },
  },
  {
    id: "boosterSpeed",
    category: "boosters",
    title: "Speed booster",
    description: "Propulsori leggeri: molta mobilita, ma scafo piu fragile.",
    statLine: "+34 velocita  -1 HP",
    accentColor: 0xa78bfa,
    iconKind: "boosterSpeed",
    cost: 24,
    isDefault: false,
    apply: (stats) => {
      stats.speed += 34;
      stats.maxHp -= 1;
      stats.hp = Math.min(stats.hp, stats.maxHp);
    },
  },
  {
    id: "boosterMagnet",
    category: "boosters",
    title: "Magnet booster",
    description:
      "Cargo magnetico: raccoglie da lontano, ma appesantisce il fuoco.",
    statLine: "+50 pickup  fuoco +6%",
    accentColor: 0x22d3ee,
    iconKind: "boosterMagnet",
    cost: 22,
    isDefault: false,
    apply: (stats) => {
      stats.pickupRadius += 50;
      stats.fireRate *= 1.06;
    },
  },
  {
    id: "turretBasic",
    category: "turrets",
    title: "Basic turret",
    description: "Difesa economica con raggio medio e fuoco stabile.",
    statLine: `Costo run 6  range medio`,
    accentColor: 0x38bdf8,
    iconKind: "turretBasic",
    cost: 0,
    isDefault: true,
  },
  {
    id: "turretLongRange",
    category: "turrets",
    title: "Long range turret",
    description:
      "Copre piu spazio, ma lascia piu pausa tra un raggio e l altro.",
    statLine: "+70 range  fuoco +170ms",
    accentColor: 0x818cf8,
    iconKind: "turretLongRange",
    cost: 38,
    isDefault: false,
  },
  {
    id: "turretTesla",
    category: "turrets",
    title: "Tesla Coil",
    description: "Fulmina i nemici vicini, infliggendo danni costanti.",
    statLine: "Danno ad area  corto raggio",
    accentColor: 0xa855f7,
    iconKind: "turretTesla",
    cost: 55,
    isDefault: false,
  },

  {
    id: "mineBasic",
    category: "mines",
    title: "Basic mine",
    description: "Trappola compatta: danno pieno in area controllabile.",
    statLine: "Costo run 3  danno 4",
    accentColor: 0xfacc15,
    iconKind: "mineBasic",
    cost: 0,
    isDefault: true,
  },
  {
    id: "mineBlast",
    category: "mines",
    title: "Blast mine",
    description: "Esplosione ampia per sciami, con danno leggermente ridotto.",
    statLine: "+42 area  -1 danno",
    accentColor: 0xfb923c,
    iconKind: "mineBlast",
    cost: 34,
    isDefault: false,
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
  state: MetaProgressionState,
) => {
  stats.maxHp += state.upgrades.starterHull;
  stats.hp += state.upgrades.starterHull;
  stats.speed += state.upgrades.starterThrusters * 18;
  stats.pickupRadius += state.upgrades.starterMagnet * 18;

  SHOP_CATEGORIES.forEach((category) => {
    const item = getShopItem(state.loadout[category.id]);

    item?.apply?.(stats);
  });
};

export const equipShopItem = (
  state: MetaProgressionState,
  itemId: ShopItemId,
) => {
  const item = getShopItem(itemId);

  if (!item) {
    return false;
  }

  state.unlockedItems = mergeUnique(state.unlockedItems, [item.id]);
  state.loadout[item.category] = item.id;
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
  const unlockedItems = normalizeUnlockedItems(parsed.unlockedItems, parsed);
  const loadout = normalizeLoadout(parsed.loadout, unlockedItems);

  return {
    permanentCoins,
    upgrades: {
      starterHull: normalizeLegacyLevel(parsed.upgrades?.starterHull),
      starterThrusters: normalizeLegacyLevel(parsed.upgrades?.starterThrusters),
      starterMagnet: normalizeLegacyLevel(parsed.upgrades?.starterMagnet),
    },
    unlockedItems: mergeUnique(
      defaultState.unlockedItems,
      unlockedItems,
      SHOP_ITEMS.map((item) => item.id),
    ),
    loadout,
  };
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

  return mergeUnique(
    DEFAULT_UNLOCKED_ITEMS,
    ids,
    SHOP_ITEMS.map((item) => item.id),
  );
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
  upgrades: {
    starterHull: 0,
    starterThrusters: 0,
    starterMagnet: 0,
  },
  unlockedItems: [...DEFAULT_UNLOCKED_ITEMS],
  loadout: { ...DEFAULT_LOADOUT },
});

const DEFAULT_UNLOCKED_ITEMS = SHOP_ITEMS.map((item) => item.id);

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
