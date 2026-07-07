import { useTheme } from '../../src/context/ThemeContext';
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
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Rocket, BookOpen, Clock, FileText, Paperclip, X, Zap } from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import RadialGlowOrb from '../../src/components/RadialGlowOrb';
import apiClient from '../../src/api/client';

export default function CreateStandardTaskScreen() {
  const { themeMode } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { courseId } = useLocalSearchParams<{ courseId: string }>();

  // Task Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formatDeadline = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  const [rubric, setRubric] = useState('');
  
  // Attachments
  const [attachments, setAttachments] = useState<DocumentPicker.DocumentPickerAsset[]>([]);

  // Publish State
  const [isPublishing, setIsPublishing] = useState(false);

  // AI Prompt & State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

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
      const aiTitle = response.data?.data?.title;
      const aiDescription = response.data?.data?.description;

      if (!aiTitle && !aiDescription) {
        Alert.alert('Error', 'AI failed to generate task details. Please try a different prompt.');
      } else {
        if (!title && aiTitle) setTitle(aiTitle);
        if (!description && aiDescription) setDescription(aiDescription);
        
        if (!rubric) {
           setRubric(`AI Grader Instructions:\nEvaluate the submission based on the task description. Ensure the core concepts of '${aiTitle || 'the task'}' are met.`);
        }
        setAiPrompt('');
      }
    } catch (err: any) {
      Alert.alert('Synthesis Error', err.response?.data?.message || 'Failed to generate AI task details.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        setAttachments((prev) => [...prev, ...result.assets]);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    if (!title.trim() || !description.trim() || !deadline || !rubric.trim()) {
      Alert.alert('Incomplete Form', 'Please fill in all task fields: Title, Description, Deadline, and AI Rubric.');
      return;
    }
    if (!courseId) {
      Alert.alert('Error', 'No course context found.');
      return;
    }

    setIsPublishing(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('deadline', deadline.toISOString());
      formData.append('ai_grading_rubric', rubric);
      formData.append('task_type', 'STANDARD');
      formData.append('status', 'ACTIVE');
      
      // Target requires JSON string in formData
      formData.append('target', JSON.stringify({ course_id: courseId }));

      if (attachments.length > 0) {
        attachments.forEach((file) => {
          // React Native fetch/axios requires this specific shape for files in FormData
          formData.append('attachments', {
            uri: file.uri,
            name: file.name,
            type: file.mimeType || 'application/octet-stream',
          } as any);
        });
      }

      await apiClient.post('/tasks', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', 'Standard Task created and published successfully!');
      router.back();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Publish Error', err.response?.data?.message || err.message || 'Failed to publish task.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <View style={styles.container}>
      {themeMode === 'dark' ? <LinearGradient colors={['#090514', '#0c0a1a', '#02010a']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} /> : null}
      {themeMode === 'dark' ? <RadialGlowOrb color="rgba(99,102,241,0.6)" size={500} style={{ top: -150, right: -150 }} /> : null}
      {themeMode === 'dark' ? <RadialGlowOrb color="rgba(168,85,247,0.5)" size={500} style={{ bottom: -50, left: -200 }} /> : null}
      {themeMode === 'dark' ? <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} /> : null}

      <View style={[styles.topBar, { paddingTop: Math.max(insets.top + 10, 30) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <BlurView intensity={30} tint="dark" style={styles.backBlur}>
            <ArrowLeft size={20} color="#fff" />
          </BlurView>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Standard Task</Text>
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
            <TextInput style={styles.input} placeholder="e.g. Weekly Reflection" placeholderTextColor="#475569" value={title} onChangeText={setTitle} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Context / Description</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Briefly describe the purpose of this assignment..." placeholderTextColor="#475569" value={description} onChangeText={setDescription} multiline />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Deadline</Text>
            <TouchableOpacity 
              style={[styles.inputWithIcon, { paddingHorizontal: 14 }]} 
              activeOpacity={0.7}
              onPress={() => setShowDatePicker(true)}
            >
              <Clock size={16} color={deadline ? '#818cf8' : '#94a3b8'} style={{ marginRight: 8 }} />
              <Text style={{ color: deadline ? '#fff' : '#475569', fontSize: 14, flex: 1 }}>
                {deadline ? formatDeadline(deadline) : 'Select a deadline...'}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={deadline || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  if (Platform.OS === 'android') setShowDatePicker(false);
                  if (selectedDate) setDeadline(selectedDate);
                }}
              />
            )}
            
            {showDatePicker && Platform.OS === 'ios' && (
               <TouchableOpacity 
                 style={{ backgroundColor: 'rgba(99,102,241,0.15)', padding: 14, borderRadius: 12, marginTop: 12, alignItems: 'center' }} 
                 onPress={() => setShowDatePicker(false)}
               >
                 <Text style={{ color: '#818cf8', fontWeight: '800' }}>Confirm Date</Text>
               </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>AI Grading Rubric</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Instructions for the AI evaluator (e.g. 'Ensure file contains 5 paragraphs')" placeholderTextColor="#475569" value={rubric} onChangeText={setRubric} multiline />
          </View>
        </Animatable.View>

        {/* AI Synthesis Form */}
        <Animatable.View animation="fadeInUp" duration={500} delay={100} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Zap size={16} color="#c084fc" style={{ marginRight: 8 }} />
            <Text style={[styles.sectionTitle, { color: '#c084fc' }]}>AI Task Generation</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Synthesis Prompt</Text>
            <TextInput
              style={[styles.input, styles.textArea, { borderColor: 'rgba(192,132,252,0.3)', backgroundColor: 'rgba(192,132,252,0.05)' }]}
              placeholder="e.g., Design a case study assignment about ethical AI in healthcare..."
              placeholderTextColor="#6b7280"
              value={aiPrompt}
              onChangeText={setAiPrompt}
              multiline
            />
          </View>

          <TouchableOpacity style={styles.synthesizeBtn} activeOpacity={0.8} onPress={handleSynthesize} disabled={isGenerating}>
            <LinearGradient colors={['#9333ea', '#7e22ce']} style={styles.synthesizeGradient}>
              {isGenerating ? <ActivityIndicator size="small" color="#fff" /> : <Zap size={18} color="#fff" />}
              <Text style={styles.synthesizeBtnText}>{isGenerating ? 'Synthesizing...' : 'Generate Task Details'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>

        {/* Attachments Form */}
        <Animatable.View animation="fadeInUp" duration={500} delay={100} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Paperclip size={16} color="#c084fc" style={{ marginRight: 8 }} />
            <Text style={[styles.sectionTitle, { color: '#c084fc' }]}>Attachments (Optional)</Text>
          </View>

          <TouchableOpacity style={styles.uploadBtn} activeOpacity={0.8} onPress={handlePickDocument}>
            <LinearGradient colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']} style={styles.uploadBtnGradient}>
              <FileText size={24} color="#94a3b8" style={{ marginBottom: 8 }} />
              <Text style={styles.uploadBtnTitle}>Tap to select files</Text>
              <Text style={styles.uploadBtnSub}>PDF, DOCX, TXT</Text>
            </LinearGradient>
          </TouchableOpacity>

          {attachments.length > 0 && (
            <View style={styles.attachmentList}>
              {attachments.map((file, index) => (
                <View key={index} style={styles.attachmentRow}>
                  <FileText size={16} color="#818cf8" />
                  <Text style={styles.attachmentName} numberOfLines={1}>{file.name}</Text>
                  <TouchableOpacity onPress={() => removeAttachment(index)} style={styles.removeAttBtn}>
                    <X size={16} color="#f87171" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </Animatable.View>
      </ScrollView>

      {/* Fixed Bottom Publish Bar */}
      <BlurView intensity={50} tint="dark" style={[styles.publishBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.publishBtn} activeOpacity={0.8} onPress={handlePublish} disabled={isPublishing}>
          <LinearGradient colors={['#4f46e5', '#4338ca']} style={styles.publishGradient}>
            {isPublishing ? <ActivityIndicator size="small" color="#fff" /> : <Rocket size={18} color="#fff" />}
            <Text style={styles.publishBtnText}>{isPublishing ? 'Publishing...' : 'Publish Task'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
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

  uploadBtn: { borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.05)', borderStyle: 'dashed' },
  uploadBtnGradient: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30 },
  uploadBtnTitle: { color: '#e2e8f0', fontSize: 14, fontWeight: '800' },
  uploadBtnSub: { color: '#64748b', fontSize: 11, fontWeight: '500', marginTop: 4 },

  attachmentList: { marginTop: 16, gap: 8 },
  attachmentRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12 },
  attachmentName: { flex: 1, fontSize: 13, color: '#e2e8f0', marginHorizontal: 12 },
  removeAttBtn: { padding: 4, backgroundColor: 'rgba(248,113,113,0.1)', borderRadius: 8 },

  publishBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 16, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  publishBtn: { borderRadius: 16, overflow: 'hidden' },
  publishGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  publishBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
});
