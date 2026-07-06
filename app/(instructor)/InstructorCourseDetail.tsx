import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  BookOpen,
  Users,
  Target,
  Clock,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Download,
  Plus,
  Paperclip,
  LayoutTemplate,
  X,
} from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '../../src/api/client';

type Tab = 'tasks' | 'students';

interface Course {
  _id: string;
  courseCode: string;
  name: string;
  description?: string;
  credits?: number;
  enrolledStudents?: any[];
}

interface Task {
  _id: string;
  title: string;
  description?: string;
  deadline: string;
  status: string;
  attachments?: { url: string; fileName?: string; size?: number }[];
  target?: { course_id?: string };
}

interface Submission {
  _id: string;
  task_id: any;
  submitter_id: any;
  status: 'SUBMITTED' | 'AI_GRADED' | 'FINALIZED';
  final_grade?: number;
  createdAt?: string;
}

export default function InstructorCourseDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { courseId } = useLocalSearchParams<{ courseId: string }>();

  const [course, setCourse] = useState<Course | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissionsByTaskId, setSubmissionsByTaskId] = useState<Map<string, Submission[]>>(new Map());
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  const getBaseUrl = () => {
    const base = process.env.EXPO_PUBLIC_API_URL || 'http://10.171.240.63:5000/api';
    return base.replace(/\/api\/?$/, '');
  };

  const getFullUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    return `${getBaseUrl()}/${cleanUrl}`;
  };

  const fetchData = async () => {
    if (!courseId) return;
    try {
      setError(null);

      const [courseRes, tasksRes] = await Promise.all([
        apiClient.get(`/courses/${courseId}`),
        apiClient.get('/tasks'),
      ]);

      const courseData: Course = courseRes.data.data.course;
      setCourse(courseData);

      const allTasks: Task[] = tasksRes.data.data.tasks || [];
      const courseTasks = allTasks.filter((t) => t.target?.course_id === courseId);
      setTasks(courseTasks);

      // Fetch submissions per task
      const subResults = await Promise.allSettled(
        courseTasks.map((t) => apiClient.get(`/task-submissions/task/${t._id}`))
      );

      const map = new Map<string, Submission[]>();
      let flat: Submission[] = [];
      courseTasks.forEach((t, idx) => {
        const result = subResults[idx];
        const subs: Submission[] = result.status === 'fulfilled'
          ? result.value.data?.data?.submissions || []
          : [];
        map.set(t._id, subs);
        flat = flat.concat(subs);
      });
      setSubmissionsByTaskId(map);
      setAllSubmissions(flat);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load course details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [courseId]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchData(); }, [courseId]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const statusColor = (status: string) => {
    if (status === 'FINALIZED') return { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', text: '#34d399' };
    if (status === 'AI_GRADED') return { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.25)', text: '#818cf8' };
    return { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)', text: '#fbbf24' };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#090514', '#0c0a1a', '#02010a']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading Course...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#090514', '#0c0a1a', '#02010a']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
      <View style={[styles.glowOrb, { top: -80, right: -80, backgroundColor: 'rgba(99,102,241,0.15)' }]} />
      <View style={[styles.glowOrb, { bottom: 60, left: -100, backgroundColor: 'rgba(168,85,247,0.1)' }]} />

      {/* Header */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top + 10, 30) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <BlurView intensity={30} tint="dark" style={styles.backBlur}>
            <ArrowLeft size={20} color="#fff" />
          </BlurView>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerCode}>{course?.courseCode}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{course?.name}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" colors={['#6366f1']} />}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
      >
        {/* Course Info Card */}
        <Animatable.View animation="fadeIn" duration={500}>
          <BlurView intensity={40} tint="dark" style={styles.courseCard}>
            <View style={styles.courseCardRow}>
              <View style={styles.courseIconBox}>
                <BookOpen size={28} color="#818cf8" />
              </View>
              <View style={{ flex: 1 }}>
                {course?.description ? (
                  <Text style={styles.courseDesc} numberOfLines={3}>{course.description}</Text>
                ) : (
                  <Text style={[styles.courseDesc, { fontStyle: 'italic' }]}>No description available.</Text>
                )}
              </View>
            </View>
            <View style={styles.courseStats}>
              <View style={styles.courseStat}>
                <Users size={14} color="#94a3b8" />
                <Text style={styles.courseStatText}>{course?.enrolledStudents?.length || 0} Students</Text>
              </View>
              <View style={styles.courseStat}>
                <FileText size={14} color="#94a3b8" />
                <Text style={styles.courseStatText}>{tasks.length} Tasks</Text>
              </View>
              <View style={styles.courseStat}>
                <CheckCircle2 size={14} color="#94a3b8" />
                <Text style={styles.courseStatText}>{allSubmissions.length} Submissions</Text>
              </View>
            </View>
          </BlurView>
        </Animatable.View>

        {/* Error Banner */}
        {error && (
          <BlurView intensity={30} tint="dark" style={styles.errorBanner}>
            <AlertTriangle size={16} color="#f87171" />
            <Text style={styles.errorText}>{error}</Text>
          </BlurView>
        )}

        {/* Segmented Control */}
        <View style={styles.tabBar}>
          {(['tasks', 'students'] as Tab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                {tab === 'tasks' ? `Active Tasks (${tasks.length})` : `Student Progress (${allSubmissions.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── TASKS TAB ───────────────────────────────────────────────── */}
        {activeTab === 'tasks' && (
          <View style={styles.tabContent}>
            <TouchableOpacity
              style={styles.createTaskBtn}
              activeOpacity={0.8}
              onPress={() => setShowTypeSelector(true)}
            >
              <LinearGradient colors={['#8b5cf6', '#6366f1']} style={styles.createTaskBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Plus size={18} color="#fff" />
                <Text style={styles.createTaskBtnText}>Create Task</Text>
              </LinearGradient>
            </TouchableOpacity>

            {tasks.length === 0 ? (
              <BlurView intensity={20} tint="dark" style={styles.emptyCard}>
                <Target size={32} color="#4f46e5" />
                <Text style={styles.emptyTitle}>No Tasks Yet</Text>
                <Text style={styles.emptyText}>No tasks have been assigned to this module.</Text>
              </BlurView>
            ) : (
              tasks.map((task, index) => {
                const subs = submissionsByTaskId.get(task._id) || [];
                const pending = subs.filter((s) => s.status === 'SUBMITTED' || s.status === 'AI_GRADED').length;
                const isExpired = task.deadline ? new Date(task.deadline) < new Date() : false;

                return (
                  <Animatable.View key={task._id} animation="fadeInUp" duration={500} delay={index * 60} style={styles.taskCard}>
                    <BlurView intensity={45} tint="dark" style={styles.taskBlur}>
                      {/* Status Badge */}
                      <View style={styles.taskHeader}>
                        <View style={[styles.taskStatusBadge, { backgroundColor: task.status === 'ACTIVE' ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)' }]}>
                          <Text style={[styles.taskStatusText, { color: task.status === 'ACTIVE' ? '#34d399' : '#94a3b8' }]}>{task.status}</Text>
                        </View>
                        {pending > 0 && (
                          <View style={styles.pendingBadge}>
                            <Text style={styles.pendingBadgeText}>{pending} Pending</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.taskTitle}>{task.title}</Text>
                      {task.description ? <Text style={styles.taskDesc} numberOfLines={2}>{task.description}</Text> : null}

                      {/* Attachments */}
                      {task.attachments && task.attachments.length > 0 && (
                        <View style={styles.attachmentsSection}>
                          <Text style={styles.attachmentsLabel}>Attachments</Text>
                          {task.attachments.map((att, idx) => (
                            <TouchableOpacity
                              key={idx}
                              style={styles.attachmentRow}
                              activeOpacity={0.7}
                              onPress={() => {
                                const url = getFullUrl(att.url);
                                if (url) Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open attachment.'));
                              }}
                            >
                              <FileText size={13} color="#818cf8" />
                              <Text style={styles.attachmentName} numberOfLines={1}>{att.fileName || `File ${idx + 1}`}</Text>
                              <Download size={12} color="#94a3b8" />
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}

                      {/* Footer */}
                      <View style={styles.taskFooter}>
                        <View style={styles.taskMeta}>
                          <Clock size={13} color={isExpired ? '#f87171' : '#a78bfa'} />
                          <Text style={[styles.taskDeadline, isExpired && { color: '#f87171' }]}>
                            {isExpired ? 'Expired · ' : 'Due · '}{formatDate(task.deadline)}
                          </Text>
                        </View>
                        <View style={styles.taskMeta}>
                          <FileText size={13} color="#94a3b8" />
                          <Text style={styles.taskSubCount}>{subs.length} Submissions</Text>
                        </View>
                      </View>
                    </BlurView>
                  </Animatable.View>
                );
              })
            )}
          </View>
        )}

        {/* ── STUDENT PROGRESS TAB ────────────────────────────────────── */}
        {activeTab === 'students' && (
          <View style={styles.tabContent}>
            {allSubmissions.length === 0 ? (
              <BlurView intensity={20} tint="dark" style={styles.emptyCard}>
                <Users size={32} color="#4f46e5" />
                <Text style={styles.emptyTitle}>No Submissions Yet</Text>
                <Text style={styles.emptyText}>No student submissions recorded for this module.</Text>
              </BlurView>
            ) : (
              allSubmissions.map((sub, index) => {
                const student = typeof sub.submitter_id === 'object' ? sub.submitter_id : null;
                const studentName = student ? `${student.firstName} ${student.lastName}` : 'Unknown Student';
                const initials = student ? student.firstName?.charAt(0)?.toUpperCase() || '?' : '?';
                const taskName = tasks.find((t) => {
                  const subTaskId = typeof sub.task_id === 'object' ? sub.task_id._id : sub.task_id;
                  return t._id === subTaskId;
                })?.title || 'Unknown Task';
                const sc = statusColor(sub.status);

                return (
                  <Animatable.View key={sub._id} animation="fadeInUp" duration={500} delay={index * 50} style={styles.submissionCard}>
                    <BlurView intensity={40} tint="dark" style={styles.submissionBlur}>
                      <View style={styles.submissionLeft}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.studentName}>{studentName}</Text>
                          <Text style={styles.taskNameText} numberOfLines={1}>{taskName}</Text>
                          {sub.createdAt && (
                            <Text style={styles.submittedAt}>{formatDate(sub.createdAt)}</Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.submissionRight}>
                        <View style={[styles.statusTag, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                          <Text style={[styles.statusTagText, { color: sc.text }]}>
                            {sub.status.replace('_', ' ')}
                          </Text>
                        </View>
                        {sub.final_grade !== undefined && (
                          <Text style={styles.gradeText}>{sub.final_grade}%</Text>
                        )}
                      </View>
                    </BlurView>
                  </Animatable.View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Task Type Selector Modal */}
      <Modal visible={showTypeSelector} transparent animationType="fade" onRequestClose={() => setShowTypeSelector(false)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <Animatable.View animation="zoomIn" duration={300} style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Task Type</Text>
                <Text style={styles.modalSubtitle}>Choose how you want to evaluate your students</Text>
              </View>
              <TouchableOpacity onPress={() => setShowTypeSelector(false)} style={styles.modalCloseBtn}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalOptions}>
              <TouchableOpacity
                style={[styles.typeOptionCard, { borderColor: 'rgba(99,102,241,0.2)' }]}
                activeOpacity={0.7}
                onPress={() => {
                  setShowTypeSelector(false);
                  router.push({ pathname: '/(instructor)/CreateStandardTaskScreen', params: { courseId } });
                }}
              >
                <View style={[styles.typeOptionIcon, { backgroundColor: 'rgba(99,102,241,0.1)' }]}>
                  <Paperclip size={24} color="#818cf8" />
                </View>
                <Text style={styles.typeOptionTitle}>Standard Task</Text>
                <Text style={styles.typeOptionDesc}>Upload files and set AI rubric</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeOptionCard, { borderColor: 'rgba(168,85,247,0.2)' }]}
                activeOpacity={0.7}
                onPress={() => {
                  setShowTypeSelector(false);
                  router.push({ pathname: '/(instructor)/CreateQuizScreen', params: { courseId } });
                }}
              >
                <View style={[styles.typeOptionIcon, { backgroundColor: 'rgba(168,85,247,0.1)' }]}>
                  <LayoutTemplate size={24} color="#c084fc" />
                </View>
                <Text style={styles.typeOptionTitle}>Quiz / Form</Text>
                <Text style={styles.typeOptionDesc}>Build dynamic questions & tests</Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#02010a' },
  glowOrb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.8 },
  loadingContainer: { flex: 1, backgroundColor: '#02010a', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94a3b8', fontSize: 12, fontWeight: '700', letterSpacing: 2, marginTop: 16, textTransform: 'uppercase' },
  // Top Bar
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  backBlur: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerCode: { fontSize: 10, fontWeight: '800', color: '#818cf8', textTransform: 'uppercase', letterSpacing: 1.5 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  // Scroll
  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },
  // Course Card
  courseCard: { borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 18, marginBottom: 20 },
  courseCardRow: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  courseIconBox: { width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(99,102,241,0.12)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  courseDesc: { fontSize: 13, color: '#94a3b8', lineHeight: 20 },
  courseStats: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 14 },
  courseStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  courseStatText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  // Error
  errorBanner: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  errorText: { color: '#fca5a5', fontSize: 13, fontWeight: '600', flex: 1 },
  // Tabs
  tabBar: { flexDirection: 'row', backgroundColor: 'rgba(99,102,241,0.07)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 4, marginBottom: 20 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 14, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#4f46e5' },
  tabBtnText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  tabBtnTextActive: { color: '#fff' },
  tabContent: { gap: 14 },
  
  createTaskBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  createTaskBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  createTaskBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },

  // Task Card
  taskCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  taskBlur: { padding: 18 },
  taskHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  taskStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  taskStatusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  pendingBadge: { backgroundColor: 'rgba(251,191,36,0.1)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  pendingBadgeText: { fontSize: 10, fontWeight: '800', color: '#fbbf24', textTransform: 'uppercase' },
  taskTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 6 },
  taskDesc: { fontSize: 13, color: '#94a3b8', lineHeight: 20, marginBottom: 12 },
  // Attachments
  attachmentsSection: { marginBottom: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  attachmentsLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  attachmentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: 10, marginBottom: 6 },
  attachmentName: { flex: 1, fontSize: 12, fontWeight: '600', color: '#e2e8f0' },
  // Task Footer
  taskFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12, marginTop: 8 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  taskDeadline: { fontSize: 12, color: '#a78bfa', fontWeight: '600' },
  taskSubCount: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  // Submission Card
  submissionCard: { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  submissionBlur: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, gap: 12 },
  submissionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarText: { fontSize: 14, fontWeight: '800', color: '#818cf8' },
  studentName: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 2 },
  taskNameText: { fontSize: 11, color: '#94a3b8', fontWeight: '500', marginBottom: 2 },
  submittedAt: { fontSize: 10, color: '#64748b', fontWeight: '500' },
  submissionRight: { alignItems: 'flex-end', gap: 6 },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  statusTagText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  gradeText: { fontSize: 14, fontWeight: '900', color: '#34d399' },
  // Empty state
  emptyCard: { borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 32, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginTop: 14, marginBottom: 6 },
  emptyText: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContainer: { width: '90%', backgroundColor: '#0f172a', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
  modalSubtitle: { fontSize: 12, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
  modalCloseBtn: { padding: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  modalOptions: { gap: 16 },
  typeOptionCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderRadius: 20, padding: 20, alignItems: 'center' },
  typeOptionIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  typeOptionTitle: { fontSize: 14, fontWeight: '800', color: '#f8fafc', textTransform: 'uppercase', letterSpacing: 0.5 },
  typeOptionDesc: { fontSize: 11, fontWeight: '500', color: '#94a3b8', marginTop: 6 },
});
