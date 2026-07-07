import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';

interface RadialGlowOrbProps {
  color: string;
  size: number;
  style?: StyleProp<ViewStyle>;
}

export default function RadialGlowOrb({ color, size, style }: RadialGlowOrbProps) {
  return (
    <View style={[{ width: size, height: size, position: 'absolute' }, style]} pointerEvents="none">
      <Svg height="100%" width="100%">
        <Defs>
          <RadialGradient
            id="grad"
            cx="50%"
            cy="50%"
            rx="50%"
            ry="50%"
            fx="50%"
            fy="50%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="30%" stopColor={color} stopOpacity="0.8" />
            <Stop offset="70%" stopColor={color} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="50%" cy="50%" r="50%" fill="url(#grad)" />
      </Svg>
    </View>
  );
}
