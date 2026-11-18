import { RARITIES } from "../../data/upgrades";
import { GEAR_MAX_LEVEL, mustGearDef, rollGear } from "./gear";
import { addLoot, completeNode, itemByUid, saveProfile, slotKeys, type CampaignProfile } from "./profile";
import { eventCoins, type SectorNode } from "./sectors";

/** Una scelta di un nodo senza combattimento. */
export interface NodeChoice {
  label: string;
  detail: string;
  /** Motivo per cui non si può scegliere (per esempio monete insufficienti). */
  blocked?: string;
  /** Applica la scelta al profilo e restituisce l'esito da mostrare. */
  apply: (profile: CampaignProfile) => string;
}

export interface NodeContent {
  title: string;
  text: string;
  choices: NodeChoice[];
}

const loot = (profile: CampaignProfile, node: SectorNode, minRarity: "common" | "uncommon" | "rare") => {
  const [item] = addLoot(profile, [rollGear(5, minRarity, node.ilvl)]);
  return `${mustGearDef(item.defId).title} (${RARITIES[item.rarity].label.toLowerCase()})`;
};

const equippedItems = (profile: CampaignProfile) =>
  slotKeys(profile)
    .map((key) => itemByUid(profile, profile.equipped[key]))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

/** Contenuto di cantiere, evento o tesoro. Le scelte con rischio usano un tiro casuale. */
export const nodeContent = (profile: CampaignProfile, node: SectorNode): NodeContent => {
  const coins = eventCoins(node);
  if (node.kind === "shipyard") {
    const weakest = equippedItems(profile)
      .filter((i) => i.level < GEAR_MAX_LEVEL)
      .sort((a, b) => a.level - b.level)[0];
    return {
      title: "Cantiere di passaggio",
      text: "Un'officina indipendente ancorata fra i rottami. Il capocantiere offre un solo lavoro, poi riparte.",
      choices: [
        {
          label: "Revisione gratuita",
          detail: weakest ? `+1 livello a ${mustGearDef(weakest.defId).title} (liv. ${weakest.level})` : "Nessun pezzo da potenziare",
          blocked: weakest ? undefined : "Tutti i pezzi montati sono al massimo",
          apply: () => {
            weakest!.level += 1;
            return `${mustGearDef(weakest!.defId).title} sale al livello ${weakest!.level}`;
          },
        },
        {
          label: "Vendi i rottami di bordo",
          detail: `+${Math.round(coins * 1.6)} monete`,
          apply: (p) => {
            p.coins += Math.round(coins * 1.6);
            return `+${Math.round(coins * 1.6)} monete`;
          },
        },
      ],
    };
  }
  if (node.kind === "treasure") {
    return {
      title: "Carico alla deriva",
      text: "Un container corporate perso durante un trasloco orbitale. Nessuno verrà a reclamarlo.",
      choices: [
        {
          label: "Apri il carico",
          detail: `Pezzo non comune o migliore e ${coins} monete`,
          apply: (p) => {
            p.coins += coins;
            return `Trovati ${loot(p, node, "uncommon")} e ${coins} monete`;
          },
        },
      ],
    };
  }
  switch (node.event) {
    case "smuggler": {
      const price = Math.round(coins * 2.2);
      return {
        title: "Contrabbandiere",
        text: "Un mercante senza licenza propone una cassa sigillata. Dice che dentro c'è roba buona. Dice.",
        choices: [
          {
            label: `Compra la cassa (${price} monete)`,
            detail: "Pezzo raro o migliore",
            blocked: profile.coins < price ? "Monete insufficienti" : undefined,
            apply: (p) => {
              p.coins -= price;
              return `Dentro c'era ${loot(p, node, "rare")}`;
            },
          },
          { label: "Rifiuta", detail: "Prosegui senza perdere niente", apply: () => "Il contrabbandiere sparisce nel buio" },
        ],
      };
    }
    case "distress":
      return {
        title: "Segnale di soccorso",
        text: "Una richiesta d'aiuto da una scialuppa. Potrebbe essere una trappola pirata.",
        choices: [
          {
            label: "Rispondi",
            detail: `50%: pezzo e ${coins * 2} monete · 50%: trappola, perdi ${Math.round(coins / 2)} monete`,
            apply: (p) => {
              if (Math.random() < 0.5) {
                p.coins += coins * 2;
                return `Equipaggio salvato! Ricompensa: ${loot(p, node, "uncommon")} e ${coins * 2} monete`;
              }
              const lost = Math.min(p.coins, Math.round(coins / 2));
              p.coins -= lost;
              return `Era una trappola: ripari di fortuna, -${lost} monete`;
            },
          },
          {
            label: "Tira dritto",
            detail: `Registra il segnale e vendi i dati: +${Math.round(coins / 2)} monete`,
            apply: (p) => {
              p.coins += Math.round(coins / 2);
              return `+${Math.round(coins / 2)} monete`;
            },
          },
        ],
      };
    case "lab":
      return {
        title: "Laboratorio pirata",
        text: "Uno scienziato radiato offre di provare un prototipo sulla tua nave. Gratis, per la scienza.",
        choices: [
          {
            label: "Prova il prototipo",
            detail: "70%: +1 livello a un pezzo montato · 30%: -1 livello",
            apply: (p) => {
              const items = equippedItems(p);
              const item = items[Math.floor(Math.random() * items.length)];
              if (!item) return "Nessun pezzo montato";
              const name = mustGearDef(item.defId).title;
              if (Math.random() < 0.7 && item.level < GEAR_MAX_LEVEL) {
                item.level += 1;
                return `Funziona! ${name} sale al livello ${item.level}`;
              }
              if (item.level > 1) {
                item.level -= 1;
                return `Esplosione controllata: ${name} scende al livello ${item.level}`;
              }
              return `Il prototipo non fa niente a ${name}`;
            },
          },
          {
            label: "Vendigli i tuoi dati di volo",
            detail: `+${coins} monete`,
            apply: (p) => {
              p.coins += coins;
              return `+${coins} monete`;
            },
          },
        ],
      };
    default:
      return {
        title: "Relitto alla deriva",
        text: "Una nave da carico spenta, con i portelli aperti. Qualcuno è passato prima di te... forse.",
        choices: [
          {
            label: "Saccheggia",
            detail: `65%: pezzo raro · 35%: una carica esplode, perdi ${coins} monete`,
            apply: (p) => {
              if (Math.random() < 0.65) return `Bottino: ${loot(p, node, "rare")}`;
              const lost = Math.min(p.coins, coins);
              p.coins -= lost;
              return `Boom. Riparazioni: -${lost} monete`;
            },
          },
          {
            label: "Recupera i rottami esterni",
            detail: `+${coins} monete sicure`,
            apply: (p) => {
              p.coins += coins;
              return `+${coins} monete`;
            },
          },
        ],
      };
  }
};

/** Applica una scelta e completa il nodo. */
export const resolveNode = (profile: CampaignProfile, node: SectorNode, index: number) => {
  const choice = nodeContent(profile, node).choices[index];
  if (!choice || choice.blocked || profile.completed.includes(node.id)) return "";
  const outcome = choice.apply(profile);
  completeNode(profile, node.id);
  profile.nodeOutcomes[node.id] = outcome;
  saveProfile(profile);
  return outcome;
};
