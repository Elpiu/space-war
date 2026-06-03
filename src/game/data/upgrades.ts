import type { Upgrade } from '../types/gameplay';

export const createUpgradePool = (): Upgrade[] => [
    {
        title: 'Cadenza rapida',
        description: 'Spari piu spesso.',
        apply: (stats) => {
            stats.fireRate *= 0.82;
        }
    },
    {
        title: 'Colpi pesanti',
        description: 'Aumenta il danno dei proiettili.',
        apply: (stats) => {
            stats.damage += 1;
        }
    },
    {
        title: 'Propulsori',
        description: 'La navicella si muove piu veloce.',
        apply: (stats) => {
            stats.speed += 35;
        }
    },
    {
        title: 'Magnete cargo',
        description: 'Raccogli pickup da piu lontano.',
        apply: (stats) => {
            stats.pickupRadius += 36;
        }
    },
    {
        title: 'Doppio arco',
        description: 'Aggiunge un proiettile laterale.',
        apply: (stats) => {
            stats.multiShot = Math.min(stats.multiShot + 1, 4);
        }
    },
    {
        title: 'Scafo rinforzato',
        description: 'Aumenta HP massimi e cura 2 HP.',
        apply: (stats) => {
            stats.maxHp += 2;
            stats.hp = Math.min(stats.maxHp, stats.hp + 2);
        }
    }
];
