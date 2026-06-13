import type { SpecialDropDefinition, SpecialDropId } from "../types/gameplay";
import { IMAGE_KEYS } from "./imageAssets";

export const SPECIAL_DROPS: SpecialDropDefinition[] = [
  {
    id: "magnet-overload",
    title: "Magnet Overload",
    description: "Attrae tutti i pickup presenti nella mappa per 20 secondi.",
    durationMs: 20000,
    color: 0x22d3ee,
    iconKey: IMAGE_KEYS.magnet,
  },
  {
    id: "venom-rounds",
    title: "Munizioni Venom",
    description:
      "Aumenta del 20% il danno dei proiettili della nave per 30 secondi.",
    durationMs: 30000,
    color: 0x84cc16,
    iconKey: IMAGE_KEYS.venom,
  },
];

export const getSpecialDropById = (id: SpecialDropId) =>
  SPECIAL_DROPS.find((entry) => entry.id === id);
