import React, { ReactNode } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, Rect, Pattern, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '../src/context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface BackgroundWrapperProps {
  children: ReactNode;
}

export default function BackgroundWrapper({ children }: BackgroundWrapperProps) {
  const { themeMode } = useTheme();
  const isLight = themeMode === 'light';

  const cx = width / 2;
  const cy = height / 2;
  const r = Math.max(width, height) * 0.7;

  if (isLight) {
    return (
      <View style={[styles.container, { backgroundColor: '#f8fafc' }]}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <Pattern id="gridLight" width="40" height="40" patternUnits="userSpaceOnUse">
              <Rect width="40" height="1" fill="rgba(0,0,0,0.04)" />
              <Rect width="1" height="40" fill="rgba(0,0,0,0.04)" />
            </Pattern>
            <RadialGradient id="glowLight" cx={cx} cy={cy} rx={r} ry={r} fx={cx} fy={cy} gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor="rgba(147, 51, 234, 0.06)" />
              <Stop offset="70%" stopColor="rgba(147, 51, 234, 0)" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="#f8fafc" />
          <Rect width="100%" height="100%" fill="url(#glowLight)" />
          <Rect width="100%" height="100%" fill="url(#gridLight)" />
        </Svg>
        <View style={styles.content}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.containerDark]}>
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <Rect width="40" height="1" fill="rgba(255,255,255,0.05)" />
            <Rect width="1" height="40" fill="rgba(255,255,255,0.05)" />
          </Pattern>

          <RadialGradient id="glow" cx={cx} cy={cy} rx={r} ry={r} fx={cx} fy={cy} gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="rgba(147, 51, 234, 0.15)" />
            <Stop offset="70%" stopColor="rgba(147, 51, 234, 0)" />
          </RadialGradient>
        </Defs>

        <Rect width="100%" height="100%" fill="#020617" />
        <Rect width="100%" height="100%" fill="url(#glow)" />
        <Rect width="100%" height="100%" fill="url(#grid)" />
      </Svg>

      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerDark: {
    backgroundColor: '#020617',
  },
  content: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
