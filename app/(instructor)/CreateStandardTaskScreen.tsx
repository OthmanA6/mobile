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
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Rocket, BookOpen, Clock, FileText, Paperclip, X } from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import apiClient from '../../src/api/client';

export default function CreateStandardTaskScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { courseId } = useLocalSearchParams<{ courseId: string }>();

  // Task Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState(''); // Simple string input for MVP
  const [rubric, setRubric] = useState('');
  
  // Attachments
  const [attachments, setAttachments] = useState<DocumentPicker.DocumentPickerAsset[]>([]);

  // Publish State
  const [isPublishing, setIsPublishing] = useState(false);

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
    if (!title.trim() || !description.trim() || !deadline.trim() || !rubric.trim()) {
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
      formData.append('deadline', new Date(deadline).toISOString());
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
      <LinearGradient colors={['#090514', '#0c0a1a', '#02010a']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
      <View style={[styles.glowOrb, { top: -100, right: -100, backgroundColor: 'rgba(99,102,241,0.15)' }]} />
      <View style={[styles.glowOrb, { bottom: 100, left: -150, backgroundColor: 'rgba(168,85,247,0.1)' }]} />

      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) }]}>
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
            <Text style={styles.label}>Deadline (YYYY-MM-DD)</Text>
            <View style={styles.inputWithIcon}>
              <Clock size={16} color="#94a3b8" style={styles.inputIcon} />
              <TextInput style={styles.inputInner} placeholder="2026-12-01" placeholderTextColor="#475569" value={deadline} onChangeText={setDeadline} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>AI Grading Rubric</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Instructions for the AI evaluator (e.g. 'Ensure file contains 5 paragraphs')" placeholderTextColor="#475569" value={rubric} onChangeText={setRubric} multiline />
          </View>
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
