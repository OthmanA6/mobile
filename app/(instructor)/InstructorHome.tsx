import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, BackHandler, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { Users, ClipboardCheck, BookOpen, TrendingUp, AlertCircle, Calendar, AlertTriangle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import apiClient from '../../src/api/client';

interface DashboardData {
  metrics: {
    totalModules: number;
    totalStudents: number;
    avgPerformance: number;
    pendingReviews: number;
  };
  recentModules: {
    _id: string;
    courseCode: string;
    name: string;
    enrolledCount: number;
  }[];
  activeTasks: {
    _id: string;
    title: string;
    courseId: {
      courseCode: string;
    };
    deadline: string;
  }[];
}

export default function InstructorHome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setError(null);
      // Compose dashboard from two role-aware endpoints in parallel
      const [coursesRes, tasksRes] = await Promise.all([
        apiClient.get('/courses'),
        apiClient.get('/tasks'),
      ]);

      const courses: any[] = coursesRes.data.data.courses || [];
      const tasks: any[] = tasksRes.data.data.tasks || [];

      // Derive total enrolled students across all courses
      const totalStudents = courses.reduce(
        (sum: number, c: any) => sum + (c.enrolledStudents?.length || 0),
        0
      );

      // Build courseId → courseCode map since course_id is NOT populated in tasks
      const courseMap: Record<string, string> = {};
      for (const c of courses) {
        courseMap[c._id] = c.courseCode;
      }

      // Active tasks = tasks that have a deadline in the future
      const now = new Date();
      const activeTasks = tasks
        .filter((t: any) => t.status !== 'COMPLETED' && new Date(t.deadline) > now)
        .slice(0, 10)
        .map((t: any) => ({
          _id: t._id,
          title: t.title,
          courseId: { courseCode: courseMap[t.target?.course_id] || '' },
          deadline: t.deadline,
        }));

      setData({
        metrics: {
          totalModules: courses.length,
          totalStudents,
          avgPerformance: 0, // No endpoint for this yet
          pendingReviews: tasks.filter((t: any) => t.status === 'PENDING').length,
        },
        recentModules: courses.slice(0, 6).map((c: any) => ({
          _id: c._id,
          courseCode: c.courseCode,
          name: c.name,
          enrolledCount: c.enrolledStudents?.length || 0,
        })),
        activeTasks,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    const backAction = () => {
      Alert.alert('Hold on!', 'Are you sure you want to exit?', [
        {
          text: 'Cancel',
          onPress: () => null,
          style: 'cancel',
        },
        { text: 'YES', onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
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
        <Text style={styles.loadingText}>Syncing Dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDashboard}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderMetricCard = (title: string, value: string | number, icon: React.ReactNode) => (
    <View style={styles.metricCard}>
      <BlurView intensity={50} tint="dark" style={styles.blurInner}>
        <View style={styles.metricIcon}>{icon}</View>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricTitle}>{title}</Text>
      </BlurView>
    </View>
  );

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
        <FlatList
          data={[]}
          renderItem={null}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 140 }]}
          ListHeaderComponent={
            <>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Command Center</Text>
                <Text style={styles.subtitle}>Overview and active module tasks</Text>
              </View>

              {error && (
                <Animatable.View animation="fadeInDown" style={styles.errorContainer}>
                  <BlurView intensity={40} tint="dark" style={styles.errorBlur}>
                    <View style={styles.errorLeft}>
                      <AlertTriangle size={18} color="#f87171" style={styles.errorIcon} />
                      <Text style={styles.errorBannerText}>{error}</Text>
                    </View>
                    <TouchableOpacity style={styles.retryBannerButton} onPress={fetchDashboard}>
                      <Text style={styles.retryBannerText}>Retry</Text>
                    </TouchableOpacity>
                  </BlurView>
                </Animatable.View>
              )}

              {/* Metrics 2x2 Grid */}
              <View style={styles.metricsGrid}>
                {renderMetricCard('Total Modules', data?.metrics.totalModules || 0, <BookOpen size={20} color="#cfbcff" />)}
                {renderMetricCard('Total Students', data?.metrics.totalStudents || 0, <Users size={20} color="#cfbcff" />)}
                {renderMetricCard('Avg Performance', `${data?.metrics.avgPerformance || 0}%`, <TrendingUp size={20} color="#cfbcff" />)}
                {renderMetricCard('Pending Reviews', data?.metrics.pendingReviews || 0, <ClipboardCheck size={20} color="#cfbcff" />)}
              </View>

              {/* Recent Modules */}
              <Text style={styles.sectionTitle}>Recent Modules</Text>
              {data?.recentModules && data.recentModules.length > 0 ? (
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={data.recentModules}
                  keyExtractor={(item) => item._id}
                  contentContainerStyle={styles.horizontalList}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.moduleCard}
                      onPress={() => router.push({ pathname: '/(instructor)/InstructorCourses', params: { courseId: item._id } })}
                    >
                      <BlurView intensity={45} tint="dark" style={styles.moduleBlurInner}>
                        <Text style={styles.moduleCode}>{item.courseCode}</Text>
                        <Text style={styles.moduleName} numberOfLines={1}>{item.name}</Text>
                        <View style={styles.moduleFooter}>
                          <Users size={12} color="#94a3b8" />
                          <Text style={styles.moduleStudents}>{item.enrolledCount} Enrolled</Text>
                        </View>
                      </BlurView>
                    </TouchableOpacity>
                  )}
                />
              ) : (
                <Text style={styles.emptyText}>No recent modules found.</Text>
              )}

              {/* Active Tasks Feed */}
              <Text style={styles.sectionTitle}>Active Task Feed</Text>
              {data?.activeTasks && data.activeTasks.length > 0 ? (
                data.activeTasks.map((task) => (
                  <View key={task._id} style={styles.taskCard}>
                    <BlurView intensity={45} tint="dark" style={styles.taskBlurInner}>
                      <View style={styles.taskInfo}>
                        <Text style={styles.taskCourse}>{task.courseId?.courseCode}</Text>
                        <Text style={styles.taskTitle}>{task.title}</Text>
                        <View style={styles.taskMeta}>
                          <Calendar size={14} color="#94a3b8" />
                          <Text style={styles.taskDeadline}>
                            {new Date(task.deadline).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity 
                        style={styles.reviewButton}
                        onPress={() => router.push('/(instructor)/StudentDirectory')} // Fallback page redirect
                      >
                        <Text style={styles.reviewButtonText}>View</Text>
                      </TouchableOpacity>
                    </BlurView>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No active tasks right now.</Text>
              )}
            </>
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
  header: {
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricCard: {
    width: '48%',
    height: 110,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  blurInner: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  metricIcon: {
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  metricTitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    marginTop: 8,
  },
  horizontalList: {
    paddingBottom: 8,
  },
  moduleCard: {
    width: 160,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  moduleBlurInner: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  moduleCode: {
    fontSize: 12,
    color: '#a5b4fc',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  moduleName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginTop: 4,
  },
  moduleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
  },
  moduleStudents: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 6,
  },
  taskCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  taskBlurInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },
  taskInfo: {
    flex: 1,
    marginRight: 16,
  },
  taskCourse: {
    fontSize: 12,
    color: '#a5b4fc',
    fontWeight: '700',
  },
  taskTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskDeadline: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 6,
  },
  reviewButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: '#6366f1',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  reviewButtonText: {
    color: '#a5b4fc',
    fontWeight: '700',
    fontSize: 14,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6366f1',
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
    marginBottom: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
});
