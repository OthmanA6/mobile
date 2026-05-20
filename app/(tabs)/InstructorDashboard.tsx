import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ShieldAlert, TrendingUp, Users, ClipboardCheck, User } from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import { useRouter } from 'expo-router';
import { theme } from '../../src/theme/theme';

export default function InstructorDashboard() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background || '#020617', '#0f172a']}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.title}>Instructor Panel</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/ProfileScreen')}
            activeOpacity={0.7}
          >
            <BlurView intensity={30} tint="dark" style={styles.profileBlur}>
              <User size={20} color="#fff" />
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Quick Stats Bento Row */}
        <View style={styles.statsRow}>
          <Animatable.View animation="fadeInLeft" duration={800} style={styles.statCard}>
            <BlurView intensity={20} tint="dark" style={styles.blurInner}>
              <Users size={24} color="#6366f1" />
              <Text style={styles.statNumber}>120</Text>
              <Text style={styles.statLabel}>Total Students</Text>
            </BlurView>
          </Animatable.View>

          <Animatable.View animation="fadeInRight" duration={800} style={styles.statCard}>
            <BlurView intensity={20} tint="dark" style={styles.blurInner}>
              <ClipboardCheck size={24} color="#10b981" />
              <Text style={styles.statNumber}>8</Text>
              <Text style={styles.statLabel}>Pending Reviews</Text>
            </BlurView>
          </Animatable.View>
        </View>

        {/* Feature Info Card */}
        <Animatable.View animation="fadeInUp" duration={1000} delay={200} style={styles.infoCard}>
          <BlurView intensity={20} tint="dark" style={styles.blurInnerLarge}>
            <TrendingUp size={36} color="#6366f1" style={styles.infoIcon} />
            <Text style={styles.infoTitle}>Instructor Workspace</Text>
            <Text style={styles.infoDescription}>
              Track courses, manage active modules, provision task assignments, and review AI-graded student submissions.
            </Text>
          </BlurView>
        </Animatable.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 120,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileButton: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  profileBlur: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    height: 120,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  blurInner: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  blurInnerLarge: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    textAlign: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  infoCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoIcon: {
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
    textAlign: 'center',
  },
});
