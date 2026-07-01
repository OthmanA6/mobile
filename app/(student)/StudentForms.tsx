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
  FileText,
  Calendar,
  ChevronRight,
  AlertTriangle,
  Info,
  Check,
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  History,
} from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import apiClient from '../../src/api/client';
import { theme } from '../../src/theme/theme';
import { useAuth } from '../../src/context/AuthContext';

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

interface Form {
  _id: string;
  id: string;
  title: string;
  description?: string;
  category: 'GENERAL' | 'SPECIALIZED';
  is_anonymous: boolean;
  is_active: boolean;
  evaluator_roles?: string[];
  createdAt?: string;
  creator_id?: {
    name?: string;
    email?: string;
  };
  questions: Question[];
  instructor_id?: any;
  course_id?: any;
  department_id?: any;
}

export default function StudentForms() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Screen state: 'list' or 'fill'
  const [viewState, setViewState] = useState<'list' | 'fill'>('list');
  const [listTab, setListTab] = useState<'pending' | 'history'>('pending');
  const [forms, setForms] = useState<Form[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  // Form filling states
  const [activeForm, setActiveForm] = useState<Form | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchStudentForms = async (showFullScreenLoading = true) => {
    if (showFullScreenLoading) {
      setLoading(true);
    }
    setError(false);
    try {
      const [formResponse, submissionResponse] = await Promise.all([
        apiClient.get('/v1/form'),
        apiClient.get('/forms/my-submissions')
      ]);
      const allForms = formResponse.data?.data || [];
      const mySubmissions = submissionResponse.data?.data || [];
      setSubmissions(mySubmissions);

      const submittedFormIds = new Set(
        mySubmissions.map((s: any) => {
          if (!s.form_id) return null;
          return typeof s.form_id === 'object' ? s.form_id._id || s.form_id.id : s.form_id;
        }).filter(Boolean)
      );
      
      const studentForms = allForms.filter((f: Form) => {
        const formId = f.id || f._id;
        if (submittedFormIds.has(formId)) return false;

        const isStudentForm = f.is_active && f.evaluator_roles?.includes('STUDENT');
        if (!isStudentForm) return false;
        
        if (f.department_id) {
          const formDeptId = typeof f.department_id === 'object' ? (f.department_id as any)._id || (f.department_id as any).id : f.department_id;
          const userDeptId = typeof user?.departmentId === 'object' ? (user.departmentId as any)._id || (user.departmentId as any).id : user?.departmentId;
          return formDeptId === userDeptId;
        }
        
        return true;
      });
      
      setForms(studentForms);
    } catch (err) {
      console.error('Failed to fetch student forms:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentForms(true);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStudentForms(false);
    setRefreshing(false);
  };

  const handleStartForm = (form: Form) => {
    setActiveForm(form);
    
    // Pre-initialize answers state
    const initialAnswers: Record<string, any> = {};
    form.questions.forEach((q) => {
      if (q.type === 'checkbox') {
        initialAnswers[q._id || q.id] = [];
      } else {
        initialAnswers[q._id || q.id] = '';
      }
    });
    setAnswers(initialAnswers);
    setViewState('fill');
  };

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

  const handleSubmitForm = async () => {
    if (!activeForm) return;

    // Validate required questions
    const unansweredRequired = activeForm.questions.filter((q) => {
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
      const payloadAnswers = activeForm.questions.map((q) => {
        const qId = q._id || q.id;
        return {
          question_id: qId,
          value: answers[qId] || ''
        };
      });

      const getRawId = (val: any) => {
        if (!val) return undefined;
        if (typeof val === 'object' && val._id) return val._id;
        if (typeof val === 'object' && val.id) return val.id;
        return val;
      };

      const subjectId =
        getRawId(activeForm.instructor_id) ||
        getRawId(activeForm.course_id) ||
        getRawId(activeForm.department_id) ||
        activeForm._id ||
        activeForm.id;

      await apiClient.post(`/forms/${activeForm._id || activeForm.id}/submissions`, {
        subject_id: subjectId,
        answers: payloadAnswers,
      });

      Alert.alert('Success', 'Your response has been submitted successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setViewState('list');
            setActiveForm(null);
            setAnswers({});
            fetchStudentForms(false);
          },
        },
      ]);
    } catch (err: any) {
      console.error('Failed to submit form:', err);
      const msg = err.response?.data?.message || 'Failed to submit. Please try again.';
      Alert.alert('Submission Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recent';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
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
        <Text style={styles.loadingText}>Syncing Forms...</Text>
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

      {viewState === 'list' ? (
        /* ================= LIST VIEW ================= */
        <View style={[styles.mainWrapper, { paddingTop: Math.max(insets.top, 24) }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Surveys & Feedback</Text>
            <Text style={styles.subtitle}>Complete evaluations or check your submission history</Text>
          </View>

          {/* Custom Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tabButton, listTab === 'pending' && styles.tabButtonActive]}
              onPress={() => setListTab('pending')}
            >
              <Text style={[styles.tabButtonText, listTab === 'pending' && styles.tabButtonTextActive]}>
                Pending
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, listTab === 'history' && styles.tabButtonActive]}
              onPress={() => setListTab('history')}
            >
              <Text style={[styles.tabButtonText, listTab === 'history' && styles.tabButtonTextActive]}>
                History
              </Text>
            </TouchableOpacity>
          </View>

          {error && (
            <Animatable.View animation="fadeInDown" style={styles.errorContainer}>
              <BlurView intensity={40} tint="dark" style={styles.errorBlur}>
                <View style={styles.errorLeft}>
                  <AlertTriangle size={18} color="#f87171" style={styles.errorIcon} />
                  <Text style={styles.errorText}>Failed to sync forms.</Text>
                </View>
                <TouchableOpacity style={styles.retryButton} onPress={() => fetchStudentForms(true)}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </BlurView>
            </Animatable.View>
          )}

          <FlatList
            data={listTab === 'pending' ? forms : submissions}
            keyExtractor={(item: any) => item.id || item._id}
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
            renderItem={({ item, index }: { item: any, index: number }) => {
              if (listTab === 'pending') {
                return (
                  <Animatable.View
                    animation="fadeInUp"
                    duration={600}
                    delay={index * 50}
                    style={styles.cardContainer}
                  >
                    <BlurView intensity={45} tint="dark" style={styles.cardBlur}>
                      <View style={styles.cardHeader}>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryText}>{item.category}</Text>
                        </View>
                        <View style={styles.dateRow}>
                          <Calendar size={12} color="#94a3b8" />
                          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                        </View>
                      </View>

                      <Text style={styles.formTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      
                      {item.description ? (
                        <Text style={styles.formDescription} numberOfLines={2}>
                          {item.description}
                        </Text>
                      ) : null}

                      <View style={styles.cardFooter}>
                        <Text style={styles.questionCountText}>
                          {item.questions?.length || 0} Questions
                        </Text>
                        <TouchableOpacity
                          style={styles.takeFormButton}
                          onPress={() => handleStartForm(item)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.takeFormButtonText}>Take Survey</Text>
                          <ChevronRight size={14} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </BlurView>
                  </Animatable.View>
                );
              } else {
                const formObj = item.form_id || {};
                const formTitle = formObj.title || 'Unknown Survey';
                const formCategory = formObj.category || 'SURVEY';
                return (
                  <Animatable.View
                    animation="fadeInUp"
                    duration={600}
                    delay={index * 50}
                    style={[styles.cardContainer, { opacity: 0.8 }]}
                  >
                    <BlurView intensity={45} tint="dark" style={styles.cardBlur}>
                      <View style={styles.cardHeader}>
                        <View style={[styles.categoryBadge, { backgroundColor: 'rgba(148, 163, 184, 0.15)', borderColor: 'rgba(148, 163, 184, 0.3)' }]}>
                          <Text style={[styles.categoryText, { color: '#cbd5e1' }]}>{formCategory}</Text>
                        </View>
                        <View style={styles.dateRow}>
                          <CheckCircle2 size={12} color="#10b981" />
                          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                        </View>
                      </View>
                      <Text style={styles.formTitle} numberOfLines={2}>
                        {formTitle}
                      </Text>
                      <View style={{ marginTop: 12 }}>
                        <Text style={{ color: '#10b981', fontSize: 13, fontWeight: '600' }}>
                          Submitted successfully
                        </Text>
                      </View>
                    </BlurView>
                  </Animatable.View>
                );
              }
            }}
            ListEmptyComponent={
              !refreshing ? (
                listTab === 'pending' ? (
                  <BlurView intensity={20} tint="dark" style={styles.emptyContainer}>
                    <CheckCircle2 size={36} color="#34d399" style={styles.emptyIcon} />
                    <Text style={styles.emptyTitle}>All Caught Up! 🎉</Text>
                    <Text style={styles.emptyText}>There are no pending surveys assigned to you at the moment.</Text>
                  </BlurView>
                ) : (
                  <BlurView intensity={20} tint="dark" style={styles.emptyContainer}>
                    <History size={36} color="#94a3b8" style={[styles.emptyIcon, { opacity: 0.5 }]} />
                    <Text style={styles.emptyTitle}>No History</Text>
                    <Text style={styles.emptyText}>You haven't completed any surveys yet.</Text>
                  </BlurView>
                )
              ) : null
            }
          />
        </View>
      ) : (
        /* ================= FILL VIEW ================= */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: Math.max(insets.top, 24), paddingBottom: insets.bottom + 140 },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setViewState('list');
              setActiveForm(null);
            }}
          >
            <ArrowLeft size={20} color="#fff" />
            <Text style={styles.backButtonText}>Back to Surveys</Text>
          </TouchableOpacity>

          <View style={styles.activeFormHeader}>
            <Text style={styles.activeFormTitle}>{activeForm?.title}</Text>
            {activeForm?.description ? (
              <View style={styles.instructionsContainer}>
                <BlurView intensity={30} tint="dark" style={styles.instructionsBlur}>
                  <Info size={16} color="#a5b4fc" style={{ marginRight: 10 }} />
                  <Text style={styles.instructionsText}>{activeForm.description}</Text>
                </BlurView>
              </View>
            ) : null}
          </View>

          {/* Render questions list */}
          <View style={{ gap: 16 }}>
            {activeForm?.questions.map((q, index) => {
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
                    <View style={styles.labelRow}>
                      <Text style={styles.questionLabel}>
                        {index + 1}. {q.label}
                      </Text>
                      {q.required && <Text style={styles.requiredAsterisk}>*</Text>}
                    </View>

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
                onPress={handleSubmitForm}
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
                    <Text style={styles.submitButtonText}>Submit Survey</Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </Animatable.View>
          </View>
        </ScrollView>
      )}
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
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 6,
    lineHeight: 20,
  },
  flatListContent: {
    paddingTop: 10,
    gap: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  tabButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#fff',
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
  cardContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardBlur: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  categoryBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  categoryText: {
    fontSize: 10,
    color: '#cfbcff',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 24,
  },
  formDescription: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 8,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  questionCountText: {
    fontSize: 13,
    color: '#a78bfa',
    fontWeight: '700',
  },
  takeFormButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 4,
  },
  takeFormButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
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
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
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

  // FILL VIEW STYLES
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  backButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  activeFormHeader: {
    marginBottom: 24,
  },
  activeFormTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 30,
  },
  instructionsContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  instructionsBlur: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
  },
  instructionsText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
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
    marginBottom: 16,
  },
  questionLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    flex: 1,
    lineHeight: 22,
  },
  requiredAsterisk: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  textInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 14,
    color: '#fff',
    fontSize: 15,
  },
  longTextInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  optionsList: {
    gap: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 14,
    gap: 12,
  },
  optionItemActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: '#6366f1',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSquareActive: {
    borderColor: '#6366f1',
    backgroundColor: '#6366f1',
  },
  optionText: {
    fontSize: 15,
    color: '#94a3b8',
    fontWeight: '600',
  },
  optionTextActive: {
    color: '#fff',
  },
  scaleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  scaleButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scaleButtonActive: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  scaleButtonText: {
    fontSize: 15,
    color: '#94a3b8',
    fontWeight: '700',
  },
  scaleButtonTextActive: {
    color: '#fff',
  },
  submitButtonContainer: {
    marginTop: 12,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 56,
  },
  gradientButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
