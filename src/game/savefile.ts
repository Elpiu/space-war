/**
 * Esporta e importa tutti i salvataggi del gioco (chiavi "space-war-…" del
 * localStorage) in un file JSON.
 */
const PREFIX = "space-war-";

interface SaveFile {
  game: "space-war";
  version: 1;
  exported: string;
  data: Record<string, string>;
}

const collect = (): Record<string, string> => {
  const data: Record<string, string> = {};
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key?.startsWith(PREFIX)) continue;
      const value = window.localStorage.getItem(key);
      if (value !== null) data[key] = value;
    }
  } catch {
    // Storage non disponibile: file vuoto.
  }
  return data;
};

/** Scarica il salvataggio come file JSON. */
export const exportSave = () => {
  const file: SaveFile = { game: "space-war", version: 1, exported: new Date().toISOString(), data: collect() };
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `space-war-salvataggio-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return Object.keys(file.data).length;
};

/** Legge e controlla un file di salvataggio. Restituisce i dati o un messaggio d'errore. */
export const readSave = async (file: File): Promise<{ data: Record<string, string> } | { error: string }> => {
  try {
    const parsed = JSON.parse(await file.text()) as Partial<SaveFile>;
    if (parsed.game !== "space-war" || typeof parsed.data !== "object" || !parsed.data) return { error: "Non è un salvataggio di Space War" };
    const data: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      if (key.startsWith(PREFIX) && typeof value === "string") data[key] = value;
    }
    if (Object.keys(data).length === 0) return { error: "Il file non contiene dati" };
    return { data };
  } catch {
    return { error: "File illeggibile" };
  }
};

/** Sostituisce i salvataggi attuali con quelli importati. */
export const applySave = (data: Record<string, string>) => {
  try {
    for (const key of Object.keys(collect())) window.localStorage.removeItem(key);
    for (const [key, value] of Object.entries(data)) window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};
