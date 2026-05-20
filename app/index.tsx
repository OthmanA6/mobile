import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp } from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import { theme } from '../src/theme/theme';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  useEffect(() => {
    // Navigate to Login after delay
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Base Background Gradient */}
      <LinearGradient
        colors={['#020617', '#0f172a']}
        style={StyleSheet.absoluteFill}
      />

      {/* Contextual Background Texture Image */}
      <Image
        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCW6dXEs3-2iSdGTVzF0EFMyEcAQ7dxY4Ki68Qa7K8wAU5m2fso9vlMZzgT72EsHnksg2fDRBLD3iRHb6Oe8Vk1aObX8JIj5xRS39KZiN2QIU6JOIctyoi44O0IIr8YO7SV6DShbYKqVDix8IQcDZdEXA_Ljr7zeuqsckXbP0dI75OTwA8-ruW4AqtYJSnKPOTrUnk3g7Q8nzOdtBo_DoMnzLzqYeGIgka6-ltIdcGF3dGThH4uXRi0-yigFya57mpWMCVtxVkZm70' }}
        style={[StyleSheet.absoluteFill, { opacity: 0.2 }]}
        resizeMode="cover"
      />

      {/* Decorative Glows */}
      <Animatable.View animation="pulse" iterationCount="infinite" duration={4000} style={[styles.glow, styles.topGlow, { opacity: 0.2 }]} />
      <Animatable.View animation="pulse" iterationCount="infinite" duration={4000} delay={2000} style={[styles.glow, styles.bottomGlow, { opacity: 0.2 }]} />

      <Animatable.View animation="zoomIn" duration={1000} easing="ease-out-back" style={styles.logoContainer}>
        <View style={styles.iconBox}>
          <TrendingUp size={48} color={theme.colors.primary} strokeWidth={2.5} />
        </View>

        <Text style={styles.title}>insightO</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>ENTERPRISE AI</Text>
        </View>
      </Animatable.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>SECURE COMMAND CENTER</Text>
        <View style={styles.progressTrack}>
          <Animatable.View animation="slideInLeft" duration={3000} style={styles.progressBar} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  glow: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    backgroundColor: theme.colors.indigo,
  },
  topGlow: {
    top: -100,
    right: -100,
  },
  bottomGlow: {
    bottom: -100,
    left: -100,
    backgroundColor: theme.colors.primary,
  },
  logoContainer: {
    alignItems: 'center',
  },
  iconBox: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  badge: {
    marginTop: theme.spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.primary,
    letterSpacing: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.3)',
    letterSpacing: 3,
    marginBottom: 16,
  },
  progressTrack: {
    width: 120,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBar: {
    width: '40%',
    height: '100%',
    backgroundColor: theme.colors.primary,
  }
});
