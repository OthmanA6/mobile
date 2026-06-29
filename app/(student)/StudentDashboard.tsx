import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Bell,
  Clock,
  BookOpen,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  User,
  FileText,
} from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import { useRouter } from 'expo-router';
import { theme } from '../../src/theme/theme';
import apiClient from '../../src/api/client';
import { authService } from '../../src/api/auth';
import CustomAlert, { AlertButton } from '../../components/CustomAlert';

const { width } = Dimensions.get('window');

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
}

export default function StudentDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // State
  const [userName, setUserName] = useState('Student');
  const [metrics, setMetrics] = useState<{ pending: number; completed: number; courses: number; forms: number } | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [urgentTasks, setUrgentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    buttons?: AlertButton[];
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    buttons?: AlertButton[]
  ) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      buttons,
    });
  };

  const fetchDashboardData = async (showFullScreenLoading = true) => {
    if (showFullScreenLoading) {
      setLoading(true);
    }
    setError(false);
    try {
      const [coursesRes, tasksRes, submissionsRes, profileRes, formsRes] = await Promise.all([
        apiClient.get('/courses'),
        apiClient.get('/tasks'),
        apiClient.get('/task-submissions/my-submissions'),
        authService.getProfile(),
        apiClient.get('/v1/form').catch(() => ({ data: { data: [] } })), // Catch form errors gracefully
      ]);

      const coursesList = coursesRes.data?.data?.courses || [];
      const tasksList = (tasksRes.data?.data?.tasks || []).filter((t: any) => t.status === 'ACTIVE');
      const submissionsList = submissionsRes.data?.data?.submissions || [];

      // Extract user name
      if (profileRes?.user?.firstName) {
        setUserName(profileRes.user.firstName);
      }

      setCourses(coursesList);

      // Calculate pending tasks (tasks that have not been submitted)
      const submittedTaskIds = submissionsList
        .map((s: any) => {
          if (!s.task_id) return null;
          return typeof s.task_id === 'object' ? (s.task_id._id || s.task_id.id) : s.task_id;
        })
        .filter(Boolean);

      const pending = tasksList.filter((t: any) => !submittedTaskIds.includes(t.id || t._id));

      setMetrics({
        pending: pending.length,
        completed: submissionsList.length,
        courses: coursesList.length,
        forms: (formsRes.data?.data || []).length,
      });

      // Filter out tasks that have passed their deadline for the Action Required list
      const now = Date.now();
      const activePending = pending.filter((t: any) => {
        const deadline = new Date(t.deadline).getTime();
        return isNaN(deadline) || deadline >= now;
      });

      // Sort active pending tasks by deadline for urgency, and take top 3
      const sortedUrgent = [...activePending]
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
        .slice(0, 3);

      setUrgentTasks(sortedUrgent);
    } catch (err) {
      console.error('Failed to fetch student dashboard data:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(true);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData(false);
    setRefreshing(false);
  };

  const getCourseName = (courseId?: string) => {
    if (!courseId) return 'General Assignment';
    const course = courses.find((c: any) => (c._id || c.id) === courseId);
    return course ? course.name : 'Unknown Course';
  };

  const formatDeadline = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }) + ', ' + date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  const handleStartTask = (task: Task) => {
    showAlert(
      'Start Evaluation',
      `Would you like to open "${task.title}" to submit your evaluation?`,
      'info',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open',
          onPress: () => {
            const cName = getCourseName(task.target?.course_id);
            router.push({
              pathname: '/FormRendererView',
              params: {
                taskId: task.id || task._id,
                taskTitle: task.title,
                courseName: cName,
              },
            });
          },
        },
      ]
    );
  };

  const handleNotificationPress = () => {
    showAlert('Notifications', 'No new notifications', 'info');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#090514', '#0c0a1a', '#02010a']}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.glowOrb, { top: '30%', left: '20%', backgroundColor: 'rgba(99, 102, 241, 0.2)' }]} />
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Syncing Workspace...</Text>
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

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: insets.bottom + 120, // safe distance from the floating navbar
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
            colors={['#6366f1']}
          />
        }
      >
        {/* Header Section */}
        <Animatable.View animation="fadeIn" duration={800} style={styles.header}>
          <View>
            <Text style={styles.greetingSub}>Welcome back,</Text>
            <Text style={styles.greetingMain}>{userName} 👋</Text>
          </View>
          <View style={styles.headerActions}>
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
        </Animatable.View>

        {/* Error Banner */}
        {error && (
          <Animatable.View animation="fadeInDown" style={styles.errorContainer}>
            <BlurView intensity={40} tint="dark" style={styles.errorBlur}>
              <View style={styles.errorLeft}>
                <AlertTriangle size={18} color="#f87171" style={styles.errorIcon} />
                <Text style={styles.errorText}>Failed to sync latest data.</Text>
              </View>
              <TouchableOpacity style={styles.retryButton} onPress={() => fetchDashboardData(true)}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </BlurView>
          </Animatable.View>
        )}

        {/* Dynamic Welcome card */}
        <Animatable.View animation="zoomIn" duration={800} delay={100} style={styles.welcomeCardContainer}>
          <BlurView intensity={40} tint="dark" style={styles.welcomeCardBlur}>
            <LinearGradient
              colors={['rgba(99, 102, 241, 0.15)', 'rgba(168, 85, 247, 0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.welcomeCardContent}>
              <View style={styles.welcomeTextColumn}>
                <View style={styles.badgeRow}>
                  <Sparkles size={12} color="#cfbcff" />
                  <Text style={styles.badgeText}>INSIGHTO ACTIVE</Text>
                </View>
                <Text style={styles.welcomeCardTitle}>
                  {metrics && metrics.forms > 0 ? 'Surveys awaiting reply' : 'All caught up!'}
                </Text>
                <Text style={styles.welcomeCardDesc}>
                  {metrics && metrics.forms > 0
                    ? `You have ${metrics.forms} pending surveys waiting for your response.`
                    : 'Great job! You have submitted all active feedback forms.'}
                </Text>
              </View>
            </View>
          </BlurView>
        </Animatable.View>

        {/* Metrics Grid Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Overview</Text>
        </View>

        {/* Horizontal Metrics Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.metricsContainer}
        >
          {/* Card 1: Pending Tasks */}
          <Animatable.View animation="fadeInRight" duration={600} delay={100} style={styles.metricCard}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/(student)/StudentTasks')} style={{ flex: 1 }}>
              <BlurView intensity={50} tint="dark" style={styles.metricBlur}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                  <Clock size={20} color="#f87171" />
                </View>
                <View>
                  <Text style={styles.metricValue}>{metrics?.pending ?? 0}</Text>
                  <Text style={styles.metricLabel}>Pending Tasks</Text>
                </View>
              </BlurView>
            </TouchableOpacity>
          </Animatable.View>

          {/* Card 2: Forms & Surveys */}
          <Animatable.View animation="fadeInRight" duration={600} delay={150} style={styles.metricCard}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/(student)/StudentForms')} style={{ flex: 1 }}>
              <BlurView intensity={50} tint="dark" style={styles.metricBlur}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                  <FileText size={20} color="#f472b6" />
                </View>
                <View>
                  <Text style={styles.metricValue}>{metrics?.forms ?? 0}</Text>
                  <Text style={styles.metricLabel}>Forms & Surveys</Text>
                </View>
              </BlurView>
            </TouchableOpacity>
          </Animatable.View>

          {/* Card 3: Enrolled Courses */}
          <Animatable.View animation="fadeInRight" duration={600} delay={200} style={styles.metricCard}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/(student)/StudentModules')} style={{ flex: 1 }}>
              <BlurView intensity={50} tint="dark" style={styles.metricBlur}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                  <BookOpen size={20} color="#cfbcff" />
                </View>
                <View>
                  <Text style={styles.metricValue}>{metrics?.courses ?? 0}</Text>
                  <Text style={styles.metricLabel}>My Courses</Text>
                </View>
              </BlurView>
            </TouchableOpacity>
          </Animatable.View>

          {/* Card 4: Completed */}
          <Animatable.View animation="fadeInRight" duration={600} delay={300} style={styles.metricCard}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/(student)/StudentTasks')} style={{ flex: 1 }}>
              <BlurView intensity={50} tint="dark" style={styles.metricBlur}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <CheckCircle2 size={20} color="#34d399" />
                </View>
                <View>
                  <Text style={styles.metricValue}>{metrics?.completed ?? 0}</Text>
                  <Text style={styles.metricLabel}>Completed</Text>
                </View>
              </BlurView>
            </TouchableOpacity>
          </Animatable.View>
        </ScrollView>

        {/* Action Required Feed Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Action Required</Text>
          <View style={styles.badgeCount}>
            <Text style={styles.badgeCountText}>{urgentTasks.length}</Text>
          </View>
        </View>

        {/* Urgent Tasks List */}
        <View style={styles.tasksFeed}>
          {urgentTasks.map((task, index) => (
            <Animatable.View
              key={task.id || task._id}
              animation="fadeInUp"
              duration={800}
              delay={200 + index * 100}
              style={styles.taskCard}
            >
              <BlurView intensity={45} tint="dark" style={styles.taskCardBlur}>
                <View style={styles.taskCardHeader}>
                  <View style={styles.taskDetails}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskCourse}>{getCourseName(task.target?.course_id)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => handleStartTask(task)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.startButtonText}>Start</Text>
                    <ChevronRight size={14} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Card Divider */}
                <View style={styles.cardDivider} />

                {/* Card Footer */}
                <View style={styles.taskFooter}>
                  <View style={styles.deadlineRow}>
                    <Calendar size={14} color="#a78bfa" />
                    <Text style={styles.deadlineText}>Deadline: {formatDeadline(task.deadline)}</Text>
                  </View>
                </View>
              </BlurView>
            </Animatable.View>
          ))}

          {urgentTasks.length === 0 && (
            <BlurView intensity={20} tint="dark" style={styles.emptyContainer}>
              <CheckCircle2 size={36} color="#34d399" style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>All Caught Up!</Text>
              <Text style={styles.emptyText}>You do not have any pending tasks at this moment.</Text>
            </BlurView>
          )}
        </View>
      </ScrollView>
      <CustomAlert
        {...alertConfig}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
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
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  greetingSub: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  greetingMain: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  notificationButton: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  bellBlur: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: 13,
    right: 13,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
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
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  welcomeCardContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 28,
  },
  welcomeCardBlur: {
    padding: 20,
  },
  welcomeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeTextColumn: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 99,
    gap: 6,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  badgeText: {
    fontSize: 9,
    color: '#d8b4fe',
    fontWeight: '900',
    letterSpacing: 1,
  },
  welcomeCardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  welcomeCardDesc: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
  badgeCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeCountText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  metricsContainer: {
    gap: 12,
    paddingBottom: 28,
  },
  metricCard: {
    width: 140,
    height: 125,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricBlur: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
  },
  metricLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 2,
  },
  tasksFeed: {
    gap: 14,
  },
  taskCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  taskCardBlur: {
    padding: 16,
  },
  taskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskDetails: {
    flex: 1,
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  taskCourse: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 4,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 2,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 12,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deadlineText: {
    fontSize: 12,
    color: '#a78bfa',
    fontWeight: '600',
  },
  emptyContainer: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyIcon: {
    marginBottom: 12,
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
