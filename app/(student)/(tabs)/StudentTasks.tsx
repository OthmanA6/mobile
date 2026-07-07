import { useTheme } from '../../../src/context/ThemeContext';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import apiClient from '../../../src/api/client';
import RadialGlowOrb from '../../../src/components/RadialGlowOrb';

interface TaskSubmission {
  id: string;
  _id?: string;
  task_id: any;
  status: string;
  createdAt: string;
  content?: string;
  final_grade?: number;
  instructor_feedback?: string;
  attachments?: any[];
}

export default function StudentTasks() {
  const { themeMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSubmissions = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await apiClient.get('/task-submissions/my-submissions');
      setSubmissions(response.data?.data?.submissions || []);
    } catch (err) {
      console.error('Failed to fetch submissions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions(true);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSubmissions(false);
    setRefreshing(false);
  };

  const formatSubmittedDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        {themeMode === 'dark' ? <LinearGradient colors={['#090514', '#0c0a1a', '#02010a']} style={StyleSheet.absoluteFill} /> : null}
        <View style={[styles.glowOrb, { top: '30%', left: '20%', backgroundColor: 'rgba(16, 185, 129, 0.2)' }]} />
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Retrieving Evaluations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {themeMode === 'dark' ? <LinearGradient colors={['#090514', '#0c0a1a', '#02010a']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} /> : null}
      {themeMode === 'dark' ? <RadialGlowOrb color="rgba(99,102,241,0.6)" size={500} style={{ top: -150, right: -150 }} /> : null}
      {themeMode === 'dark' ? <RadialGlowOrb color="rgba(168,85,247,0.5)" size={500} style={{ bottom: -50, left: -200 }} /> : null}
      {themeMode === 'dark' ? <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} /> : null}

      <View style={[styles.mainWrapper, { paddingTop: Math.max(insets.top + 15, 35) }]}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <ClipboardCheck size={28} color="#10b981" />
            <Text style={styles.title}>My Evaluations</Text>
          </View>
          <Text style={styles.subtitle}>Historical record of your submissions and feedback</Text>
        </View>

        <FlatList
          data={submissions}
          keyExtractor={(item) => item.id || item._id || Math.random().toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 140 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" colors={['#10b981']} />}
          renderItem={({ item, index }) => {
            const task = typeof item.task_id === 'object' ? item.task_id : { title: 'Unknown Task' };
            const isUnderReview = item.status === 'SUBMITTED' || item.status === 'AI_GRADED';
            const isGraded = item.status === 'FINALIZED';

            return (
              <Animatable.View animation="fadeInUp" duration={600} delay={index * 50} style={styles.cardContainer}>
                <BlurView intensity={45} tint="dark" style={styles.cardBlur}>
                  
                  {/* Header Row */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Text style={styles.taskTitle}>{task.title || 'Assignment Submission'}</Text>
                      <View style={styles.dateRow}>
                        <Clock size={12} color="#94a3b8" />
                        <Text style={styles.dateText}>Submitted on {formatSubmittedDate(item.createdAt)}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Status Badges */}
                  <View style={styles.statusRow}>
                    {isUnderReview && (
                      <View style={[styles.statusBadge, styles.statusBadgeWarning]}>
                        <AlertCircle size={14} color="#f59e0b" />
                        <Text style={[styles.statusBadgeText, { color: '#f59e0b' }]}>Under Review</Text>
                      </View>
                    )}
                    {isGraded && (
                      <View style={[styles.statusBadge, styles.statusBadgeSuccess]}>
                        <CheckCircle2 size={14} color="#10b981" />
                        <Text style={[styles.statusBadgeText, { color: '#10b981' }]}>Graded</Text>
                      </View>
                    )}
                  </View>

                  {/* Submission Answers */}
                  {item.content ? (
                    <View style={styles.answersContainer}>
                      <Text style={styles.answersText}>{item.content}</Text>
                    </View>
                  ) : null}

                  {/* Instructor Feedback Section */}
                  {isGraded && (
                    <View style={styles.feedbackContainer}>
                      <View style={styles.feedbackBackground} />
                      <View style={styles.feedbackHeaderRow}>
                        <View style={styles.feedbackHeaderLeft}>
                          <CheckCircle2 size={14} color="#10b981" />
                          <Text style={styles.feedbackTitle}>Instructor Feedback</Text>
                        </View>
                        <View style={styles.gradeBadge}>
                          <Text style={styles.gradeText}>Final Grade: {item.final_grade}/100</Text>
                        </View>
                      </View>
                      
                      {item.instructor_feedback ? (
                        <View style={styles.feedbackContent}>
                          <Text style={styles.feedbackContentText}>"{item.instructor_feedback}"</Text>
                        </View>
                      ) : null}
                    </View>
                  )}

                </BlurView>
              </Animatable.View>
            );
          }}
          ListEmptyComponent={
            !loading ? (
              <BlurView intensity={20} tint="dark" style={styles.emptyContainer}>
                <FileText size={36} color="#94a3b8" style={{ marginBottom: 14, opacity: 0.5 }} />
                <Text style={styles.emptyText}>No submissions found. Start working on your active tasks!</Text>
              </BlurView>
            ) : null
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  glowOrb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.8 },
  loadingContainer: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94a3b8', fontSize: 12, fontWeight: '700', letterSpacing: 2, marginTop: 16, textTransform: 'uppercase' },
  mainWrapper: { flex: 1, paddingHorizontal: 20 },
  header: { marginBottom: 20 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  listContainer: { gap: 16 },
  
  cardContainer: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  cardBlur: { padding: 20 },
  cardHeader: { marginBottom: 12 },
  cardHeaderLeft: { flex: 1 },
  taskTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 6 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  
  statusRow: { flexDirection: 'row', marginBottom: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, gap: 6, borderWidth: 1 },
  statusBadgeWarning: { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)' },
  statusBadgeSuccess: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' },
  statusBadgeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  
  answersContainer: { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', marginBottom: 16 },
  answersText: { color: '#cbd5e1', fontSize: 13, lineHeight: 20 },

  feedbackContainer: { marginTop: 4, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)', padding: 16 },
  feedbackBackground: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(16, 185, 129, 0.05)' },
  feedbackHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  feedbackHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  feedbackTitle: { color: '#10b981', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  gradeBadge: { backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
  gradeText: { color: '#10b981', fontSize: 12, fontWeight: '800' },
  feedbackContent: { borderLeftWidth: 2, borderLeftColor: 'rgba(16, 185, 129, 0.5)', paddingLeft: 12 },
  feedbackContentText: { color: '#e2e8f0', fontSize: 13, fontStyle: 'italic', fontWeight: '500' },

  emptyContainer: { borderRadius: 24, padding: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', marginTop: 20 },
  emptyText: { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20, fontWeight: '500' },
});
