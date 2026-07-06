import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Search,
  User,
  ChevronRight,
  BookOpen,
  AlertTriangle,
  ClipboardList,
  Clock,
  CheckCircle2,
  Ban,
  FileText,
  Download,
} from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../../src/theme/theme';
import apiClient from '../../../src/api/client';

type TabType = 'courses' | 'tasks';
type TaskFilter = 'ALL' | 'OPEN' | 'PENDING' | 'SUBMITTED' | 'GRADED';

interface Course {
  id: string;
  _id?: string;
  name: string;
  courseCode: string;
  description?: string;
  instructorId?: string;
  instructor?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

interface Task {
  id: string;
  _id?: string;
  title: string;
  description: string;
  deadline: string;
  target?: {
    course_id?: string;
  };
  status: string;
  task_type?: string;
  attachments?: {
    url: string;
    fileName?: string;
    size?: number;
  }[];
}

interface Submission {
  id: string;
  _id?: string;
  task_id: string | any;
  createdAt: string;
  status: string;
}

export default function StudentModules() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  
  // Unified State
  const [activeTab, setActiveTab] = useState<TabType>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    if (params.tab === 'tasks' || params.tab === 'courses') {
      setActiveTab(params.tab as TabType);
    }
  }, [params.tab]);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchData = async (showFullScreenLoading = true) => {
    if (showFullScreenLoading) setLoading(true);
    setError(false);
    try {
      const [coursesRes, tasksRes, submissionsRes] = await Promise.all([
        apiClient.get('/courses'),
        apiClient.get('/tasks'),
        apiClient.get('/task-submissions/my-submissions'),
      ]);

      const coursesList = coursesRes.data?.data?.courses || [];
      const tasksList = (tasksRes.data?.data?.tasks || []).filter((t: any) => t.status === 'ACTIVE');
      const submissionsList = submissionsRes.data?.data?.submissions || [];

      setCourses(coursesList);
      setTasks(tasksList);
      setSubmissions(submissionsList);
    } catch (err) {
      console.error('Failed to fetch academic directory data:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(false);
    setRefreshing(false);
  };

  // --- COURSES LOGIC ---
  const filteredCourses = courses.filter((course) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = course.name?.toLowerCase().includes(term);
    const codeMatch = course.courseCode?.toLowerCase().includes(term);
    return nameMatch || codeMatch;
  });

  const handleCoursePress = (course: Course) => {
    let instructorName = 'Unassigned Instructor';
    const instObj = course.instructorId as any;
    if (instObj && typeof instObj === 'object') {
      instructorName = `${instObj.firstName || ''} ${instObj.lastName || ''}`.trim();
    } else if (course.instructor) {
      instructorName = `${course.instructor.firstName || ''} ${course.instructor.lastName || ''}`.trim();
    }

    router.push({
      pathname: '/ModuleDetailView',
      params: {
        moduleId: course.id || course._id,
        courseName: course.name,
        courseCode: course.courseCode,
        instructorName,
        description: course.description || '',
      },
    });
  };

  // --- TASKS LOGIC ---
  const getCourseName = (courseId?: string) => {
    if (!courseId) return 'General Assignment';
    const course = courses.find((c) => (c._id || c.id) === courseId);
    return course ? course.name : 'Unknown Course';
  };

  const getFullUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = process.env.EXPO_PUBLIC_API_URL 
      ? process.env.EXPO_PUBLIC_API_URL.replace(/\/api\/?$/, '') 
      : 'http://10.171.240.63:5000';
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    return `${baseUrl}/${cleanUrl}`;
  };

  const formatDeadlineText = (dateStr: string) => {
    try {
      const deadline = new Date(dateStr);
      if (isNaN(deadline.getTime())) return dateStr;
      return deadline.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const submittedTaskIds = submissions
    .map((s) => {
      if (!s.task_id) return null;
      return typeof s.task_id === 'object' ? (s.task_id._id || s.task_id.id) : s.task_id;
    })
    .filter(Boolean);

  const gradedTaskIds = submissions
    .filter((s) => s.status === 'FINALIZED')
    .map((s) => {
      if (!s.task_id) return null;
      return typeof s.task_id === 'object' ? (s.task_id._id || s.task_id.id) : s.task_id;
    })
    .filter(Boolean);

  const isExpired = (dateStr: string) => {
    try {
      return dateStr ? new Date(dateStr) < new Date() : false;
    } catch {
      return false;
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const id = t.id || t._id || '';
    if (taskFilter === 'ALL') return true;
    if (taskFilter === 'OPEN') return !submittedTaskIds.includes(id) && !isExpired(t.deadline);
    if (taskFilter === 'PENDING') return !submittedTaskIds.includes(id);
    if (taskFilter === 'SUBMITTED') return submittedTaskIds.includes(id) && !gradedTaskIds.includes(id);
    if (taskFilter === 'GRADED') return gradedTaskIds.includes(id);
    return true;
  });

  const handleStartTask = (task: Task) => {
    if (isExpired(task.deadline)) {
      Alert.alert(
        'Deadline Passed',
        'The deadline for this assignment has expired. Submissions are no longer accepted.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    const cName = getCourseName(task.target?.course_id);
    router.push({
      pathname: '/FormRendererView',
      params: {
        taskId: task.id || task._id,
        taskTitle: task.title,
        courseName: cName,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#090514', '#0c0a1a', '#02010a']} style={StyleSheet.absoluteFill} />
        <View style={[styles.glowOrb, { top: '30%', left: '20%', backgroundColor: 'rgba(99, 102, 241, 0.2)' }]} />
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Syncing Directory...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#090514', '#0c0a1a', '#02010a']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
      <View style={[styles.glowOrb, { top: -100, right: -100, backgroundColor: 'rgba(99, 102, 241, 0.15)' }]} />
      <View style={[styles.glowOrb, { bottom: 100, left: -150, backgroundColor: 'rgba(168, 85, 247, 0.1)' }]} />

      <View style={[styles.mainWrapper, { paddingTop: Math.max(insets.top + 15, 35) }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Academic Directory</Text>
          <Text style={styles.subtitle}>Manage your enrolled courses and pending assignments</Text>
        </View>

        {/* TOP TAB BAR */}
        <View style={styles.tabContainer}>
          <BlurView intensity={25} tint="dark" style={styles.tabBlur}>
            <TouchableOpacity
              style={styles.tabButton}
              onPress={() => setActiveTab('courses')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabButtonText, activeTab === 'courses' && styles.tabButtonTextActive]}>
                My Courses
              </Text>
              {activeTab === 'courses' && <View style={styles.activeIndicator} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabButton}
              onPress={() => setActiveTab('tasks')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabButtonText, activeTab === 'tasks' && styles.tabButtonTextActive]}>
                Task Center
              </Text>
              {activeTab === 'tasks' && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          </BlurView>
        </View>

        {error && (
          <Animatable.View animation="fadeInDown" style={styles.errorContainer}>
            <BlurView intensity={40} tint="dark" style={styles.errorBlur}>
              <View style={styles.errorLeft}>
                <AlertTriangle size={18} color="#f87171" style={styles.errorIcon} />
                <Text style={styles.errorText}>Failed to sync data.</Text>
              </View>
              <TouchableOpacity style={styles.retryButton} onPress={() => fetchData(true)}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </BlurView>
          </Animatable.View>
        )}

        {activeTab === 'courses' ? (
          /* ================= COURSES TAB ================= */
          <>
            <BlurView intensity={30} tint="dark" style={styles.searchBarContainer}>
              <Search size={18} color="#94a3b8" style={styles.searchIcon} />
              <TextInput
                placeholder="Search by code or title..."
                placeholderTextColor="#94a3b8"
                value={searchTerm}
                onChangeText={setSearchTerm}
                style={styles.searchInput}
                autoCapitalize="none"
              />
            </BlurView>

            <FlatList
              data={filteredCourses}
              keyExtractor={(item) => item.id || item._id || ''}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 140 }]}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" colors={['#6366f1']} />}
              renderItem={({ item, index }) => {
                let instructorName = 'Unassigned Instructor';
                const instObj = item.instructorId as any;
                if (instObj && typeof instObj === 'object') {
                  instructorName = `${instObj.firstName || ''} ${instObj.lastName || ''}`.trim();
                } else if (item.instructor) {
                  instructorName = `${item.instructor.firstName || ''} ${item.instructor.lastName || ''}`.trim();
                }

                return (
                  <Animatable.View animation="fadeInUp" duration={600} delay={index * 50} style={styles.courseCardContainer}>
                    <TouchableOpacity onPress={() => handleCoursePress(item)} activeOpacity={0.85}>
                      <BlurView intensity={45} tint="dark" style={styles.courseCardBlur}>
                        <View style={styles.courseCardLeft}>
                          <View style={styles.codeBadge}>
                            <Text style={styles.codeBadgeText}>{item.courseCode}</Text>
                          </View>
                          <Text style={styles.courseName} numberOfLines={2}>{item.name}</Text>
                          <View style={styles.instructorRow}>
                            <User size={13} color="#94a3b8" />
                            <Text style={styles.instructorText} numberOfLines={1}>{instructorName}</Text>
                          </View>
                        </View>
                        <View style={styles.courseCardRight}>
                          <View style={styles.detailsIconWrapper}>
                            <ChevronRight size={18} color="#fff" />
                          </View>
                        </View>
                      </BlurView>
                    </TouchableOpacity>
                  </Animatable.View>
                );
              }}
              ListEmptyComponent={
                !loading ? (
                  <BlurView intensity={20} tint="dark" style={styles.emptyContainer}>
                    <BookOpen size={36} color="#4f46e5" style={styles.emptyIcon} />
                    <Text style={styles.emptyTitle}>No Courses Found</Text>
                    <Text style={styles.emptyText}>
                      {searchTerm ? 'No courses match your search criteria.' : 'You are not enrolled in any courses.'}
                    </Text>
                  </BlurView>
                ) : null
              }
            />
          </>
        ) : (
          /* ================= TASKS TAB ================= */
          <>
            <View style={styles.filtersContainer}>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={['ALL', 'OPEN', 'PENDING', 'SUBMITTED', 'GRADED'] as TaskFilter[]}
                keyExtractor={(item) => item}
                contentContainerStyle={styles.filtersContent}
                renderItem={({ item }) => {
                  const isActive = taskFilter === item;
                  return (
                    <TouchableOpacity
                      onPress={() => setTaskFilter(item)}
                      activeOpacity={0.8}
                      style={[styles.filterPill, isActive && styles.filterPillActive]}
                    >
                      <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>{item}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>

            <FlatList
              data={filteredTasks}
              keyExtractor={(item) => item.id || item._id || ''}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 140 }]}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" colors={['#6366f1']} />}
              renderItem={({ item, index }) => {
                const taskId = item.id || item._id || '';
                const isPending = !submittedTaskIds.includes(taskId);
                const isGraded = gradedTaskIds.includes(taskId);
                const isSubmitted = submittedTaskIds.includes(taskId) && !isGraded;

                return (
                  <Animatable.View animation="fadeInUp" duration={600} delay={index * 50} style={styles.taskCardContainer}>
                    <BlurView intensity={45} tint="dark" style={styles.taskCardBlur}>
                      <View style={styles.taskCardContent}>
                        <Text style={styles.taskTitle}>{item.title}</Text>
                        <View style={styles.taskCourseRow}>
                          <BookOpen size={14} color="#94a3b8" />
                          <Text style={styles.taskCourseName}>{getCourseName(item.target?.course_id)}</Text>
                        </View>
                        <View style={styles.taskDeadlineRow}>
                          <Clock size={14} color="#a78bfa" />
                          <Text style={styles.taskDeadlineText}>Due {formatDeadlineText(item.deadline)}</Text>
                        </View>
                        
                        {item.attachments && item.attachments.length > 0 && (
                          <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)' }}>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Attachments</Text>
                            <View style={{ gap: 8 }}>
                              {item.attachments.map((att: any, idx: number) => (
                                <TouchableOpacity
                                  key={idx}
                                  activeOpacity={0.7}
                                  onPress={() => {
                                    if (att.url) {
                                      Linking.openURL(getFullUrl(att.url)).catch(() => {
                                        Alert.alert('Error', 'Could not open the attachment link.');
                                      });
                                    }
                                  }}
                                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8, borderRadius: 8, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}
                                >
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                                    <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(99, 102, 241, 0.15)', justifyContent: 'center', alignItems: 'center' }}>
                                      <FileText size={14} color="#818cf8" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#e2e8f0' }} numberOfLines={1}>
                                        {att.fileName || `Attachment ${idx + 1}`}
                                      </Text>
                                    </View>
                                  </View>
                                  <View style={{ padding: 4, borderRadius: 6, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                                    <Download size={12} color="#cbd5e1" />
                                  </View>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                        )}
                      </View>

                      <View style={styles.taskActionRow}>
                        {isPending && !isExpired(item.deadline) && (
                          <TouchableOpacity
                            style={styles.taskActionButton}
                            onPress={() => handleStartTask(item)}
                            activeOpacity={0.8}
                          >
                            <LinearGradient colors={['#6366f1', '#4f46e5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.taskGradientButton}>
                              <Text style={styles.taskActionButtonText}>Submit Assignment</Text>
                              <ChevronRight size={16} color="#fff" />
                            </LinearGradient>
                          </TouchableOpacity>
                        )}
                        {isPending && isExpired(item.deadline) && (
                          <View style={[styles.taskStatusBadge, styles.taskStatusBadgeExpired]}>
                            <Ban size={14} color="#f87171" />
                            <Text style={[styles.taskStatusBadgeText, { color: '#f87171' }]}>Deadline Passed</Text>
                          </View>
                        )}
                        {isSubmitted && (
                          <View style={[styles.taskStatusBadge, styles.taskStatusBadgeWarning]}>
                            <Clock size={14} color="#f59e0b" />
                            <Text style={[styles.taskStatusBadgeText, { color: '#f59e0b' }]}>Under Review</Text>
                          </View>
                        )}
                        {isGraded && (
                          <View style={[styles.taskStatusBadge, styles.taskStatusBadgeSuccess]}>
                            <CheckCircle2 size={14} color="#10b981" />
                            <Text style={[styles.taskStatusBadgeText, { color: '#10b981' }]}>Graded</Text>
                          </View>
                        )}
                      </View>
                    </BlurView>
                  </Animatable.View>
                );
              }}
              ListEmptyComponent={
                !loading ? (
                  <BlurView intensity={20} tint="dark" style={styles.emptyContainer}>
                    <ClipboardList size={36} color="#4f46e5" style={styles.emptyIcon} />
                    <Text style={styles.emptyTitle}>No Tasks Found</Text>
                    <Text style={styles.emptyText}>There are no tasks matching your selected filter.</Text>
                  </BlurView>
                ) : null
              }
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#02010a' },
  glowOrb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.8 },
  loadingContainer: { flex: 1, backgroundColor: '#02010a', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94a3b8', fontSize: 12, fontWeight: '700', letterSpacing: 2, marginTop: 16, textTransform: 'uppercase' },
  mainWrapper: { flex: 1, paddingHorizontal: 20 },
  header: { marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4, fontWeight: '500' },
  
  // Tab Bar
  tabContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.2)',
  },
  tabBlur: { flexDirection: 'row', paddingVertical: 2 },
  tabButton: { flex: 1, paddingVertical: 14, alignItems: 'center', position: 'relative' },
  tabButtonText: { fontSize: 13, fontWeight: '600', color: '#94a3b8', letterSpacing: 0.5 },
  tabButtonTextActive: { color: '#fff', fontWeight: '800' },
  activeIndicator: { position: 'absolute', bottom: -2, width: 40, height: 3, backgroundColor: '#6366f1', borderRadius: 2 },
  
  // Shared
  errorContainer: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)', marginBottom: 20 },
  errorBlur: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: 'rgba(239, 68, 68, 0.08)' },
  errorLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  errorIcon: { marginRight: 10 },
  errorText: { color: '#fca5a5', fontSize: 13, fontWeight: '600' },
  retryButton: { backgroundColor: 'rgba(255, 255, 255, 0.08)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  retryButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  listContainer: { gap: 14 },
  emptyContainer: { borderRadius: 20, padding: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', marginTop: 20 },
  emptyIcon: { marginBottom: 14 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 6 },
  emptyText: { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 18 },

  // Courses
  searchBarContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', paddingHorizontal: 16, height: 52, marginBottom: 20, backgroundColor: 'rgba(15, 23, 42, 0.2)', overflow: 'hidden' },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600', height: '100%' },
  courseCardContainer: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  courseCardBlur: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  courseCardLeft: { flex: 1, marginRight: 12 },
  codeBadge: { backgroundColor: 'rgba(99, 102, 241, 0.15)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, alignSelf: 'flex-start', borderWidth: 0.5, borderColor: 'rgba(99, 102, 241, 0.3)', marginBottom: 10 },
  codeBadgeText: { color: '#a5b4fc', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  courseName: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 10, lineHeight: 22 },
  instructorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  instructorText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  courseCardRight: { justifyContent: 'center', alignItems: 'center' },
  detailsIconWrapper: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },

  // Tasks
  filtersContainer: { marginBottom: 16 },
  filtersContent: { gap: 10 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  filterPillActive: { backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.3)' },
  filterPillText: { color: '#94a3b8', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  filterPillTextActive: { color: '#a5b4fc' },
  taskCardContainer: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  taskCardBlur: { padding: 20 },
  taskCardContent: { marginBottom: 16 },
  taskTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 10 },
  taskCourseRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  taskCourseName: { color: '#94a3b8', fontSize: 13, fontWeight: '500' },
  taskDeadlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(245, 158, 11, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)' },
  taskDeadlineText: { color: '#fcd34d', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  taskActionRow: { borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.06)', paddingTop: 16 },
  taskActionButton: { borderRadius: 12, overflow: 'hidden' },
  taskGradientButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6 },
  taskActionButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  taskStatusBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 6, borderWidth: 1 },
  taskStatusBadgeWarning: { backgroundColor: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.1)' },
  taskStatusBadgeSuccess: { backgroundColor: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.1)' },
  taskStatusBadgeExpired: { backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.15)' },
  taskStatusBadgeText: { fontSize: 14, fontWeight: '700' },
});
