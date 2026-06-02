import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { BookOpen, Users, Award, Calendar, AlertCircle } from 'lucide-react-native';
import apiClient from '../../src/api/client';

interface CourseData {
  _id: string;
  courseCode: string;
  name: string;
  enrolledCount: number;
  credits: number;
  description: string;
}

export default function InstructorCourses() {
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      // Retrieve modules data from backend dashboard aggregation
      const response = await apiClient.get('/instructor/dashboard');
      const data = response.data.data;
      
      // Adapt recentModules to include credits/description for preview
      const mapped = data.recentModules.map((c: any) => ({
        _id: c._id,
        courseCode: c.courseCode,
        name: c.name,
        enrolledCount: c.enrolledCount,
        credits: 3, // Default fallback
        description: `Academic course ${c.courseCode} details and student grading rubrics.`
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
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCourses}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={courses}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
          <>
            <Text style={styles.subtitle}>List of active courses assigned to you for teaching, syllabus management and evaluations.</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.courseCard}>
            <BlurView intensity={20} tint="dark" style={styles.blurInner}>
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <BookOpen size={24} color="#F59E0B" />
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
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No assigned courses found.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 110,
    paddingHorizontal: 20,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  courseCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
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
    color: '#F59E0B',
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
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 40,
  },
});
