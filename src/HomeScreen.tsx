import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo, Animated, Easing, Keyboard, KeyboardAvoidingView, PanResponder,
  Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions,
} from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Character from './Character';
import { colors, fonts, MOODS } from './theme';
import Onboarding, { OnboardingResult } from './Onboarding';
import { dateKey, loadEntries, loadSettings, patchSettings, saveEntry } from './storage';

const WEEK = '日月火水木金土';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const avatarSize = Math.min(width * 0.62, 240);

  const [ready, setReady] = useState(false);
  const [idx, setIdx] = useState(0);
  const [note, setNote] = useState('');
  const [sleeping, setSleeping] = useState(false);
  const [name, setName] = useState('もち');
  const [reduceMotion, setReduceMotion] = useState(false);
  const [onbDone, setOnbDone] = useState(true); // はじめの画面を済ませたか
  const [firstDone, setFirstDone] = useState(true); // 最初の1回を保存したか
  const [hintOff, setHintOff] = useState(false); // スワイプの案内を消したか

  // アニメーション用の値
  const float = useRef(new Animated.Value(0)).current;
  const slideX = useRef(new Animated.Value(0)).current;
  const slideO = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(1)).current; // 入力まわりの表示(1=見える)
  const bye = useRef(new Animated.Value(0)).current; // 「おやすみ」の文字

  // 起動時:保存済みデータを読み込む。今日すでに書いていたら「おやすみ」状態にする
  useEffect(() => {
    (async () => {
      const [entries, settings, rm] = await Promise.all([
        loadEntries(), loadSettings(), AccessibilityInfo.isReduceMotionEnabled(),
      ]);
      const hasData = Object.keys(entries).length > 0; // すでに使っている人には、はじめの画面を出さない
      setOnbDone(!!settings.onb || hasData);
      setFirstDone(!!settings.first || hasData);
      const today = entries[dateKey(new Date())];
      if (today && MOODS[today.mood]) {
        setIdx(today.mood);
        setNote(today.note || '');
        setSleeping(true);
        fade.setValue(0);
        bye.setValue(1);
      }
      setName((settings.look?.n || '').trim().slice(0, 8) || 'もち');
      setReduceMotion(rm);
      setReady(true);
    })();
  }, [fade, bye]);

  // キャラがふわふわ浮く(「動きを減らす」設定のときは止める)
  useEffect(() => {
    if (reduceMotion) { float.setValue(0); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: -8, duration: sleeping ? 4000 : 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: sleeping ? 4000 : 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, sleeping, float]);

  // 表情を切り替える(step: 1=次, -1=前)
  const go = (step: number) => {
    setIdx((i) => (i + step + MOODS.length) % MOODS.length);
    setHintOff(true);
    if (reduceMotion) return;
    slideX.setValue(step > 0 ? 50 : -50);
    slideO.setValue(0);
    Animated.parallel([
      Animated.timing(slideX, { toValue: 0, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(slideO, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  };
  // PanResponder は最初の1回しか作られないので、最新の go を ref 経由で呼ぶ
  const goRef = useRef(go);
  goRef.current = go;

  const swipe = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderRelease: (_, g) => {
      if (Math.abs(g.dx) > 40) goRef.current(g.dx < 0 ? 1 : -1);
    },
  }), []);

  const setSleep = (on: boolean) => {
    setSleeping(on);
    Animated.parallel([
      Animated.timing(fade, { toValue: on ? 0 : 1, duration: reduceMotion ? 0 : 600, useNativeDriver: true }),
      Animated.timing(bye, {
        toValue: on ? 1 : 0, duration: reduceMotion ? 0 : (on ? 1200 : 300),
        delay: on && !reduceMotion ? 600 : 0, useNativeDriver: true,
      }),
    ]).start();
  };

  const onSave = async () => {
    Keyboard.dismiss();
    await saveEntry(dateKey(new Date()), { mood: idx, note });
    if (!firstDone) { setFirstDone(true); await patchSettings({ first: true }); }
    setSleep(true);
  };

  // 3行まで・90文字までにそろえる
  const onChangeNote = (v: string) => setNote(v.split('\n').slice(0, 3).join('\n').slice(0, 90));

  if (!ready) return <View style={[styles.root, { backgroundColor: colors.bg }]} />;

  if (!onbDone) {
    const finish = async (r: OnboardingResult) => {
      await patchSettings({ onb: true, nt: r.nt, look: { n: r.name } });
      setName(r.name);
      setOnbDone(true);
    };
    return <Onboarding reduceMotion={reduceMotion} onDone={finish} />;
  }
  const showFirst = !firstDone; // 最初の1回だけの案内

  const now = new Date();
  const dateText = `${now.getMonth() + 1}月${now.getDate()}日(${WEEK[now.getDay()]})`;
  const glow = sleeping ? 0.07 : 0.13;

  return (
    <View style={[styles.root, { backgroundColor: sleeping ? colors.bgSleep : colors.bg }]}>
      {/* 月明かりのぼんやりした光 */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="g" cx="50%" cy={sleeping ? '38%' : '28%'} rx="70%" ry="40%" fx="50%" fy={sleeping ? '38%' : '28%'} gradientUnits="objectBoundingBox">
            <Stop offset="0" stopColor={colors.moon} stopOpacity={glow} />
            <Stop offset="1" stopColor={colors.moon} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#g)" />
      </Svg>

      <KeyboardAvoidingView
        style={[styles.app, { paddingTop: insets.top + 20, paddingBottom: Math.max(insets.bottom, 0) + 24 }]}
        behavior="padding"
      >
        <Animated.View style={[styles.top, { opacity: fade }]} pointerEvents={sleeping ? 'none' : 'auto'}>
          <Text style={styles.date}>{dateText}</Text>
          <Text style={styles.hello}>{showFirst ? 'さっそく、\n今日のこと聞かせてね' : 'おつかれさま。\n今日はどんな日だった?'}</Text>
        </Animated.View>

        <View style={styles.stage} {...swipe.panHandlers}>
          <Animated.View
            style={{ width: avatarSize, height: avatarSize, opacity: slideO, transform: [{ translateY: float }, { translateX: slideX }] }}
          >
            <Character face={sleeping ? 'sleep' : idx} />
          </Animated.View>

          <Animated.View style={{ opacity: fade, alignItems: 'center' }} pointerEvents={sleeping ? 'none' : 'auto'}>
            <View style={styles.picker}>
              <Pressable style={styles.arrow} onPress={() => go(-1)} accessibilityLabel="前の表情">
                <Text style={styles.arrowText}>◀</Text>
              </Pressable>
              <Text style={styles.label}>{MOODS[idx]}</Text>
              <Pressable style={styles.arrow} onPress={() => go(1)} accessibilityLabel="次の表情">
                <Text style={styles.arrowText}>▶</Text>
              </Pressable>
            </View>
            <View style={styles.dots}>
              {MOODS.map((_, i) => <View key={i} style={[styles.dot, i === idx && styles.dotOn]} />)}
            </View>
            {showFirst && !hintOff && <Text style={styles.hint}>左右にスワイプして、今日の顔を選んでね</Text>}
          </Animated.View>
        </View>

        <Animated.View style={{ opacity: fade }} pointerEvents={sleeping ? 'none' : 'auto'}>
          <TextInput
            style={styles.input}
            value={note}
            onChangeText={onChangeNote}
            placeholder="ひとこと、残していく?"
            placeholderTextColor={colors.sub}
            multiline
            maxLength={90}
            textAlignVertical="top"
            accessibilityLabel="ひとこと"
          />
          <Text style={styles.count}>{note.length} / 90</Text>
          <Pressable style={({ pressed }) => [styles.save, pressed && { transform: [{ scale: 0.97 }] }]} onPress={onSave}>
            <Text style={styles.saveText}>今日を残す</Text>
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.bye, { opacity: bye, bottom: Math.max(insets.bottom, 0) + 72 }]} pointerEvents={sleeping ? 'auto' : 'none'}>
          <Text style={styles.byeMain}>おやすみ。また明日ね</Text>
          <Text style={styles.byeSub}>{`— ${name}`}</Text>
          <Text style={styles.byeSub}>{`今日の顔:${MOODS[idx]}`}</Text>
          <Pressable onPress={() => setSleep(false)} style={styles.redo}>
            <Text style={styles.redoText}>書きなおす</Text>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  app: { flex: 1, width: '100%', maxWidth: 430, alignSelf: 'center', paddingHorizontal: 24 },
  top: { alignItems: 'center' },
  date: { color: colors.sub, fontSize: 14, letterSpacing: 1.1, fontFamily: fonts.regular },
  hello: { marginTop: 10, color: colors.text, fontSize: 21, lineHeight: 31, textAlign: 'center', fontFamily: fonts.medium },
  stage: { flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center' },
  picker: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 6 },
  arrow: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  arrowText: { color: colors.moon, fontSize: 18 },
  label: { minWidth: 92, textAlign: 'center', fontSize: 19, color: colors.moon, fontFamily: fonts.bold },
  dots: { flexDirection: 'row', gap: 8, marginTop: 12 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.card },
  dotOn: { width: 20, backgroundColor: colors.moon },
  input: {
    height: 92, borderRadius: 22, backgroundColor: colors.card, color: colors.text,
    fontSize: 16, lineHeight: 26, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 14, fontFamily: fonts.regular,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
  hint: { marginTop: 12, color: colors.moon, fontSize: 13, fontFamily: fonts.regular },
  count: { textAlign: 'right', color: colors.sub, fontSize: 12, marginTop: 6, marginRight: 6, marginBottom: 12, fontFamily: fonts.regular },
  save: { height: 56, borderRadius: 28, backgroundColor: colors.moon, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: colors.ink, fontSize: 17, fontFamily: fonts.bold },
  bye: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  byeMain: { color: colors.text, fontSize: 22, fontFamily: fonts.medium },
  byeSub: { marginTop: 8, color: colors.sub, fontSize: 13, fontFamily: fonts.regular },
  redo: { marginTop: 22, padding: 10 },
  redoText: { color: colors.sub, fontSize: 13, textDecorationLine: 'underline', fontFamily: fonts.regular },
});
