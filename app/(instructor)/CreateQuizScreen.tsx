import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Rocket, Zap, BookOpen, Clock, CheckCircle2, Plus, Type, AlignLeft, CircleDot, CheckSquare, Star, Trash2, X } from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '../../src/api/client';

type QuestionType = 'short_text' | 'long_text' | 'multiple_choice' | 'checkbox' | 'linear_scale';

interface Question {
  id: string;
  type: QuestionType;
  label: string;
  required?: boolean;
  options?: string[];
  scale?: { min: number; max: number };
}

export default function CreateQuizScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { courseId } = useLocalSearchParams<{ courseId: string }>();

  // Task Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState(''); 
  const [rubric, setRubric] = useState('');

  // Questions State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showQuestionTypeModal, setShowQuestionTypeModal] = useState(false);

  // AI Prompt & State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Publish State
  const [isPublishing, setIsPublishing] = useState(false);

  const generateId = () => `q-${Math.random().toString(36).substr(2, 9)}`;

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: generateId(),
      type,
      label: '',
      required: true,
      options: (type === 'multiple_choice' || type === 'checkbox') ? ['Option 1'] : undefined,
      scale: type === 'linear_scale' ? { min: 1, max: 5 } : undefined,
    };
    setQuestions((prev) => [...prev, newQuestion]);
    setShowQuestionTypeModal(false);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const deleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleSynthesize = async () => {
    if (!aiPrompt.trim()) {
      Alert.alert('Missing Prompt', 'Please describe what you want the AI to generate.');
      return;
    }
    setIsGenerating(true);
    try {
      const payload = JSON.stringify({ prompt: aiPrompt });
      const response = await apiClient.post('/ai/generate-form', payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      const aiQuestions = response.data?.data?.questions || [];
      const aiTitle = response.data?.data?.title;
      const aiDescription = response.data?.data?.description;

      if (aiQuestions.length === 0) {
        Alert.alert('Error', 'AI failed to generate any questions. Please try a different prompt.');
      } else {
        const mapped = aiQuestions.map((q: any) => ({
          ...q,
          id: generateId(),
        }));
        setQuestions((prev) => [...prev, ...mapped]);
        
        // Auto-fill title and description if they are empty
        if (!title && aiTitle) setTitle(aiTitle);
        if (!description && aiDescription) setDescription(aiDescription);

        setAiPrompt('');
      }
    } catch (err: any) {
      Alert.alert('Synthesis Error', err.response?.data?.message || 'Failed to generate AI quiz structure.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || !description.trim() || !deadline.trim() || !rubric.trim()) {
      Alert.alert('Incomplete Form', 'Please fill in all task fields: Title, Description, Deadline, and AI Rubric.');
      return;
    }
    if (questions.length === 0) {
      Alert.alert('No Questions', 'Please add or synthesize at least one question.');
      return;
    }
    // Validation
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (q.label.trim().length < 3) {
        Alert.alert('Validation Error', `Question ${i + 1} must have a label of at least 3 characters.`);
        return;
      }
      if ((q.type === 'multiple_choice' || q.type === 'checkbox') && (!q.options || q.options.length < 2)) {
        Alert.alert('Validation Error', `Question ${i + 1} requires at least 2 options.`);
        return;
      }
    }

    if (!courseId) {
      Alert.alert('Error', 'No course context found.');
      return;
    }

    setIsPublishing(true);
    try {
      // 1. Create Form
      const formPayload = {
        title,
        description,
        category: 'QUIZ',
        is_anonymous: false,
        is_active: true,
        course_id: courseId,
      };
      const formRes = await apiClient.post('/v1/form/', formPayload);
      const formId = formRes.data?.data?._id || formRes.data?.data?.id;

      if (!formId) throw new Error('Failed to create form container.');

      // 2. Add Questions sequentially
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qPayload: any = {
          label: q.label,
          type: q.type,
          required: q.required !== undefined ? q.required : true,
          order: i + 1,
        };
        if (q.type === 'multiple_choice' || q.type === 'checkbox') {
          qPayload.options = q.options;
        }
        if (q.type === 'linear_scale') {
          qPayload.scale = q.scale;
        }
        await apiClient.post(`/v1/questions/${formId}/questions`, qPayload);
      }

      // 3. Create Task
      const taskPayload = {
        title,
        description,
        deadline: new Date(deadline).toISOString(),
        ai_grading_rubric: rubric,
        task_type: 'QUIZ',
        target: { course_id: courseId },
        status: 'ACTIVE',
        form_id: formId,
      };
      await apiClient.post('/tasks', taskPayload);

      Alert.alert('Success', 'Quiz Task created and published successfully!');
      router.back();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Publish Error', err.response?.data?.message || err.message || 'Failed to publish quiz.');
    } finally {
      setIsPublishing(false);
    }
  };

  const renderQuestionCard = (q: Question, idx: number) => {
    return (
      <View key={q.id} style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <View style={styles.questionTypeBadge}>
            <Text style={styles.questionType}>{q.type.replace('_', ' ').toUpperCase()}</Text>
          </View>
          <TouchableOpacity onPress={() => deleteQuestion(q.id)} style={styles.deleteBtn}>
            <Trash2 size={16} color="#f87171" />
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.questionLabelInput}
          placeholder={`Question ${idx + 1}`}
          placeholderTextColor="#64748b"
          value={q.label}
          onChangeText={(text) => updateQuestion(q.id, { label: text })}
          multiline
        />

        {(q.type === 'multiple_choice' || q.type === 'checkbox') && q.options && (
          <View style={styles.optionsWrap}>
            {q.options.map((opt, oIdx) => (
              <View key={oIdx} style={styles.optionRow}>
                <View style={q.type === 'checkbox' ? styles.optionSquare : styles.optionCircle} />
                <TextInput
                  style={styles.optionInput}
                  placeholder={`Option ${oIdx + 1}`}
                  placeholderTextColor="#64748b"
                  value={opt}
                  onChangeText={(text) => {
                    const newOpts = [...q.options!];
                    newOpts[oIdx] = text;
                    updateQuestion(q.id, { options: newOpts });
                  }}
                />
                <TouchableOpacity
                  onPress={() => {
                    const newOpts = q.options!.filter((_, i) => i !== oIdx);
                    updateQuestion(q.id, { options: newOpts });
                  }}
                  style={styles.removeOptBtn}
                >
                  <X size={14} color="#f87171" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              onPress={() => updateQuestion(q.id, { options: [...q.options!, `Option ${q.options!.length + 1}`] })}
              style={styles.addOptBtn}
            >
              <Plus size={14} color="#818cf8" style={{ marginRight: 4 }} />
              <Text style={styles.addOptText}>Add Option</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#090514', '#0c0a1a', '#02010a']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
      <View style={[styles.glowOrb, { top: -100, right: -100, backgroundColor: 'rgba(168,85,247,0.15)' }]} />
      <View style={[styles.glowOrb, { bottom: 100, left: -150, backgroundColor: 'rgba(99,102,241,0.1)' }]} />

      <View style={[styles.topBar, { paddingTop: Math.max(insets.top + 10, 30) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <BlurView intensity={30} tint="dark" style={styles.backBlur}>
            <ArrowLeft size={20} color="#fff" />
          </BlurView>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quiz Builder</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}>
        
        {/* Task Details Form */}
        <Animatable.View animation="fadeInUp" duration={500} style={styles.section}>
          <View style={styles.sectionHeader}>
            <BookOpen size={16} color="#818cf8" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Task Specification</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Task Title</Text>
            <TextInput style={styles.input} placeholder="e.g. Midterm Assessment" placeholderTextColor="#475569" value={title} onChangeText={setTitle} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Context / Description</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Briefly describe the purpose of this quiz..." placeholderTextColor="#475569" value={description} onChangeText={setDescription} multiline />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Deadline (YYYY-MM-DD)</Text>
            <View style={styles.inputWithIcon}>
              <Clock size={16} color="#94a3b8" style={styles.inputIcon} />
              <TextInput style={styles.inputInner} placeholder="2026-12-01" placeholderTextColor="#475569" value={deadline} onChangeText={setDeadline} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>AI Grading Rubric</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Instructions for the AI evaluator (e.g. 'Award full points if reasoning is clear')" placeholderTextColor="#475569" value={rubric} onChangeText={setRubric} multiline />
          </View>
        </Animatable.View>

        {/* AI Synthesis Form */}
        <Animatable.View animation="fadeInUp" duration={500} delay={100} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Zap size={16} color="#c084fc" style={{ marginRight: 8 }} />
            <Text style={[styles.sectionTitle, { color: '#c084fc' }]}>AI Quiz Generation</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Synthesis Prompt</Text>
            <TextInput
              style={[styles.input, styles.textArea, { borderColor: 'rgba(192,132,252,0.3)', backgroundColor: 'rgba(192,132,252,0.05)' }]}
              placeholder="e.g., Design a 5-question quiz evaluating student understanding of React Hooks..."
              placeholderTextColor="#6b7280"
              value={aiPrompt}
              onChangeText={setAiPrompt}
              multiline
            />
          </View>

          <TouchableOpacity style={styles.synthesizeBtn} activeOpacity={0.8} onPress={handleSynthesize} disabled={isGenerating}>
            <LinearGradient colors={['#9333ea', '#7e22ce']} style={styles.synthesizeGradient}>
              {isGenerating ? <ActivityIndicator size="small" color="#fff" /> : <Zap size={18} color="#fff" />}
              <Text style={styles.synthesizeBtnText}>{isGenerating ? 'Synthesizing...' : 'Generate Questions'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>

        {/* Questions Canvas */}
        <Animatable.View animation="fadeInUp" duration={500} delay={150} style={styles.section}>
          <View style={styles.sectionHeader}>
            <CheckCircle2 size={16} color="#10b981" style={{ marginRight: 8 }} />
            <Text style={[styles.sectionTitle, { color: '#10b981' }]}>Questions ({questions.length})</Text>
          </View>

          <View style={styles.questionsList}>
            {questions.map((q, idx) => renderQuestionCard(q, idx))}
          </View>

          <TouchableOpacity style={styles.addQuestionBtn} activeOpacity={0.8} onPress={() => setShowQuestionTypeModal(true)}>
            <LinearGradient colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']} style={styles.addQuestionGradient}>
              <Plus size={20} color="#94a3b8" />
              <Text style={styles.addQuestionText}>Add Question Manually</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>
      </ScrollView>

      {/* Fixed Bottom Publish Bar */}
      <BlurView intensity={50} tint="dark" style={[styles.publishBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.publishBtn} activeOpacity={0.8} onPress={handlePublish} disabled={isPublishing}>
          <LinearGradient colors={['#4f46e5', '#4338ca']} style={styles.publishGradient}>
            {isPublishing ? <ActivityIndicator size="small" color="#fff" /> : <Rocket size={18} color="#fff" />}
            <Text style={styles.publishBtnText}>{isPublishing ? 'Publishing...' : 'Publish Quiz Task'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </BlurView>

      {/* Question Type Modal */}
      <Modal visible={showQuestionTypeModal} transparent animationType="fade" onRequestClose={() => setShowQuestionTypeModal(false)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <Animatable.View animation="slideInUp" duration={300} style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Question Type</Text>
              <TouchableOpacity onPress={() => setShowQuestionTypeModal(false)} style={styles.modalCloseBtn}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalOptions}>
              <TouchableOpacity style={styles.typeRow} onPress={() => addQuestion('short_text')}>
                <View style={styles.typeIconBox}><Type size={20} color="#818cf8" /></View>
                <View>
                  <Text style={styles.typeTitle}>Short Text</Text>
                  <Text style={styles.typeDesc}>Brief alphanumeric responses</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.typeRow} onPress={() => addQuestion('long_text')}>
                <View style={styles.typeIconBox}><AlignLeft size={20} color="#818cf8" /></View>
                <View>
                  <Text style={styles.typeTitle}>Extended Text</Text>
                  <Text style={styles.typeDesc}>Detailed narrative feedback</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.typeRow} onPress={() => addQuestion('multiple_choice')}>
                <View style={styles.typeIconBox}><CircleDot size={20} color="#818cf8" /></View>
                <View>
                  <Text style={styles.typeTitle}>Multiple Choice</Text>
                  <Text style={styles.typeDesc}>Select a single option</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.typeRow} onPress={() => addQuestion('checkbox')}>
                <View style={styles.typeIconBox}><CheckSquare size={20} color="#818cf8" /></View>
                <View>
                  <Text style={styles.typeTitle}>Checkbox</Text>
                  <Text style={styles.typeDesc}>Multiple selection allowed</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.typeRow} onPress={() => addQuestion('linear_scale')}>
                <View style={styles.typeIconBox}><Star size={20} color="#818cf8" /></View>
                <View>
                  <Text style={styles.typeTitle}>Linear Scale</Text>
                  <Text style={styles.typeDesc}>Numerical rating (1-5)</Text>
                </View>
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
  
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginRight: 16 },
  backBlur: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },

  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  
  section: { backgroundColor: 'rgba(15,23,42,0.5)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 20, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#e2e8f0', letterSpacing: 0.5 },

  inputGroup: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  input: { backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 14, paddingHorizontal: 14, height: 50 },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 14 },
  
  inputWithIcon: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, height: 50 },
  inputIcon: { marginLeft: 14, marginRight: 8 },
  inputInner: { flex: 1, color: '#fff', fontSize: 14, height: '100%' },

  synthesizeBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  synthesizeGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  synthesizeBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },

  // Questions
  questionsList: { gap: 12, marginBottom: 16 },
  questionCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16 },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  questionTypeBadge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  questionType: { fontSize: 10, fontWeight: '800', color: '#94a3b8' },
  deleteBtn: { padding: 4, backgroundColor: 'rgba(248,113,113,0.1)', borderRadius: 8 },
  questionLabelInput: { fontSize: 15, fontWeight: '700', color: '#fff', paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  
  optionsWrap: { marginTop: 12, gap: 8 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionCircle: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: '#64748b' },
  optionSquare: { width: 12, height: 12, borderRadius: 2, borderWidth: 1, borderColor: '#64748b' },
  optionInput: { flex: 1, fontSize: 13, color: '#cbd5e1', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingVertical: 4 },
  removeOptBtn: { padding: 4 },
  addOptBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, marginTop: 4 },
  addOptText: { fontSize: 12, fontWeight: '600', color: '#818cf8' },

  addQuestionBtn: { borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.05)', borderStyle: 'dashed' },
  addQuestionGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18 },
  addQuestionText: { color: '#94a3b8', fontSize: 14, fontWeight: '800' },

  publishBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 16, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  publishBtn: { borderRadius: 16, overflow: 'hidden' },
  publishGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  publishBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContainer: { backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#fff' },
  modalCloseBtn: { padding: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  modalOptions: { gap: 12 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  typeIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(99,102,241,0.1)', justifyContent: 'center', alignItems: 'center' },
  typeTitle: { fontSize: 14, fontWeight: '800', color: '#f8fafc' },
  typeDesc: { fontSize: 11, fontWeight: '500', color: '#94a3b8', marginTop: 2 },
});
