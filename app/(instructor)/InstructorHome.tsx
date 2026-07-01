import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { Users, ClipboardCheck, BookOpen, AlertTriangle, Calendar, Bell, User, Target, Clock, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import apiClient from '../../src/api/client';

interface Course {
  _id: string;
  courseCode: string;
  name: string;
  enrolledStudents?: any[];
  instructorId?: any;
  description?: string;
  credits?: number;
}

interface Task {
  _id: string;
  title: string;
  description?: string;
  deadline: string;
  status: string;
  createdAt?: string;
  target?: {
    course_id?: string;
  };
}

interface Submission {
  _id: string;
  task_id: string;
  status: 'SUBMITTED' | 'AI_GRADED' | 'FINALIZED';
  submitter_id?: any;
  final_grade?: number;
}

export default function InstructorHome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissionsByTaskId, setSubmissionsByTaskId] = useState<Map<string, Submission[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setError(null);

      const [coursesRes, tasksRes] = await Promise.all([
        apiClient.get('/courses'),
        apiClient.get('/tasks'),
      ]);

      const allCourses: Course[] = coursesRes.data.data.courses || [];
      const allTasks: Task[] = tasksRes.data.data.tasks || [];

      setCourses(allCourses);
      setTasks(allTasks);

      // Fetch submissions for each task in parallel
      if (allTasks.length > 0) {
        const subResults = await Promise.allSettled(
          allTasks.map((t) => apiClient.get(`/task-submissions/task/${t._id}`))
        );

        const map = new Map<string, Submission[]>();
        allTasks.forEach((t, idx) => {
          const result = subResults[idx];
          if (result.status === 'fulfilled') {
            map.set(t._id, result.value.data?.data?.submissions || []);
          } else {
            map.set(t._id, []);
          }
        });
        setSubmissionsByTaskId(map);
      }
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, []);

  // ─── Metrics (mirrors web logic) ──────────────────────────────────────────
  const { totalTasks, urgentTasks, pendingReviews } = useMemo(() => {
    let pending = 0;
    let urgent = 0;
    const now = new Date();

    tasks.forEach((t) => {
      const subs = submissionsByTaskId.get(t._id) || [];
      pending += subs.filter((s) => s.status === 'SUBMITTED' || s.status === 'AI_GRADED').length;

      if (t.deadline) {
        const diff = (new Date(t.deadline).getTime() - now.getTime()) / (1000 * 3600 * 24);
        if (diff >= 0 && diff <= 3) urgent++;
      }
    });

    return { totalTasks: tasks.length, urgentTasks: urgent, pendingReviews: pending };
  }, [tasks, submissionsByTaskId]);

  // ─── 4 most recent tasks ───────────────────────────────────────────────────
  const recentTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 4);
  }, [tasks]);

  const getCourseName = (courseId?: string) => {
    if (!courseId) return 'General Assignment';
    const c = courses.find((c) => c._id === courseId);
    return c ? c.name : 'Unknown Course';
  };

  const getCourseCode = (courseId?: string) => {
    if (!courseId) return '';
    const c = courses.find((c) => c._id === courseId);
    return c ? c.courseCode : '';
  };

  const formatDeadline = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // ─── Recent modules (up to 6) ─────────────────────────────────────────────
  const recentModules = useMemo(() => courses.slice(0, 6), [courses]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#090514', '#0c0a1a', '#02010a']} style={StyleSheet.absoluteFill} />
        <View style={[styles.glowOrb, { top: '30%', left: '20%', backgroundColor: 'rgba(99, 102, 241, 0.2)' }]} />
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Syncing Command Center...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#090514', '#0c0a1a', '#02010a']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
      <View style={[styles.glowOrb, { top: -100, right: -100, backgroundColor: 'rgba(99, 102, 241, 0.15)' }]} />
      <View style={[styles.glowOrb, { bottom: 100, left: -150, backgroundColor: 'rgba(168, 85, 247, 0.1)' }]} />

      <View style={[styles.mainWrapper, { paddingTop: Math.max(insets.top, 24) }]}>
        <FlatList
          data={[]}
          renderItem={null}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" colors={['#6366f1']} />}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 140 }]}
          ListHeaderComponent={
            <>
              {/* ── Header ─────────────────────────────────────────────── */}
              <View style={styles.header}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>Command Center</Text>
                  <Text style={styles.subtitle}>Overview and active module tasks</Text>
                </View>
                <TouchableOpacity
                  style={styles.notificationButton}
                  onPress={() => router.push('/ProfileScreen')}
                  activeOpacity={0.7}
                >
                  <BlurView intensity={30} tint="dark" style={styles.bellBlur}>
                    <User size={20} color="#fff" />
                  </BlurView>
                </TouchableOpacity>
              </View>

              {/* ── Error Banner ───────────────────────────────────────── */}
              {error && (
                <Animatable.View animation="fadeInDown" style={styles.errorContainer}>
                  <BlurView intensity={40} tint="dark" style={styles.errorBlur}>
                    <View style={styles.errorLeft}>
                      <AlertTriangle size={18} color="#f87171" style={{ marginRight: 10 }} />
                      <Text style={styles.errorBannerText}>{error}</Text>
                    </View>
                    <TouchableOpacity style={styles.retryBannerButton} onPress={fetchDashboard}>
                      <Text style={styles.retryBannerText}>Retry</Text>
                    </TouchableOpacity>
                  </BlurView>
                </Animatable.View>
              )}

              {/* ── Metrics 2×2 Grid ───────────────────────────────────── */}
              <View style={styles.metricsGrid}>
                <MetricCard title="Total Courses" value={courses.length} color="#a5b4fc" icon={<BookOpen size={20} color="#a5b4fc" />} />
                <MetricCard title="Total Tasks" value={totalTasks} color="#a5b4fc" icon={<Target size={20} color="#a5b4fc" />} />
                <MetricCard title="Urgent Tasks" value={urgentTasks} color="#f87171" icon={<Clock size={20} color="#f87171" />} valueColor="#f87171" />
                <MetricCard title="Pending Reviews" value={pendingReviews} color="#fbbf24" icon={<ClipboardCheck size={20} color="#fbbf24" />} valueColor="#fbbf24" />
              </View>

              {/* ── Recent Modules ─────────────────────────────────────── */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Modules</Text>
                <TouchableOpacity onPress={() => router.push('/(instructor)/InstructorCourses')} activeOpacity={0.7}>
                  <Text style={styles.sectionLink}>View all →</Text>
                </TouchableOpacity>
              </View>

              {recentModules.length > 0 ? (
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={recentModules}
                  keyExtractor={(item) => item._id}
                  contentContainerStyle={{ paddingBottom: 4 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => router.push({ pathname: '/(instructor)/InstructorCourseDetail', params: { courseId: item._id } })}
                    >
                      <BlurView intensity={45} tint="dark" style={styles.moduleCard}>
                        <Text style={styles.moduleCode}>{item.courseCode}</Text>
                        <Text style={styles.moduleName} numberOfLines={2}>{item.name}</Text>
                        <View style={styles.moduleFooter}>
                          <Users size={12} color="#94a3b8" />
                          <Text style={styles.moduleStudents}>{item.enrolledStudents?.length || 0} Enrolled</Text>
                        </View>
                      </BlurView>
                    </TouchableOpacity>
                  )}
                />
              ) : (
                <Text style={styles.emptyText}>No recent modules found.</Text>
              )}

              {/* ── Active Task Feed ───────────────────────────────────── */}
              <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Active Task Feed</Text>

              {recentTasks.length > 0 ? (
                recentTasks.map((task, index) => {
                  const subs = submissionsByTaskId.get(task._id) || [];
                  const pending = subs.filter((s) => s.status === 'SUBMITTED' || s.status === 'AI_GRADED').length;
                  const courseId = task.target?.course_id;

                  return (
                    <Animatable.View key={task._id} animation="fadeInUp" duration={500} delay={index * 80} style={styles.taskCard}>
                      <BlurView intensity={45} tint="dark" style={styles.taskBlurInner}>
                        <View style={styles.taskPulse}>
                          <View style={styles.taskPulseDot} />
                        </View>
                        <View style={styles.taskInfo}>
                          <Text style={styles.taskCourse}>{getCourseCode(courseId)}</Text>
                          <Text style={styles.taskTitle}>{task.title}</Text>
                          <View style={styles.taskMeta}>
                            <View style={styles.taskMetaTag}>
                              <Calendar size={11} color="#94a3b8" />
                              <Text style={styles.taskMetaText}>Due {formatDeadline(task.deadline)}</Text>
                            </View>
                            {pending > 0 && (
                              <View style={styles.taskPendingTag}>
                                <Text style={styles.taskPendingText}>{pending} Pending</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.reviewButton}
                          activeOpacity={0.8}
                          onPress={() =>
                            router.push({
                              pathname: '/(instructor)/InstructorCourseDetail',
                              params: { courseId: courseId || '', highlightTaskId: task._id },
                            })
                          }
                        >
                          <Text style={styles.reviewButtonText}>View</Text>
                          <ChevronRight size={14} color="#a5b4fc" />
                        </TouchableOpacity>
                      </BlurView>
                    </Animatable.View>
                  );
                })
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

// ── Reusable Metric Card ──────────────────────────────────────────────────────
function MetricCard({ title, value, icon, color, valueColor }: { title: string; value: number; icon: React.ReactNode; color: string; valueColor?: string }) {
  return (
    <Animatable.View animation="fadeIn" duration={600} style={styles.metricCard}>
      <BlurView intensity={50} tint="dark" style={styles.metricBlurInner}>
        <View style={styles.metricIcon}>{icon}</View>
        <Text style={[styles.metricValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
        <Text style={styles.metricTitle}>{title}</Text>
      </BlurView>
    </Animatable.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#02010a' },
  glowOrb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.8 },
  loadingContainer: { flex: 1, backgroundColor: '#02010a', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94a3b8', fontSize: 12, fontWeight: '700', letterSpacing: 2, marginTop: 16, textTransform: 'uppercase' },
  mainWrapper: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingBottom: 28 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  notificationButton: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  bellBlur: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4, fontWeight: '500' },
  errorContainer: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)', marginBottom: 20 },
  errorBlur: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: 'rgba(239, 68, 68, 0.08)' },
  errorLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  errorBannerText: { color: '#fca5a5', fontSize: 13, fontWeight: '600' },
  retryBannerButton: { backgroundColor: 'rgba(255, 255, 255, 0.08)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  retryBannerText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  // Metrics
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 28 },
  metricCard: { width: '48%', height: 110, borderRadius: 20, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  metricBlurInner: { flex: 1, padding: 16, justifyContent: 'center' },
  metricIcon: { marginBottom: 8 },
  metricValue: { fontSize: 26, fontWeight: '800', color: '#fff' },
  metricTitle: { fontSize: 11, color: '#94a3b8', marginTop: 2, fontWeight: '600' },
  // Section headers
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.2, marginBottom: 14 },
  sectionLink: { fontSize: 12, fontWeight: '700', color: '#818cf8' },
  // Modules
  moduleCard: { width: 160, height: 120, borderRadius: 18, overflow: 'hidden', marginRight: 14, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.07)', padding: 16, justifyContent: 'space-between' },
  moduleCode: { fontSize: 10, color: '#a5b4fc', fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  moduleName: { fontSize: 14, color: '#fff', fontWeight: '700', marginTop: 4, lineHeight: 20 },
  moduleFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 'auto' },
  moduleStudents: { fontSize: 11, color: '#94a3b8', marginLeft: 5, fontWeight: '500' },
  emptyText: { color: '#64748b', fontSize: 14, fontStyle: 'italic', marginBottom: 24 },
  // Task Feed
  taskCard: { borderRadius: 18, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.07)' },
  taskBlurInner: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  taskPulse: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(99, 102, 241, 0.12)', borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.2)', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  taskPulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366f1' },
  taskInfo: { flex: 1 },
  taskCourse: { fontSize: 10, color: '#a5b4fc', fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  taskTitle: { fontSize: 15, color: '#fff', fontWeight: '700', marginBottom: 8 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  taskMetaTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  taskMetaText: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  taskPendingTag: { backgroundColor: 'rgba(251, 191, 36, 0.1)', borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  taskPendingText: { fontSize: 11, color: '#fbbf24', fontWeight: '700' },
  reviewButton: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(99, 102, 241, 0.1)', borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.25)', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, flexShrink: 0 },
  reviewButtonText: { color: '#a5b4fc', fontWeight: '700', fontSize: 13 },
});
