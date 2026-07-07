import { useTheme } from '../src/context/ThemeContext';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ArrowLeft, BookOpen, User, Building2, ClipboardList, ChevronRight } from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import apiClient from '../src/api/client';
import CustomAlert, { AlertButton } from '../components/CustomAlert';
import RadialGlowOrb from '../src/components/RadialGlowOrb';

interface CoursePopulated {
  _id: string;
  name: string;
  courseCode: string;
}

interface Survey {
  id: string;
  _id: string;
  title: string;
  description: string;
  deadline: string;
  target?: {
    course_id?: CoursePopulated | string;
  };
}

export default function ModuleDetailView() {
  const { themeMode } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  // Safely cast all params to string to prevent RN text rendering crashes
  const moduleId = String(params.moduleId ?? '');
  const courseName = String(params.courseName ?? '');
  const courseCode = String(params.courseCode ?? '');
  const instructorName = String(params.instructorName ?? '');
  const description = String(params.description ?? '');

  // Tasks local state
  const [tasks, setTasks] = useState<Survey[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [tasksError, setTasksError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  const fetchCourseTasks = async (showLoading = true) => {
    if (showLoading) setLoadingTasks(true);
    setTasksError(false);
    try {
      const response = await apiClient.get('/student/surveys/pending');
      const allSurveys = response.data?.data?.surveys || [];
      
      // Filter surveys that target this specific course ID
      const filtered = allSurveys.filter((survey: any) => {
        const targetCourse = survey.target?.course_id;
        if (!targetCourse) return false;
        
        const surveyCourseId = typeof targetCourse === 'object' 
          ? (targetCourse._id || targetCourse.id) 
          : targetCourse;
          
        return String(surveyCourseId) === String(moduleId);
      });
      
      setTasks(filtered);
    } catch (err) {
      console.error('Failed to load tasks for course:', err);
      setTasksError(true);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchCourseTasks(true);
  }, [moduleId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCourseTasks(false);
    setRefreshing(false);
  };

  const handleStartTask = (task: Survey) => {
    if (task.deadline) {
      const deadline = new Date(task.deadline).getTime();
      if (!isNaN(deadline) && deadline < Date.now()) {
        showAlert('Task Expired', 'The deadline for this task has passed. You can no longer submit it.', 'error');
        return;
      }
    }
    const taskId = task.id || task._id;
    const cName = typeof task.target?.course_id === 'object' ? (task.target.course_id.name || 'Course Assignment') : 'Course Assignment';
    router.push({
      pathname: '/FormRendererView',
      params: {
        taskId: taskId,
        taskTitle: task.title,
        courseName: cName,
      }
    });
  };

  const formatDeadlineText = (dateStr: string) => {
    try {
      const deadline = new Date(dateStr);
      if (isNaN(deadline.getTime())) return `Deadline: ${dateStr}`;
      
      const now = new Date();
      const diffMs = deadline.getTime() - now.getTime();
      
      if (diffMs < 0) {
        return `Expired on ${deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      }
      
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (diffDays > 0) {
        return `${diffDays}d ${diffHours}h remaining`;
      } else if (diffHours > 0) {
        return `${diffHours}h ${diffMinutes}m remaining`;
      } else {
        return `${diffMinutes}m remaining`;
      }
    } catch {
      return `Deadline: ${dateStr}`;
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Gradients */}
      {themeMode === 'dark' ? <LinearGradient colors={['#090514', '#0c0a1a', '#02010a']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} /> : null}
      {themeMode === 'dark' ? <RadialGlowOrb color="rgba(99,102,241,0.6)" size={500} style={{ top: -150, right: -150 }} /> : null}
      {themeMode === 'dark' ? <RadialGlowOrb color="rgba(168,85,247,0.5)" size={500} style={{ bottom: -50, left: -200 }} /> : null}
      {themeMode === 'dark' ? <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} /> : null}

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
        <Text style={styles.headerTitle} numberOfLines={1}>Course Details</Text>
        {/* Spacer to center title */}
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
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
        <Animatable.View animation="fadeInUp" duration={800} style={styles.cardContainer}>
          <BlurView intensity={45} tint="dark" style={styles.blurCard}>
            <View style={styles.iconContainer}>
              <BookOpen size={36} color="#6366f1" />
            </View>

            <View style={styles.codeBadge}>
              <Text style={styles.codeBadgeText}>{courseCode || 'N/A'}</Text>
            </View>

            <Text style={styles.courseName}>{courseName || 'Course Details'}</Text>

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
                <Text style={styles.infoLabel}>Course ID</Text>
                <Text style={styles.infoValue}>{moduleId || 'N/A'}</Text>
              </View>
            </View>

            {description && description.length > 0 ? (
              <>
                <View style={styles.divider} />
                <View style={styles.descriptionSection}>
                  <Text style={styles.descriptionLabel}>Course Description</Text>
                  <Text style={styles.descriptionValue}>{description}</Text>
                </View>
              </>
            ) : null}

            {/* Course Evaluations Section */}
            <View style={styles.divider} />
            <View style={styles.tasksSection}>
              <Text style={styles.tasksHeader}>Course Evaluations & Tasks</Text>
              
              {loadingTasks ? (
                <ActivityIndicator size="small" color="#6366f1" style={{ marginTop: 16 }} />
              ) : tasksError ? (
                <Text style={styles.tasksErrorText}>Failed to load course evaluations.</Text>
              ) : tasks.length === 0 ? (
                <Text style={styles.noTasksText}>No pending evaluations for this course! 🎉</Text>
              ) : (
                <View style={styles.tasksList}>
                  {tasks.map((task, index) => (
                    <Animatable.View
                      key={task.id || task._id}
                      animation="fadeInUp"
                      duration={500}
                      delay={index * 50}
                    >
                      <TouchableOpacity
                        style={styles.taskCard}
                        onPress={() => handleStartTask(task)}
                        activeOpacity={0.8}
                      >
                        <BlurView intensity={20} tint="dark" style={styles.taskCardBlur}>
                          <View style={styles.taskCardLeft}>
                            <ClipboardList size={18} color="#6366f1" style={styles.taskIcon} />
                            <View style={styles.taskTextContainer}>
                              <Text style={styles.taskTitle} numberOfLines={1}>
                                {task.title}
                              </Text>
                              <Text style={styles.taskDeadline} numberOfLines={1}>
                                {formatDeadlineText(task.deadline)}
                              </Text>
                            </View>
                          </View>
                          <ChevronRight size={16} color="#6366f1" />
                        </BlurView>
                      </TouchableOpacity>
                    </Animatable.View>
                  ))}
                </View>
              )}
            </View>
          </BlurView>
        </Animatable.View>
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
    backgroundColor: 'transparent',
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
  tasksSection: {
    width: '100%',
    alignItems: 'flex-start',
  },
  tasksHeader: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
  },
  tasksErrorText: {
    color: '#f87171',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  noTasksText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    fontStyle: 'italic',
  },
  tasksList: {
    width: '100%',
    gap: 12,
  },
  taskCard: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  taskCardBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  taskCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskIcon: {
    marginRight: 12,
  },
  taskTextContainer: {
    flex: 1,
  },
  taskTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  taskDeadline: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
});
