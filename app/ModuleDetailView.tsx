import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ArrowLeft, BookOpen, User, Building2, Calendar, Award } from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';

export default function ModuleDetailView() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { moduleId, courseName, courseCode, instructorName, description } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      {/* Background Gradients */}
      <LinearGradient
        colors={['#090514', '#0c0a1a', '#02010a']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.glowOrb, { top: -100, right: -100, backgroundColor: 'rgba(99, 102, 241, 0.15)' }]} />
      <View style={[styles.glowOrb, { bottom: 100, left: -150, backgroundColor: 'rgba(168, 85, 247, 0.1)' }]} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <BlurView intensity={30} tint="dark" style={styles.backBlur}>
            <ArrowLeft size={20} color="#fff" />
          </BlurView>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Module Details
        </Text>
        <View style={{ width: 44 }} /> {/* placeholder to center title */}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animatable.View animation="fadeInUp" duration={800} style={styles.cardContainer}>
          <BlurView intensity={45} tint="dark" style={styles.blurCard}>
            <View style={styles.iconContainer}>
              <BookOpen size={36} color="#6366f1" />
            </View>

            <View style={styles.codeBadge}>
              <Text style={styles.codeBadgeText}>{courseCode || 'N/A'}</Text>
            </View>

            <Text style={styles.courseName}>{courseName || 'Module Details'}</Text>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <User size={18} color="#94a3b8" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Instructor</Text>
                <Text style={styles.infoValue}>{instructorName || 'Unassigned Instructor'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Building2 size={18} color="#94a3b8" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Module ID</Text>
                <Text style={styles.infoValue}>{moduleId || 'N/A'}</Text>
              </View>
            </View>

            {description && (
              <>
                <View style={styles.divider} />
                <View style={styles.descriptionSection}>
                  <Text style={styles.descriptionLabel}>Course Description</Text>
                  <Text style={styles.descriptionValue}>{description}</Text>
                </View>
              </>
            )}
          </BlurView>
        </Animatable.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#02010a',
  },
  glowOrb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backButton: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBlur: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  cardContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  blurCard: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  codeBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 99,
    borderWidth: 0.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    marginBottom: 12,
  },
  codeBadgeText: {
    color: '#a5b4fc',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  courseName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 24,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    gap: 14,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  descriptionSection: {
    width: '100%',
    alignItems: 'flex-start',
  },
  descriptionLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  descriptionValue: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
});
