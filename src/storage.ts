import AsyncStorage from '@react-native-async-storage/async-storage';

export type Entry = { mood: number; note: string };
export type Entries = Record<string, Entry>;

const ENTRIES_KEY = 'oyasumi-diary-v1';
const SETTINGS_KEY = 'oyasumi-settings-v1';

const p2 = (n: number) => (n < 10 ? '0' : '') + n;

// 日付を「2026-11-09」の形の文字にする(日記のキーに使う)
export function dateKey(d: Date): string {
  return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
}

async function readJson(key: string): Promise<Record<string, any>> {
  try {
    const raw = await AsyncStorage.getItem(key);
    const obj = raw ? JSON.parse(raw) : {};
    return obj && typeof obj === 'object' ? obj : {};
  } catch {
    return {};
  }
}

export async function loadEntries(): Promise<Entries> {
  return (await readJson(ENTRIES_KEY)) as Entries;
}

export async function saveEntry(key: string, entry: Entry): Promise<void> {
  const all = await loadEntries();
  all[key] = entry;
  await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(all));
}

// キャラの名前(今は読むだけ。変更する画面はあとの機能で作る)
export async function loadCharacterName(): Promise<string> {
  const s = await readJson(SETTINGS_KEY);
  const n = s.look && typeof s.look.n === 'string' ? s.look.n.trim().slice(0, 8) : '';
  return n || 'もち';
}
