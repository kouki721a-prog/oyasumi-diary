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

// 設定(はじめの画面を済ませたか、おしらせ、キャラの名前など)
export type Settings = {
  onb?: boolean; // はじめの画面を済ませた
  first?: boolean; // 最初の1回を保存した
  nt?: { on: boolean; time: string }; // おしらせ(オン/オフ・時刻)
  look?: { n?: string }; // キャラの名前(色・アクセサリーはあとの機能で追加)
};

export async function loadSettings(): Promise<Settings> {
  return (await readJson(SETTINGS_KEY)) as Settings;
}

// 設定の一部だけを書きかえる
export async function patchSettings(patch: Settings): Promise<void> {
  const cur = await loadSettings();
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...cur, ...patch }));
}
