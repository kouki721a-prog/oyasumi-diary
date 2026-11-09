import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Easing, KeyboardAvoidingView, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions,
} from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Character from './Character';
import { colors, fonts } from './theme';

export type OnboardingResult = { name: string; nt: { on: boolean; time: string } };
type Props = { reduceMotion: boolean; onDone: (r: OnboardingResult) => void };

const p2 = (n: number) => (n < 10 ? '0' : '') + n;

export default function Onboarding({ reduceMotion, onDone }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const size = Math.min(width * 0.56, 210, height * 0.24);

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [hour, setHour] = useState(22);
  const [minute, setMinute] = useState(30);
  const finalName = name.trim().slice(0, 8) || 'もち';

  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: -8, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, float]);

  const say = step === 1
    ? 'はじめまして。\nぼくに名前をつけてくれる?'
    : `${finalName}だよ。よろしくね。\n寝る少し前に、そっと知らせるね。\n何時がいい?`;

  const stepHour = (d: number) => setHour((h) => (h + d + 24) % 24);
  const stepMinute = (d: number) => setMinute((m) => (m + d + 60) % 60);

  return (
    <View style={styles.root}>
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="og" cx="50%" cy="30%" rx="70%" ry="40%" fx="50%" fy="30%">
            <Stop offset="0" stopColor={colors.moon} stopOpacity={0.12} />
            <Stop offset="1" stopColor={colors.moon} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#og)" />
      </Svg>
      <KeyboardAvoidingView
        behavior="padding"
        style={[styles.col, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 32 }]}
      >
        <Animated.View style={{ width: size, height: size, transform: [{ translateY: float }] }}>
          <Character face={step === 1 ? 'sleep' : 0} />
        </Animated.View>
        <Text style={styles.say}>{say}</Text>

        {step === 1 ? (
          <View style={styles.step}>
            <TextInput
              style={styles.txt}
              value={name}
              onChangeText={(v) => setName(v.slice(0, 8))}
              placeholder="もち"
              placeholderTextColor={colors.sub}
              maxLength={8}
              autoCorrect={false}
              accessibilityLabel="キャラの名前"
            />
            <Pressable style={styles.save} onPress={() => setStep(2)}>
              <Text style={styles.saveText}>この名前にする</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.step}>
            <View style={styles.time}>
              <Stepper label="時" value={p2(hour)} onUp={() => stepHour(1)} onDown={() => stepHour(-1)} />
              <Text style={styles.colon}>:</Text>
              <Stepper label="分" value={p2(minute)} onUp={() => stepMinute(5)} onDown={() => stepMinute(-5)} />
            </View>
            <Pressable style={styles.save} onPress={() => onDone({ name: finalName, nt: { on: true, time: `${p2(hour)}:${p2(minute)}` } })}>
              <Text style={styles.saveText}>この時間にする</Text>
            </Pressable>
            <Pressable style={styles.later} onPress={() => onDone({ name: finalName, nt: { on: false, time: '22:30' } })}>
              <Text style={styles.laterText}>あとで決める</Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

function Stepper({ label, value, onUp, onDown }: { label: string; value: string; onUp: () => void; onDown: () => void }) {
  return (
    <View style={styles.stepper}>
      <Pressable style={styles.sbtn} onPress={onUp} accessibilityLabel={`${label}を増やす`}><Text style={styles.sbtnText}>▲</Text></Pressable>
      <Text style={styles.num}>{value}</Text>
      <Pressable style={styles.sbtn} onPress={onDown} accessibilityLabel={`${label}を減らす`}><Text style={styles.sbtnText}>▼</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  col: { flex: 1, width: '100%', maxWidth: 430, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 28 },
  say: { minHeight: 100, color: colors.text, fontSize: 19, lineHeight: 33, textAlign: 'center', fontFamily: fonts.medium },
  step: { width: '100%', alignItems: 'center', gap: 14 },
  txt: {
    width: '100%', maxWidth: 280, height: 48, borderRadius: 16, backgroundColor: colors.card, color: colors.text,
    fontSize: 20, textAlign: 'center', fontFamily: fonts.regular,
    ...({ outlineStyle: 'none' } as object),
  },
  save: { width: '100%', maxWidth: 320, height: 56, borderRadius: 28, backgroundColor: colors.moon, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: colors.ink, fontSize: 17, fontFamily: fonts.bold },
  later: { padding: 10 },
  laterText: { color: colors.sub, fontSize: 13, textDecorationLine: 'underline', fontFamily: fonts.regular },
  time: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  colon: { color: colors.text, fontSize: 32, fontFamily: fonts.medium },
  stepper: { alignItems: 'center', gap: 4 },
  sbtn: { width: 64, height: 36, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  sbtnText: { color: colors.moon, fontSize: 14 },
  num: { width: 80, textAlign: 'center', color: colors.text, fontSize: 34, fontFamily: fonts.medium, backgroundColor: '#2C3C6E', borderRadius: 14, paddingVertical: 6, overflow: 'hidden' },
});
