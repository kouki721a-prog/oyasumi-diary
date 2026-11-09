import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Easing, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Character from './Character';
import { colors, fonts, MOODS } from './theme';
import { clampNote, dateKey, Entries, loadEntries, saveEntry } from './storage';

const WEEK = '日月火水木金土';
const p2 = (n: number) => (n < 10 ? '0' : '') + n;
const keyOf = (y: number, m: number, d: number) => `${y}-${p2(m + 1)}-${p2(d)}`;
const label = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return `${m}月${d}日(${WEEK[new Date(y, m - 1, d).getDay()]})`;
};

type Props = { reduceMotion: boolean; onClose: () => void };

export default function History({ reduceMotion, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const slide = useRef(new Animated.Value(reduceMotion ? 0 : height)).current;

  const now = new Date();
  const [vy, setVy] = useState(now.getFullYear());
  const [vm, setVm] = useState(now.getMonth());
  const [sel, setSel] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [entries, setEntries] = useState<Entries>({});
  const [edMood, setEdMood] = useState(1);
  const [edNote, setEdNote] = useState('');

  useEffect(() => {
    loadEntries().then(setEntries);
    if (!reduceMotion) Animated.timing(slide, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [reduceMotion, slide]);

  const today = dateKey(new Date());
  const isCurrent = vy * 12 + vm >= now.getFullYear() * 12 + now.getMonth();
  const moveMonth = (d: number) => {
    let m = vm + d, y = vy;
    if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; }
    setVm(m); setVy(y); setSel(null); setEditing(false);
  };

  const first = new Date(vy, vm, 1).getDay();
  const days = new Date(vy, vm + 1, 0).getDate();
  let count = 0;
  const cells: React.ReactNode[] = [];
  for (let i = 0; i < first; i++) cells.push(<View key={`b${i}`} style={styles.cell} />);
  for (let d = 1; d <= days; d++) {
    const k = keyOf(vy, vm, d);
    const en = entries[k];
    const has = !!en && !!MOODS[en.mood];
    if (has) count++;
    const past = k < today;
    const selected = sel === k;
    const num = <Text style={[styles.num, has && styles.numHas]}>{d}</Text>;
    if (has || past) {
      cells.push(
        <View key={k} style={styles.cell}>
          <Pressable
            style={[styles.inner, has ? styles.has : styles.tap, selected && styles.sel]}
            onPress={() => selectDay(k)}
            accessibilityLabel={`${vm + 1}月${d}日 ${has ? MOODS[en.mood] : '記録なし'}`}
          >
            {has && <View style={styles.face}><Character face={en.mood} /></View>}
            {num}
          </Pressable>
        </View>,
      );
    } else {
      cells.push(<View key={k} style={styles.cell}>{num}</View>); // 今日・未来の日は選べない
    }
  }

  const se = sel ? entries[sel] : undefined;
  const has = !!se && !!MOODS[se.mood];
  const past = !!sel && sel < today;

  const startEdit = () => {
    setEdMood(se ? se.mood : 1);
    setEdNote(se ? se.note || '' : '');
    setEditing(true);
  };
  // 日をタップ:書きかけの内容をリセットして選ぶ(空の日は、そのまま書く画面になる)
  const selectDay = (k: string) => {
    setSel(k); setEditing(false); setEdMood(1); setEdNote('');
  };
  const onSave = async () => {
    if (!sel) return;
    await saveEntry(sel, { mood: edMood, note: edNote });
    setEntries(await loadEntries());
    setEditing(false);
  };

  const showEditor = past && (editing || !has);
  const detail = (() => {
    if (sel && showEditor) {
      return (
        <>
          <Text style={styles.dt}>{label(sel)}はどんな日だった?</Text>
          <View style={styles.moods}>
            {MOODS.map((m, i) => (
              <Pressable key={m} style={[styles.mb, i === edMood && styles.mbOn]} onPress={() => setEdMood(i)} accessibilityLabel={m}>
                <Character face={i} />
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.input}
            value={edNote}
            onChangeText={(v) => setEdNote(clampNote(v))}
            placeholder="ひとこと、残していく?"
            placeholderTextColor={colors.sub}
            multiline
            maxLength={90}
            textAlignVertical="top"
            accessibilityLabel="ひとこと"
          />
          <Pressable style={styles.saveSm} onPress={onSave}><Text style={styles.saveText}>この日を残す</Text></Pressable>
        </>
      );
    }
    if (sel && has && se) {
      return (
        <>
          <Text style={styles.dt}>{`${label(sel)}  ${MOODS[se.mood]}`}</Text>
          <Text style={styles.body}>{se.note || '(ひとことは、なしの日)'}</Text>
          {past && (
            <Pressable onPress={startEdit} style={styles.link}><Text style={styles.linkText}>書きなおす</Text></Pressable>
          )}
        </>
      );
    }
    return (
      <Text style={styles.body}>
        {count ? `この月は${count}日、残したよ。空いている日をタップすると、あとから残せるよ` : '今夜から、ゆっくり始めよう'}
      </Text>
    );
  })();

  return (
    <Animated.View style={[styles.root, { transform: [{ translateY: slide }] }]}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.head}>
            <Pressable style={[styles.arrow, false]} onPress={() => moveMonth(-1)} accessibilityLabel="前の月"><Text style={styles.arrowText}>◀</Text></Pressable>
            <Text style={styles.mtitle}>{`${vy}年${vm + 1}月`}</Text>
            <Pressable style={[styles.arrow, isCurrent && { opacity: 0.3 }]} disabled={isCurrent} onPress={() => moveMonth(1)} accessibilityLabel="次の月"><Text style={styles.arrowText}>▶</Text></Pressable>
          </View>
          <View style={styles.row7}>
            {[...WEEK].map((w) => <Text key={w} style={styles.wk}>{w}</Text>)}
          </View>
          <View style={styles.grid}>{cells}</View>
          <View style={styles.detail}>{detail}</View>
          <Pressable style={styles.close} onPress={onClose}><Text style={styles.closeText}>もどる</Text></Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { ...(StyleSheet.absoluteFill as object), backgroundColor: colors.bg, zIndex: 6 },
  scroll: { flex: 1 },
  content: { width: '100%', maxWidth: 430, alignSelf: 'center', paddingHorizontal: 20, flexGrow: 1 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  mtitle: { fontSize: 19, color: colors.moon, fontFamily: fonts.bold },
  arrow: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  arrowText: { color: colors.moon, fontSize: 18 },
  row7: { flexDirection: 'row', marginBottom: 6 },
  wk: { flex: 1, textAlign: 'center', color: colors.sub, fontSize: 12, fontFamily: fonts.regular },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.2857%', aspectRatio: 1, padding: 3 },
  inner: { flex: 1, borderRadius: 14 },
  has: { backgroundColor: colors.card },
  tap: { borderWidth: 1, borderColor: '#2C3C6E' },
  sel: { borderWidth: 2, borderColor: colors.moon },
  face: { ...StyleSheet.absoluteFill, margin: '10%' },
  num: { position: 'absolute', alignSelf: 'center', top: '50%', marginTop: -9, textAlign: 'center', width: '100%', color: colors.sub, fontSize: 12, fontFamily: fonts.regular },
  numHas: { top: 3, left: 5, width: undefined, alignSelf: undefined, marginTop: 0, fontSize: 10, textAlign: 'left' },
  detail: { marginTop: 18, marginBottom: 18, backgroundColor: colors.card, borderRadius: 22, padding: 16, paddingHorizontal: 18, minHeight: 84 },
  dt: { color: colors.moon, fontSize: 15, marginBottom: 4, fontFamily: fonts.bold },
  body: { color: colors.text, fontSize: 15, lineHeight: 26, fontFamily: fonts.regular },
  link: { marginTop: 8, paddingVertical: 8, alignSelf: 'flex-start' },
  linkText: { color: colors.sub, fontSize: 13, textDecorationLine: 'underline', fontFamily: fonts.regular },
  moods: { flexDirection: 'row', gap: 8, marginVertical: 10 },
  mb: { flex: 1, maxWidth: 56, aspectRatio: 1, borderRadius: 14, backgroundColor: colors.bgSleep, padding: 4, opacity: 0.5, borderWidth: 2, borderColor: 'transparent' },
  mbOn: { opacity: 1, borderColor: colors.moon },
  input: {
    height: 76, borderRadius: 16, backgroundColor: colors.bgSleep, color: colors.text, fontSize: 15, lineHeight: 24,
    paddingHorizontal: 14, paddingVertical: 12, fontFamily: fonts.regular, ...({ outlineStyle: 'none' } as object),
  },
  saveSm: { height: 48, marginTop: 10, borderRadius: 24, backgroundColor: colors.moon, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: colors.ink, fontSize: 15, fontFamily: fonts.bold },
  close: { marginTop: 'auto', height: 52, borderRadius: 26, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.text, fontSize: 16, fontFamily: fonts.regular },
});
