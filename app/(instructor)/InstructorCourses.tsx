import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { BookOpen, Users, Award, Calendar, AlertCircle, AlertTriangle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import apiClient from '../../src/api/client';

interface CourseData {
  _id: string;
  courseCode: string;
  name: string;
  enrolledStudents: any[];
  enrolledCount: number;
  credits: number;
  description: string;
}

export default function InstructorCourses() {
  const insets = useSafeAreaInsets();
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/courses');
      const rawCourses = response.data.data.courses;

      const mapped: CourseData[] = rawCourses.map((c: any) => ({
        _id: c._id,
        courseCode: c.courseCode,
        name: c.name,
        enrolledStudents: c.enrolledStudents || [],
        enrolledCount: (c.enrolledStudents || []).length,
        credits: c.credits || 3,
        description: c.description || `Academic course ${c.courseCode} details and student grading rubrics.`,
      }));

      setCourses(mapped);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch assigned courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#090514', '#0c0a1a', '#02010a']}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.glowOrb, { top: '30%', left: '20%', backgroundColor: 'rgba(99, 102, 241, 0.2)' }]} />
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Syncing Courses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Dark Premium Gradient Background */}
      <LinearGradient
        colors={['#090514', '#0c0a1a', '#02010a']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient background glows */}
      <View style={[styles.glowOrb, { top: -100, right: -100, backgroundColor: 'rgba(99, 102, 241, 0.15)' }]} />
      <View style={[styles.glowOrb, { bottom: 100, left: -150, backgroundColor: 'rgba(168, 85, 247, 0.1)' }]} />

      <View style={[styles.mainWrapper, { paddingTop: Math.max(insets.top, 24) }]}>
        {/* Header */}
        <View style={styles.headerTop}>
          <Text style={styles.title}>My Courses</Text>
          <Text style={styles.subtitle}>List of active courses assigned to you for teaching, syllabus management and evaluations.</Text>
        </View>

        {error && (
          <Animatable.View animation="fadeInDown" style={styles.errorContainer}>
            <BlurView intensity={40} tint="dark" style={styles.errorBlur}>
              <View style={styles.errorLeft}>
                <AlertTriangle size={18} color="#f87171" style={styles.errorIcon} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
              <TouchableOpacity style={styles.retryBannerButton} onPress={fetchCourses}>
                <Text style={styles.retryBannerText}>Retry</Text>
              </TouchableOpacity>
            </BlurView>
          </Animatable.View>
        )}

        <FlatList
          data={courses}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 140 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Animatable.View animation="fadeInUp" duration={600} delay={index * 50} style={styles.courseCard}>
              <BlurView intensity={45} tint="dark" style={styles.blurInner}>
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <BookOpen size={24} color="#a5b4fc" />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.courseCode}>{item.courseCode}</Text>
                  <Text style={styles.courseName}>{item.name}</Text>
                </View>
              </View>

              <Text style={styles.description}>{item.description}</Text>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Users size={16} color="#94a3b8" />
                  <Text style={styles.statLabel}>{item.enrolledCount} Students</Text>
                </View>
                <View style={styles.statItem}>
                  <Award size={16} color="#94a3b8" />
                  <Text style={styles.statLabel}>{item.credits} Credits</Text>
                </View>
                <View style={styles.statItem}>
                  <Calendar size={16} color="#94a3b8" />
                  <Text style={styles.statLabel}>2026 Term</Text>
                </View>
              </View>
              </BlurView>
            </Animatable.View>
          )}
          ListEmptyComponent={
            <BlurView intensity={20} tint="dark" style={styles.emptyContainer}>
              <BookOpen size={36} color="#4f46e5" style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>No Courses Found</Text>
              <Text style={styles.emptyText}>No assigned courses found.</Text>
            </BlurView>
          }
        />
      </View>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#02010a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 16,
    textTransform: 'uppercase',
  },
  mainWrapper: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  headerTop: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '500',
    lineHeight: 20,
  },
  errorContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginBottom: 20,
  },
  errorBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  errorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  errorIcon: {
    marginRight: 10,
  },
  errorBannerText: {
    color: '#fca5a5',
    fontSize: 13,
    fontWeight: '600',
  },
  retryBannerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  retryBannerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  courseCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  blurInner: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  courseCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#a5b4fc',
    letterSpacing: 0.5,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 2,
  },
  description: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '500',
  },
  emptyContainer: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 20,
  },
  emptyIcon: {
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
});
