import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, ZenMaruGothic_400Regular, ZenMaruGothic_500Medium, ZenMaruGothic_700Bold } from '@expo-google-fonts/zen-maru-gothic';
import HomeScreen from './src/HomeScreen';
import { colors } from './src/theme';

export default function App() {
  const [loaded] = useFonts({ ZenMaruGothic_400Regular, ZenMaruGothic_500Medium, ZenMaruGothic_700Bold });
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {loaded ? <HomeScreen /> : <View style={{ flex: 1, backgroundColor: colors.bg }} />}
    </SafeAreaProvider>
  );
}
