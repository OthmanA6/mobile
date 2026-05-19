import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { BookOpen } from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import { theme } from '../../src/theme/theme';

export default function InstructorModules() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background || '#020617', '#0f172a']}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Assigned Modules</Text>
        </View>

        <Animatable.View animation="fadeInUp" duration={800} style={styles.infoCard}>
          <BlurView intensity={20} tint="dark" style={styles.blurInner}>
            <BookOpen size={36} color="#6366f1" style={styles.infoIcon} />
            <Text style={styles.infoTitle}>Instructor Course List</Text>
            <Text style={styles.infoDescription}>
              Manage curriculum details, courses assigned to your instruction, and check registered students.
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
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
  },
  infoCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  blurInner: {
    padding: 24,
    alignItems: 'center',
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
