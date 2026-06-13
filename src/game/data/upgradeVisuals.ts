import type { UpgradeCardVisual, UpgradeCategory } from "../types/gameplay";

const CATEGORY_VISUALS: Record<UpgradeCategory, UpgradeCardVisual> = {
  weapon: {
    iconKey: "weapon",
    backgroundKey: "weapon",
    accentColor: 0xfacc15,
    familyLabel: "Armi",
    shortEffect: "Potenza offensiva",
    rarity: "common",
  },
  ship: {
    iconKey: "ship",
    backgroundKey: "ship",
    accentColor: 0x2dd4bf,
    familyLabel: "Scafo",
    shortEffect: "Mobilita e resistenza",
    rarity: "common",
  },
  pickup: {
    iconKey: "pickup",
    backgroundKey: "pickup",
    accentColor: 0x22d3ee,
    familyLabel: "Cargo",
    shortEffect: "Raccolta e crescita",
    rarity: "common",
  },
  turret: {
    iconKey: "turret",
    backgroundKey: "turret",
    accentColor: 0x38bdf8,
    familyLabel: "Torrette",
    shortEffect: "Controllo difensivo",
    rarity: "uncommon",
  },
  mine: {
    iconKey: "mine",
    backgroundKey: "mine",
    accentColor: 0xfb923c,
    familyLabel: "Mine",
    shortEffect: "Danno ad area",
    rarity: "uncommon",
  },
  barricade: {
    iconKey: "barricade",
    backgroundKey: "barricade",
    accentColor: 0xe2e8f0,
    familyLabel: "Barricate",
    shortEffect: "Controllo dei flussi",
    rarity: "uncommon",
  },
  drone: {
    iconKey: "drone",
    backgroundKey: "drone",
    accentColor: 0xa78bfa,
    familyLabel: "Droni",
    shortEffect: "Supporto autonomo",
    rarity: "rare",
  },
  economy: {
    iconKey: "economy",
    backgroundKey: "economy",
    accentColor: 0xfbbf24,
    familyLabel: "Risorse",
    shortEffect: "Economia tattica",
    rarity: "common",
  },
};

export const getCategoryCardVisual = (category: UpgradeCategory) =>
  CATEGORY_VISUALS[category];

export const toHexColor = (color: number) =>
  `#${color.toString(16).padStart(6, "0")}`;
