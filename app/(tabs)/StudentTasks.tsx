import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  Calendar,
  ChevronRight,
  AlertTriangle,
  Info,
  Check,
  BookOpen,
  User,
} from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import { useLocalSearchParams } from 'expo-router';
import apiClient from '../../src/api/client';

interface CoursePopulated {
  _id: string;
  name: string;
  courseCode: string;
}

interface CreatorPopulated {
  _id: string;
  firstName: string;
  lastName: string;
}

interface Survey {
  id: string;
  _id: string;
  title: string;
  description: string;
  deadline: string;
  target?: {
    course_id?: CoursePopulated;
  };
  creator_id?: CreatorPopulated;
  status: string;
}

interface Submission {
  id: string;
  _id?: string;
  task_id: {
    _id: string;
    title: string;
    deadline: string;
  } | string;
  createdAt: string;
  status: string;
}

interface Question {
  _id: string;
  id: string;
  label: string;
  type: 'short_text' | 'long_text' | 'linear_scale' | 'multiple_choice' | 'checkbox' | 'file';
  required: boolean;
  options?: string[];
  scale?: {
    min: number;
    max: number;
  };
}

interface FormSchema {
  _id: string;
  title: string;
  description?: string;
  questions: Question[];
}

export default function StudentTasks() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const selectedTaskId = params?.selectedTaskId as string | undefined;

  // Tabs
  const [activeTab, setActiveTab] = useState<'pending' | 'live' | 'history'>('pending');

  // Main Lists Data
  const [pendingSurveys, setPendingSurveys] = useState<Survey[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  // Live Form State (preserved across tabs)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeTaskTitle, setActiveTaskTitle] = useState<string>('');
  const [activeTaskCourse, setActiveTaskCourse] = useState<string>('');
  const [formSchema, setFormSchema] = useState<FormSchema | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch pending surveys from the backend API
  const fetchPendingSurveys = async (showFullScreenLoading = true) => {
    if (showFullScreenLoading) {
      setLoading(true);
    }
    setError(false);
    try {
      const [pendingRes, submissionsRes] = await Promise.all([
        apiClient.get('/student/surveys/pending'),
        apiClient.get('/task-submissions/my-submissions'),
      ]);

      setPendingSurveys(pendingRes.data?.data?.surveys || []);
      setSubmissions(submissionsRes.data?.data?.submissions || []);
    } catch (err) {
      console.error('Failed to fetch pending surveys:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingSurveys(true);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPendingSurveys(false);
    setRefreshing(false);
  };

  // Trigger start task if parameterized from dashboard
  useEffect(() => {
    if (selectedTaskId && pendingSurveys.length > 0) {
      const task = pendingSurveys.find((t) => (t.id || t._id) === selectedTaskId);
      if (task) {
        handleStartTask(task);
      }
    }
  }, [selectedTaskId, pendingSurveys]);

  const formatDeadlineText = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return `Closes: ${dateStr}`;
      const options: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      };
      return `Closes: ${date.toLocaleDateString('en-US', options)}`;
    } catch {
      return `Closes: ${dateStr}`;
    }
  };

  const getUrgencyColor = (deadlineStr: string) => {
    try {
      const deadline = new Date(deadlineStr).getTime();
      const now = Date.now();
      const diffMs = deadline - now;
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffHours > 0 && diffHours < 24) {
        return '#ef4444'; // Red for less than 24h
      }
      return '#6366f1'; // Indigo for normal
    } catch {
      return '#6366f1';
    }
  };

  // Start Form Lifecycle
  const handleStartTask = async (survey: Survey) => {
    const surveyId = survey.id || survey._id;
    if (!surveyId) return;

    setActiveTaskId(surveyId);
    setActiveTaskTitle(survey.title);
    
    const courseCode = survey.target?.course_id?.courseCode || 'GEN-101';
    const courseName = survey.target?.course_id?.name || 'General Assignment';
    setActiveTaskCourse(`${courseCode} | ${courseName}`);

    // Clear previous answers & schema
    setAnswers({});
    setFormSchema(null);
    setFormError(false);

    // Swap to Live Form tab
    setActiveTab('live');
    setFormLoading(true);

    try {
      // 1. Get task details
      const taskRes = await apiClient.get(`/tasks/${surveyId}`);
      const taskData = taskRes.data?.data?.task;
      if (!taskData) {
        throw new Error('Task details not found.');
      }

      if (!taskData.form_id) {
        throw new Error('This assignment does not contain an evaluation form.');
      }

      // 2. Get form schema
      const formId = typeof taskData.form_id === 'object' ? (taskData.form_id._id || taskData.form_id.id) : taskData.form_id;
      const formRes = await apiClient.get(`/v1/form/${formId}`);
      const formData = formRes.data?.data;
      if (!formData) {
        throw new Error('Form schema not found.');
      }

      setFormSchema(formData);

      // Pre-initialize answers state
      const initialAnswers: Record<string, any> = {};
      formData.questions.forEach((q: Question) => {
        if (q.type === 'checkbox') {
          initialAnswers[q._id || q.id] = [];
        } else {
          initialAnswers[q._id || q.id] = '';
        }
      });
      setAnswers(initialAnswers);
    } catch (err) {
      console.error('Failed to load form schema:', err);
      setFormError(true);
    } finally {
      setFormLoading(false);
    }
  };

  // Answer state modifiers
  const handleTextChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleMCQSelect = (questionId: string, option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleCheckboxToggle = (questionId: string, option: string) => {
    setAnswers((prev) => {
      const current = prev[questionId] || [];
      const updated = current.includes(option)
        ? current.filter((item: string) => item !== option)
        : [...current, option];
      return {
        ...prev,
        [questionId]: updated,
      };
    });
  };

  const handleScaleSelect = (questionId: string, val: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: val,
    }));
  };

  // Submission Flow
  const handleSubmitEvaluation = async () => {
    if (!formSchema || !activeTaskId) return;

    // Validate required questions
    const unansweredRequired = formSchema.questions.filter((q) => {
      const qId = q._id || q.id;
      const ans = answers[qId];
      if (!q.required) return false;
      if (q.type === 'checkbox') return !ans || ans.length === 0;
      return ans === undefined || ans === null || String(ans).trim() === '';
    });

    if (unansweredRequired.length > 0) {
      Alert.alert(
        'Required Fields',
        'Please answer all required questions before submitting.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        content: JSON.stringify(answers),
        attachments: [],
      };

      await apiClient.post(`/task-submissions/task/${activeTaskId}`, payload);

      Alert.alert('Success', 'Your evaluation has been submitted successfully!', [
        {
          text: 'OK',
          onPress: async () => {
            // Reset active form states
            setActiveTaskId(null);
            setFormSchema(null);
            setAnswers({});
            // Refresh main lists & switch to History tab
            await fetchPendingSurveys(false);
            setActiveTab('history');
          },
        },
      ]);
    } catch (err: any) {
      console.error('Failed to submit evaluation:', err);
      const msg = err.response?.data?.message || 'Failed to submit. Please try again.';
      Alert.alert('Submission Error', msg);
    } finally {
      setSubmitting(false);
    }
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
        <Text style={styles.loadingText}>Syncing Data...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Background Gradients */}
      <LinearGradient
        colors={['#090514', '#0c0a1a', '#02010a']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.glowOrb, { top: -100, right: -100, backgroundColor: 'rgba(99, 102, 241, 0.15)' }]} />
      <View style={[styles.glowOrb, { bottom: 100, left: -150, backgroundColor: 'rgba(168, 85, 247, 0.1)' }]} />

      <View style={[styles.mainWrapper, { paddingTop: Math.max(insets.top, 24) }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Evaluations</Text>
          <Text style={styles.subtitle}>Complete surveys and track academic status</Text>
        </View>

        {/* Restructured Top Tab Bar (3 tabs) */}
        <View style={styles.tabContainer}>
          <BlurView intensity={25} tint="dark" style={styles.tabBlur}>
            <TouchableOpacity
              style={styles.tabButton}
              onPress={() => setActiveTab('pending')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabButtonText, activeTab === 'pending' && styles.tabButtonTextActive]}>
                Pending Surveys
              </Text>
              {activeTab === 'pending' && <View style={styles.activeIndicator} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabButton}
              onPress={() => setActiveTab('live')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabButtonText, activeTab === 'live' && styles.tabButtonTextActive]}>
                Live Form
              </Text>
              {activeTab === 'live' && <View style={styles.activeIndicator} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabButton}
              onPress={() => setActiveTab('history')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabButtonText, activeTab === 'history' && styles.tabButtonTextActive]}>
                History
              </Text>
              {activeTab === 'history' && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          </BlurView>
        </View>

        {/* Main error banner if tasks list sync failed */}
        {error && (
          <Animatable.View animation="fadeInDown" style={styles.errorContainer}>
            <BlurView intensity={40} tint="dark" style={styles.errorBlur}>
              <View style={styles.errorLeft}>
                <AlertTriangle size={18} color="#f87171" style={styles.errorIcon} />
                <Text style={styles.errorText}>Failed to sync data.</Text>
              </View>
              <TouchableOpacity style={styles.retryButton} onPress={() => fetchPendingSurveys(true)}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </BlurView>
          </Animatable.View>
        )}

        {/* Tab Panel Renderers */}
        {activeTab === 'pending' ? (
          /* TAB 1: PENDING SURVEYS */
          <FlatList
            data={pendingSurveys}
            keyExtractor={(item) => item.id || item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.flatListContent,
              { paddingBottom: insets.bottom + 140 },
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#6366f1"
                colors={['#6366f1']}
              />
            }
            renderItem={({ item, index }) => {
              const courseCode = item.target?.course_id?.courseCode || 'GEN-101';
              const courseName = item.target?.course_id?.name || 'General Module';
              const instructorName = item.creator_id
                ? `${item.creator_id.firstName} ${item.creator_id.lastName}`
                : 'Dr. Unassigned';

              const urgencyColor = getUrgencyColor(item.deadline);

              return (
                <Animatable.View
                  animation="fadeInUp"
                  duration={600}
                  delay={index * 50}
                  style={styles.surveyCardContainer}
                >
                  <BlurView intensity={60} tint="dark" style={styles.surveyCardBlur}>
                    {/* Header Row */}
                    <View style={styles.surveyCardHeader}>
                      <Text style={styles.surveyTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <View style={[styles.urgencyDot, { backgroundColor: urgencyColor }]} />
                    </View>

                    {/* Meta Info Row */}
                    <View style={styles.surveyMetaRow}>
                      <View style={styles.metaItem}>
                        <BookOpen size={13} color="#94a3b8" />
                        <Text style={styles.metaText} numberOfLines={1}>
                          {courseCode} | {courseName}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <User size={13} color="#94a3b8" />
                        <Text style={styles.metaText} numberOfLines={1}>
                          {instructorName}
                        </Text>
                      </View>
                    </View>

                    {/* Footer Row */}
                    <View style={styles.surveyCardFooter}>
                      <Text style={styles.deadlineLabelText}>
                        {formatDeadlineText(item.deadline)}
                      </Text>
                      <TouchableOpacity
                        style={styles.takeSurveyButton}
                        onPress={() => handleStartTask(item)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.takeSurveyButtonText}>Take Survey</Text>
                      </TouchableOpacity>
                    </View>
                  </BlurView>
                </Animatable.View>
              );
            }}
            ListEmptyComponent={
              !refreshing ? (
                <BlurView intensity={20} tint="dark" style={styles.emptyContainer}>
                  <CheckCircle2 size={36} color="#34d399" style={styles.emptyIcon} />
                  <Text style={styles.emptyTitle}>No pending surveys! 🎉</Text>
                  <Text style={styles.emptyText}>You are all caught up.</Text>
                </BlurView>
              ) : null
            }
          />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 140 },
            ]}
            refreshControl={
              activeTab === 'history' ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#6366f1"
                  colors={['#6366f1']}
                />
              ) : undefined
            }
          >
            {/* TAB 2: LIVE DYNAMIC FORM RENDERER */}
            {activeTab === 'live' && (
              <View style={styles.tabPanel}>
                {!activeTaskId ? (
                  // State A: No evaluation active
                  <BlurView intensity={20} tint="dark" style={styles.emptyContainer}>
                    <ClipboardList size={36} color="#4f46e5" style={styles.emptyIcon} />
                    <Text style={styles.emptyTitle}>No Active Evaluation</Text>
                    <Text style={styles.emptyText}>
                      Please select an assignment from the 'Pending Surveys' tab to start.
                    </Text>
                  </BlurView>
                ) : formLoading ? (
                  // State B: Form configuration loading
                  <View style={styles.formStatusContainer}>
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text style={styles.formStatusText}>Loading evaluation schema...</Text>
                  </View>
                ) : formError || !formSchema ? (
                  // State C: Error loading schema
                  <View style={styles.formStatusContainer}>
                    <AlertTriangle size={36} color="#ef4444" style={{ marginBottom: 12 }} />
                    <Text style={styles.errorTitle}>Failed to load schema</Text>
                    <Text style={styles.formStatusText}>Could not read the form layout.</Text>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={() => handleStartTask({ id: activeTaskId, title: activeTaskTitle } as Survey)}
                    >
                      <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  // State D: Render dynamic form inputs
                  <View style={{ gap: 16 }}>
                    {/* Current Active Course header */}
                    <View style={styles.activeFormHeader}>
                      <Text style={styles.activeFormTitle}>{activeTaskTitle}</Text>
                      <Text style={styles.activeFormSubtitle}>{activeTaskCourse}</Text>
                    </View>

                    {formSchema.description && (
                      <View style={styles.instructionsContainer}>
                        <BlurView intensity={30} tint="dark" style={styles.instructionsBlur}>
                          <Info size={16} color="#a5b4fc" style={{ marginRight: 10 }} />
                          <Text style={styles.instructionsText}>{formSchema.description}</Text>
                        </BlurView>
                      </View>
                    )}

                    {/* Render questions list */}
                    {formSchema.questions.map((q, index) => {
                      const qId = q._id || q.id;
                      const currentAnswer = answers[qId];

                      return (
                        <Animatable.View
                          key={qId}
                          animation="fadeInUp"
                          duration={500}
                          delay={index * 40}
                          style={styles.questionCard}
                        >
                          <BlurView intensity={45} tint="dark" style={styles.questionBlur}>
                            {/* Question Label */}
                            <View style={styles.labelRow}>
                              <Text style={styles.questionLabel}>{q.label}</Text>
                              {q.required && <Text style={styles.requiredAsterisk}>*</Text>}
                            </View>

                            {/* Inputs mapping */}
                            {(q.type === 'short_text' || q.type === 'long_text') && (
                              <TextInput
                                value={currentAnswer || ''}
                                onChangeText={(val) => handleTextChange(qId, val)}
                                placeholder="Type your response here..."
                                placeholderTextColor="#94a3b8"
                                style={[
                                  styles.textInput,
                                  q.type === 'long_text' && styles.longTextInput,
                                ]}
                                multiline={q.type === 'long_text'}
                                numberOfLines={q.type === 'long_text' ? 4 : 1}
                              />
                            )}

                            {q.type === 'multiple_choice' && q.options && (
                              <View style={styles.optionsList}>
                                {q.options.map((option) => {
                                  const isSelected = currentAnswer === option;
                                  return (
                                    <TouchableOpacity
                                      key={option}
                                      onPress={() => handleMCQSelect(qId, option)}
                                      style={[
                                        styles.optionItem,
                                        isSelected && styles.optionItemActive,
                                      ]}
                                      activeOpacity={0.8}
                                    >
                                      <View
                                        style={[
                                          styles.radioCircle,
                                          isSelected && styles.radioCircleActive,
                                        ]}
                                      >
                                        {isSelected && <View style={styles.radioInner} />}
                                      </View>
                                      <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                                        {option}
                                      </Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                            )}

                            {q.type === 'checkbox' && q.options && (
                              <View style={styles.optionsList}>
                                {q.options.map((option) => {
                                  const isSelected = (currentAnswer || []).includes(option);
                                  return (
                                    <TouchableOpacity
                                      key={option}
                                      onPress={() => handleCheckboxToggle(qId, option)}
                                      style={[
                                        styles.optionItem,
                                        isSelected && styles.optionItemActive,
                                      ]}
                                      activeOpacity={0.8}
                                    >
                                      <View
                                        style={[
                                          styles.checkboxSquare,
                                          isSelected && styles.checkboxSquareActive,
                                        ]}
                                      >
                                        {isSelected && <Check size={12} color="#fff" />}
                                      </View>
                                      <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                                        {option}
                                      </Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                            )}

                            {q.type === 'linear_scale' && (
                              <View style={styles.scaleContainer}>
                                {Array.from(
                                  { length: (q.scale?.max || 5) - (q.scale?.min || 1) + 1 },
                                  (_, i) => (q.scale?.min || 1) + i
                                ).map((num) => {
                                  const isSelected = currentAnswer === num;
                                  return (
                                    <TouchableOpacity
                                      key={num}
                                      onPress={() => handleScaleSelect(qId, num)}
                                      style={[
                                        styles.scaleButton,
                                        isSelected && styles.scaleButtonActive,
                                      ]}
                                      activeOpacity={0.8}
                                    >
                                      <Text
                                        style={[
                                          styles.scaleButtonText,
                                          isSelected && styles.scaleButtonTextActive,
                                        ]}
                                      >
                                        {num}
                                      </Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                            )}
                          </BlurView>
                        </Animatable.View>
                      );
                    })}

                    {/* Submission Button */}
                    <Animatable.View animation="fadeInUp" style={styles.submitButtonContainer}>
                      <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSubmitEvaluation}
                        disabled={submitting}
                        activeOpacity={0.85}
                      >
                        {submitting ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <LinearGradient
                            colors={['#6366f1', '#4f46e5']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                          >
                            <CheckCircle2 size={20} color="#fff" />
                            <Text style={styles.submitButtonText}>Submit Evaluation</Text>
                          </LinearGradient>
                        )}
                      </TouchableOpacity>
                    </Animatable.View>
                  </View>
                )}
              </View>
            )}

            {/* TAB 3: SUBMISSION HISTORY */}
            {activeTab === 'history' && (
              <View style={styles.tabPanel}>
                {submissions.map((sub, index) => {
                  const subTask = typeof sub.task_id === 'object' ? sub.task_id : null;
                  const title = subTask?.title || 'Completed Survey';
                  const submissionDate = formatDeadlineText(sub.createdAt);

                  return (
                    <Animatable.View
                      key={sub.id || sub._id}
                      animation="fadeInUp"
                      duration={600}
                      delay={index * 50}
                      style={styles.cardContainer}
                    >
                      <BlurView intensity={45} tint="dark" style={styles.cardBlur}>
                        <View style={styles.completedHeader}>
                          <View style={styles.completedHeaderLeft}>
                            <View style={styles.checkWrapper}>
                              <CheckCircle2 size={16} color="#34d399" />
                            </View>
                            <View style={styles.completedTextContainer}>
                              <Text style={styles.taskTitle}>{title}</Text>
                              <Text style={styles.submissionDate}>Submitted: {submissionDate}</Text>
                            </View>
                          </View>
                          <View style={styles.statusBadge}>
                            <Text style={styles.statusBadgeText}>{sub.status}</Text>
                          </View>
                        </View>
                      </BlurView>
                    </Animatable.View>
                  );
                })}

                {submissions.length === 0 && (
                  <BlurView intensity={20} tint="dark" style={styles.emptyContainer}>
                    <ClipboardList size={36} color="#4f46e5" style={styles.emptyIcon} />
                    <Text style={styles.emptyTitle}>No Submissions Yet</Text>
                    <Text style={styles.emptyText}>Completed surveys and evaluations will appear here.</Text>
                  </BlurView>
                )}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
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
  header: {
    marginBottom: 16,
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
  tabContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.2)',
  },
  tabBlur: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    position: 'relative',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  tabButtonTextActive: {
    color: '#fff',
    fontWeight: '800',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '40%',
    height: 3,
    backgroundColor: '#6366f1',
    borderRadius: 2,
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
  flatListContent: {
    gap: 14,
  },
  surveyCardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 14,
  },
  surveyCardBlur: {
    padding: 16,
  },
  surveyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  surveyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    marginRight: 12,
  },
  urgencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  surveyMetaRow: {
    gap: 6,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  surveyCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deadlineLabelText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  takeSurveyButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 2,
  },
  takeSurveyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    gap: 14,
  },
  tabPanel: {
    gap: 14,
  },
  cardContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardBlur: {
    padding: 16,
  },
  cardHeader: {
    marginBottom: 12,
  },
  taskTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  courseName: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    gap: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completedHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  checkWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedTextContainer: {
    flex: 1,
  },
  submissionDate: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusBadgeText: {
    color: '#cfbcff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
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
  formStatusContainer: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 10,
    gap: 12,
  },
  formStatusText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeFormHeader: {
    marginBottom: 4,
  },
  activeFormTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  activeFormSubtitle: {
    color: '#a5b4fc',
    fontSize: 12,
    fontWeight: '700',
  },
  instructionsContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
  },
  instructionsBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  instructionsText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
    fontWeight: '500',
  },
  questionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  questionBlur: {
    padding: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  questionLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    flex: 1,
  },
  requiredAsterisk: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 4,
  },
  textInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    paddingHorizontal: 16,
    height: 48,
    fontSize: 14,
    fontWeight: '500',
  },
  longTextInput: {
    height: 120,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  optionsList: {
    gap: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    gap: 12,
  },
  optionItemActive: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94a3b8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: '#6366f1',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6366f1',
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94a3b8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSquareActive: {
    borderColor: '#6366f1',
    backgroundColor: '#6366f1',
  },
  optionText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  optionTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  scaleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  scaleButton: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scaleButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  scaleButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
  },
  scaleButtonTextActive: {
    color: '#fff',
  },
  submitButtonContainer: {
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitButton: {
    width: '100%',
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  errorTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
});
