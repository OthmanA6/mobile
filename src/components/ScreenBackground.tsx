import React, { ReactNode } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import RadialGlowOrb from './RadialGlowOrb';

interface ScreenBackgroundProps {
  children: ReactNode;
  /** Override the top-right orb position (default: top -150, right -200) */
  topOrbStyle?: object;
  /** Override the bottom-left orb position (default: bottom -50, left -200) */
  bottomOrbStyle?: object;
  style?: StyleProp<ViewStyle>;
}

/**
 * Shared screen background: dark gradient + two radial glow orbs + blur overlay.
 * Wrap your screen's root View content inside this component.
 *
 * Usage:
 *   <ScreenBackground>
 *     <YourContent />
 *   </ScreenBackground>
 */
export default function ScreenBackground({
  children,
  topOrbStyle = { top: -150, right: -200 },
  bottomOrbStyle = { bottom: -50, left: -200 },
  style,
}: ScreenBackgroundProps) {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  return (
    <View style={[styles.container, style]}>
      {isDark ? (
        <LinearGradient
          colors={['#090514', '#0c0a1a', '#02010a']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {isDark ? (
        <RadialGlowOrb color="rgba(99,102,241,0.6)" size={500} style={topOrbStyle} />
      ) : null}
      {isDark ? (
        <RadialGlowOrb color="rgba(168,85,247,0.5)" size={500} style={bottomOrbStyle} />
      ) : null}
      {isDark ? (
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
});
