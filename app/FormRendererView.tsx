import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Info,
  Check,
  Paperclip,
  Image as ImageIcon,
  Trash2,
  FileText,
  Download,
} from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import apiClient from '../src/api/client';
import CustomAlert, { AlertButton } from '../components/CustomAlert';

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

export default function FormRendererView() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { taskId, taskTitle, courseName } = useLocalSearchParams();

  // Loading, error, states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  
  const [task, setTask] = useState<any>(null);
  const [form, setForm] = useState<FormSchema | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // Attachments State
  const [attachments, setAttachments] = useState<{ url: string; fileName: string; size: number }[]>([]);
  const [uploading, setUploading] = useState(false);

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

  const getFullUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = process.env.EXPO_PUBLIC_API_URL 
      ? process.env.EXPO_PUBLIC_API_URL.replace(/\/api\/?$/, '') 
      : 'http://10.171.240.63:5000';
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    return `${baseUrl}/${cleanUrl}`;
  };

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

  // Document picking logic
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      await uploadFile(asset.uri, asset.name, asset.mimeType || 'application/octet-stream', asset.size || 0);
    } catch (err) {
      console.error('Document picking failed:', err);
      showAlert('Error', 'Failed to select document.', 'error');
    }
  };

  // Image picking logic
  const handlePickImage = async (useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          showAlert('Permission Denied', 'Camera access is required to take photos.', 'warning');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showAlert('Permission Denied', 'Photo library access is required to select photos.', 'warning');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
      }

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const name = asset.fileName || `photo_${Date.now()}.jpg`;
      const mime = asset.mimeType || 'image/jpeg';
      const size = asset.fileSize || 0;

      await uploadFile(asset.uri, name, mime, size);
    } catch (err) {
      console.error('Image picking failed:', err);
      showAlert('Error', 'Failed to pick image.', 'error');
    }
  };

  // Upload file to backend
  const uploadFile = async (uri: string, name: string, type: string, size: number) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: name,
        type: type,
      } as any);

      const response = await apiClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadedData = response.data?.data;
      if (uploadedData && uploadedData.url) {
        const attachment = {
          url: uploadedData.url,
          fileName: name,
          size: size || uploadedData.size || 0,
        };
        setAttachments((prev) => [...prev, attachment]);
        showAlert('Uploaded', 'File attached successfully.', 'success');
      } else {
        throw new Error('Upload response failed.');
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      const msg = err.response?.data?.message || 'Server error uploading file.';
      showAlert('Upload Error', msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectAttachmentType = () => {
    showAlert(
      'Attach File / Image',
      'Choose how you want to attach your solution file:',
      'info',
      [
        { text: 'Take a Photo', onPress: () => handlePickImage(true) },
        { text: 'Choose from Gallery', onPress: () => handlePickImage(false) },
        { text: 'Upload Document (PDF, doc)', onPress: handlePickDocument },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const fetchFormSchema = async () => {
    setLoading(true);
    setError(false);
    try {
      // 1. Get task by ID
      const taskRes = await apiClient.get(`/tasks/${taskId}`);
      const task = taskRes.data?.data?.task;

      if (!task) {
        throw new Error('Task not found');
      }
      
      setTask(task);

      if (!task.form_id) {
        // Fallback for standard tasks without an associated evaluation form
        const mockForm: FormSchema = {
          _id: 'standard_assignment',
          title: task.title || 'Assignment Submission',
          description: task.description || 'Please submit your response/solution below.',
          questions: [
            {
              _id: 'submission_text',
              id: 'submission_text',
              label: 'Your Answer / Solution (Text)',
              type: 'long_text',
              required: false,
            }
          ]
        };
        setForm(mockForm);
        setAnswers({ submission_text: '' });
        return;
      }

      // 2. Get form schema by form_id
      const formId = typeof task.form_id === 'object' ? (task.form_id._id || task.form_id.id) : task.form_id;
      const formRes = await apiClient.get(`/v1/form/${formId}`);
      const formData = formRes.data?.data;

      if (!formData) {
        throw new Error('Form schema not found');
      }

      setForm(formData);

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
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      fetchFormSchema();
    }
  }, [taskId]);

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

  const handleSubmit = async () => {
    if (!form) return;

    // Validate required questions
    const unansweredRequired = form.questions.filter((q) => {
      const qId = q._id || q.id;
      const ans = answers[qId];
      if (!q.required) return false;
      if (q.type === 'checkbox') return !ans || ans.length === 0;
      return ans === undefined || ans === null || String(ans).trim() === '';
    });

    if (unansweredRequired.length > 0) {
      showAlert(
        'Required Fields',
        'Please answer all required questions before submitting.',
        'warning'
      );
      return;
    }

    // Custom check for standard assignment tasks: either text answers OR attachments must be provided
    if (form._id === 'standard_assignment' && !answers['submission_text']?.trim() && attachments.length === 0) {
      showAlert(
        'Empty Submission',
        'Please type a response or upload a file/image to submit your solution.',
        'warning'
      );
      return;
    }

    setSubmitting(true);
    try {
      // Serialize answers as content
      let finalContent = '';
      if (form._id === 'standard_assignment') {
        finalContent = answers['submission_text'] || '';
      } else {
        finalContent = JSON.stringify(answers);
      }

      const payload = {
        content: finalContent,
        attachments: attachments,
      };

      await apiClient.post(`/task-submissions/task/${taskId}`, payload);

      showAlert('Success', 'Your evaluation has been submitted successfully!', 'success', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate back and trigger refresh if possible
            router.replace('/(student)/(tabs)/StudentTasks');
          },
        },
      ]);
    } catch (err: any) {
      console.error('Failed to submit evaluation:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to submit evaluation. Please try again.';
      showAlert('Submission Error', msg, 'error');
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
        <Text style={styles.loadingText}>Fetching Form...</Text>
      </View>
    );
  }

  if (error || !form) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#090514', '#0c0a1a', '#02010a']}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <BlurView intensity={30} tint="dark" style={styles.backBlur}>
              <ArrowLeft size={20} color="#fff" />
            </BlurView>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
          <Text style={styles.errorTitle}>Failed to Load Form</Text>
          <Text style={styles.errorText}>
            Could not fetch the evaluation form schema from the server.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchFormSchema}>
            <Text style={styles.retryButtonText}>Retry Loading</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Background Gradients */}
      <LinearGradient colors={['#090514', '#0c0a1a', '#02010a']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
      <View style={[styles.glowOrb, { top: -150, right: -100, backgroundColor: 'rgba(99,102,241,0.45)' }]} />
      <View style={[styles.glowOrb, { bottom: 50, left: -150, backgroundColor: 'rgba(168,85,247,0.35)' }]} />
      <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />

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
        
        <View style={styles.activeFormHeader}>
          <Text style={styles.activeFormTitle}>{form?.title}</Text>
          
          {/* Task Details Section */}
          {task && (task.description || (task.attachments && task.attachments.length > 0)) && (
            <View style={{ marginTop: 24 }}>
              <BlurView intensity={30} tint="dark" style={{ padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                {task.description && (
                  <View style={{ marginBottom: (task.attachments && task.attachments.length > 0) ? 16 : 0 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Task Description</Text>
                    <Text style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 22 }}>{task.description}</Text>
                  </View>
                )}
                
                {task.attachments && task.attachments.length > 0 && (
                  <View>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Instructor Attachments</Text>
                    <View style={{ gap: 8 }}>
                      {task.attachments.map((att: any, idx: number) => (
                        <TouchableOpacity
                          key={idx}
                          activeOpacity={0.7}
                          onPress={() => {
                            if (att.url) {
                              Linking.openURL(getFullUrl(att.url)).catch(() => {
                                showAlert('Error', 'Could not open the attachment link.', 'error');
                              });
                            }
                          }}
                          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(99, 102, 241, 0.15)', justifyContent: 'center', alignItems: 'center' }}>
                              <FileText size={16} color="#818cf8" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }} numberOfLines={1}>
                                {att.fileName || `Attachment ${idx + 1}`}
                              </Text>
                              {att.size ? (
                                <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                                  {(att.size / 1024).toFixed(1)} KB
                                </Text>
                              ) : null}
                            </View>
                          </View>
                          <View style={{ padding: 6, borderRadius: 8, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                            <Download size={14} color="#e2e8f0" />
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </BlurView>
            </View>
          )}

          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {courseName || 'Evaluation Form'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Form Instructions / Description */}
        {form.description && (
          <Animatable.View animation="fadeIn" duration={600} style={styles.instructionsContainer}>
            <BlurView intensity={30} tint="dark" style={styles.instructionsBlur}>
              <Info size={16} color="#a5b4fc" style={{ marginRight: 10 }} />
              <Text style={styles.instructionsText}>{form.description}</Text>
            </BlurView>
          </Animatable.View>
        )}

        {/* Dynamic Questions Mapping */}
        {form.questions.map((q, index) => {
          const qId = q._id || q.id;
          const currentAnswer = answers[qId];

          return (
            <Animatable.View
              key={qId}
              animation="fadeInUp"
              duration={600}
              delay={index * 50}
              style={styles.questionCard}
            >
              <BlurView intensity={45} tint="dark" style={styles.questionBlur}>
                {/* Question Label */}
                <View style={styles.labelRow}>
                  <Text style={styles.questionLabel}>{q.label}</Text>
                  {q.required && <Text style={styles.requiredAsterisk}>*</Text>}
                </View>

                {/* Input Fields Mapping */}
                {/* 1. Short Text & Long Text */}
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

                {/* 2. Multiple Choice */}
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

                {/* 3. Checkbox */}
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

                {/* 4. Linear Scale / Ratings */}
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

        {/* Solution Attachments Card */}
        <Animatable.View animation="fadeInUp" duration={600} delay={150} style={styles.questionCard}>
          <BlurView intensity={45} tint="dark" style={styles.questionBlur}>
            <View style={styles.labelRow}>
              <Paperclip size={18} color="#a5b4fc" style={{ marginRight: 8 }} />
              <Text style={styles.questionLabel}>Attachments / Supporting Files</Text>
            </View>
            <Text style={styles.attachmentsSubtitle}>
              Upload images, code files, PDFs, or take a photo of your handwritten solution.
            </Text>

            {/* List of uploaded files */}
            {attachments.length > 0 && (
              <View style={styles.attachmentsList}>
                {attachments.map((file, index) => (
                  <View key={index} style={styles.attachmentItem}>
                    <View style={styles.attachmentLeft}>
                      <FileText size={20} color="#6366f1" />
                      <View style={styles.attachmentTextContainer}>
                        <Text style={styles.attachmentName} numberOfLines={1}>
                          {file.fileName || 'Attachment'}
                        </Text>
                        <Text style={styles.attachmentSize}>
                          {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Attached'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveAttachment(index)}
                      style={styles.removeButton}
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Upload buttons */}
            <TouchableOpacity
              onPress={handleSelectAttachmentType}
              disabled={uploading}
              style={styles.uploadTriggerButton}
              activeOpacity={0.8}
            >
              {uploading ? (
                <View style={styles.uploadingRow}>
                  <ActivityIndicator size="small" color="#6366f1" />
                  <Text style={styles.uploadingText}>Uploading file...</Text>
                </View>
              ) : (
                <View style={styles.uploadTriggerContent}>
                  <ImageIcon size={20} color="#6366f1" style={{ marginRight: 8 }} />
                  <Text style={styles.uploadTriggerText}>Attach Image or Document</Text>
                </View>
              )}
            </TouchableOpacity>
          </BlurView>
        </Animatable.View>

        {/* Submit Button */}
        <Animatable.View animation="fadeInUp" delay={200} style={styles.submitButtonContainer}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
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
      </ScrollView>
      <CustomAlert
        {...alertConfig}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  errorText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
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
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 3,
  },
  submitButton: {
    width: '100%',
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  attachmentsSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 16,
    fontWeight: '500',
  },
  attachmentsList: {
    gap: 10,
    marginBottom: 16,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  attachmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  attachmentTextContainer: {
    flex: 1,
  },
  attachmentName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  attachmentSize: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  removeButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  uploadTriggerButton: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.02)',
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  uploadingText: {
    color: '#6366f1',
    fontSize: 13,
    fontWeight: '700',
  },
  uploadTriggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadTriggerText: {
    color: '#6366f1',
    fontSize: 13,
    fontWeight: '800',
  },
});
