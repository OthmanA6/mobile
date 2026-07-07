import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { BarChart3, ClipboardList, ClipboardCheck, ClipboardX, TrendingUp, AlertCircle, FileText, CheckCircle2 } from 'lucide-react-native';
import apiClient from '../../../src/api/client';

interface AnalyticsSummary {
  totalTasks: number;
  submittedCount: number;
  notSubmittedCount: number;
  submissionRate: number;
}

interface StudentSubmissionStat {
  studentName: string;
  submittedCount: number;
}

interface SubmissionTableRow {
  submissionId: string;
  taskId: string;
  studentName: string;
  taskTitle: string;
  status: string;
  submissionDate: string | null;
  finalGrade: number | null;
}

interface TaskAnalyticsData {
  summary: AnalyticsSummary;
  charts: {
    submittedVsNotSubmitted: { name: string; value: number }[];
    submissionsPerStudent: StudentSubmissionStat[];
    submissionsOverTime: any[];
  };
  table: SubmissionTableRow[];
}

export default function TaskAnalytics() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<TaskAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setError(null);
      const response = await apiClient.get('/tasks/analytics');
      setData(response.data.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load task analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const renderStatusBadge = (status: string) => {
    let color = '#94a3b8';
    let bgColor = 'rgba(148, 163, 184, 0.15)';
    if (status === 'SUBMITTED') { color = '#818cf8'; bgColor = 'rgba(129, 140, 248, 0.15)'; }
    if (status === 'AI_GRADED') { color = '#c084fc'; bgColor = 'rgba(192, 132, 252, 0.15)'; }
    if (status === 'FINALIZED') { color = '#34d399'; bgColor = 'rgba(52, 211, 153, 0.15)'; }
    
    return (
      <View style={[styles.statusBadge, { backgroundColor: bgColor, borderColor: bgColor }]}>
        <Text style={[styles.statusText, { color }]}>{status.replace('_', ' ')}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#090514', '#0c0a1a', '#02010a']} style={StyleSheet.absoluteFill} />
        <View style={[styles.glowOrb, { top: '30%', left: '20%', backgroundColor: 'rgba(99, 102, 241, 0.2)' }]} />
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Crunching analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#090514', '#0c0a1a', '#02010a']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
      <View style={[styles.glowOrb, { top: -150, right: -100, backgroundColor: 'rgba(99,102,241,0.45)' }]} />
      <View style={[styles.glowOrb, { bottom: 50, left: -150, backgroundColor: 'rgba(168,85,247,0.35)' }]} />
      <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />

      <View style={[styles.mainWrapper, { paddingTop: Math.max(insets.top + 15, 35) }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Task Analytics</Text>
          <Text style={styles.subtitle}>Submission insights & performance</Text>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
        >
          {error && (
            <Animatable.View animation="fadeInDown" style={styles.errorContainer}>
              <BlurView intensity={40} tint="dark" style={styles.errorBlur}>
                <AlertCircle size={18} color="#f87171" style={{ marginRight: 10 }} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </BlurView>
            </Animatable.View>
          )}

          {data && (
            <>
              {/* Summary Metrics */}
              <View style={styles.metricsGrid}>
                <MetricCard 
                  title="Total Tasks" 
                  value={data.summary.totalTasks} 
                  icon={<ClipboardList size={20} color="#a5b4fc" />} 
                />
                <MetricCard 
                  title="Submission Rate" 
                  value={`${data.summary.submissionRate}%`} 
                  icon={<TrendingUp size={20} color="#c084fc" />} 
                  valueColor="#c084fc"
                />
                <MetricCard 
                  title="Submitted" 
                  value={data.summary.submittedCount} 
                  icon={<ClipboardCheck size={20} color="#34d399" />} 
                  valueColor="#34d399"
                />
                <MetricCard 
                  title="Not Submitted" 
                  value={data.summary.notSubmittedCount} 
                  icon={<ClipboardX size={20} color="#f87171" />} 
                  valueColor="#f87171"
                />
              </View>

              {/* Progress Bar Chart */}
              <Animatable.View animation="fadeInUp" duration={600} delay={100} style={styles.sectionCard}>
                <BlurView intensity={45} tint="dark" style={styles.cardBlur}>
                  <View style={styles.sectionHeader}>
                    <BarChart3 size={16} color="#818cf8" />
                    <Text style={styles.sectionTitle}>Submission Breakdown</Text>
                  </View>
                  
                  <View style={styles.progressContainer}>
                    <View style={styles.progressLabels}>
                      <Text style={styles.progressLabel}>Submitted: <Text style={{ color: '#818cf8' }}>{data.summary.submittedCount}</Text></Text>
                      <Text style={styles.progressLabel}>Missed: <Text style={{ color: '#f87171' }}>{data.summary.notSubmittedCount}</Text></Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View 
                        style={[
                          styles.progressBarFill, 
                          { width: `${data.summary.totalTasks > 0 ? (data.summary.submittedCount / data.summary.totalTasks) * 100 : 0}%` }
                        ]} 
                      />
                    </View>
                  </View>
                </BlurView>
              </Animatable.View>

              {/* Top Students by Submissions */}
              {data.charts.submissionsPerStudent.length > 0 && (
                <Animatable.View animation="fadeInUp" duration={600} delay={200} style={styles.sectionCard}>
                  <BlurView intensity={45} tint="dark" style={styles.cardBlur}>
                    <View style={styles.sectionHeader}>
                      <CheckCircle2 size={16} color="#34d399" />
                      <Text style={styles.sectionTitle}>Top Students by Submissions</Text>
                    </View>
                    
                    {data.charts.submissionsPerStudent.slice(0, 5).map((student, idx) => (
                      <View key={idx} style={styles.studentStatRow}>
                        <View style={styles.studentStatLeft}>
                          <View style={styles.studentRankBadge}>
                            <Text style={styles.studentRankText}>{idx + 1}</Text>
                          </View>
                          <Text style={styles.studentStatName} numberOfLines={1}>{student.studentName}</Text>
                        </View>
                        <Text style={styles.studentStatScore}>{student.submittedCount} Subs</Text>
                      </View>
                    ))}
                  </BlurView>
                </Animatable.View>
              )}

              {/* Recent Submissions Table equivalent */}
              <Animatable.View animation="fadeInUp" duration={600} delay={300} style={styles.sectionCard}>
                <BlurView intensity={45} tint="dark" style={styles.cardBlur}>
                  <View style={[styles.sectionHeader, { marginBottom: 16 }]}>
                    <FileText size={16} color="#c084fc" />
                    <Text style={styles.sectionTitle}>Recent Submissions Log</Text>
                  </View>
                  
                  {data.table.length > 0 ? (
                    data.table.slice(0, 10).map((row, idx) => (
                      <View key={idx} style={styles.submissionRow}>
                        <View style={styles.submissionInfo}>
                          <Text style={styles.submissionStudent} numberOfLines={1}>{row.studentName}</Text>
                          <Text style={styles.submissionTask} numberOfLines={1}>{row.taskTitle}</Text>
                          <View style={styles.submissionMeta}>
                            {renderStatusBadge(row.status)}
                            {row.finalGrade !== null && (
                              <Text style={styles.submissionGrade}>Grade: {row.finalGrade}</Text>
                            )}
                          </View>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyTable}>
                      <Text style={styles.emptyTableText}>No submissions recorded yet.</Text>
                    </View>
                  )}
                </BlurView>
              </Animatable.View>
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

function MetricCard({ title, value, icon, valueColor }: { title: string; value: string | number; icon: React.ReactNode; valueColor?: string }) {
  return (
    <Animatable.View animation="fadeIn" duration={600} style={styles.metricCard}>
      <BlurView intensity={50} tint="dark" style={styles.metricBlurInner}>
        <View style={styles.metricIcon}>{icon}</View>
        <Text style={[styles.metricValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
        <Text style={styles.metricTitle}>{title}</Text>
      </BlurView>
    </Animatable.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#02010a' },
  glowOrb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.8 },
  loadingContainer: { flex: 1, backgroundColor: '#02010a', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94a3b8', fontSize: 12, fontWeight: '700', letterSpacing: 2, marginTop: 16, textTransform: 'uppercase' },
  mainWrapper: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingBottom: 120 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4, fontWeight: '500' },
  
  errorContainer: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)', marginBottom: 20 },
  errorBlur: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: 'rgba(239, 68, 68, 0.08)' },
  errorBannerText: { color: '#fca5a5', fontSize: 13, fontWeight: '600' },
  
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  metricCard: { width: '48%', height: 110, borderRadius: 20, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  metricBlurInner: { flex: 1, padding: 16, justifyContent: 'center' },
  metricIcon: { marginBottom: 8 },
  metricValue: { fontSize: 26, fontWeight: '800', color: '#fff' },
  metricTitle: { fontSize: 11, color: '#94a3b8', marginTop: 2, fontWeight: '600' },
  
  sectionCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', marginBottom: 24 },
  cardBlur: { padding: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: 1 },
  
  progressContainer: { marginTop: 4 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  progressLabel: { fontSize: 13, color: '#94a3b8', fontWeight: '700' },
  progressBarBg: { height: 10, borderRadius: 5, backgroundColor: 'rgba(248, 113, 113, 0.5)', width: '100%', overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 5, backgroundColor: '#818cf8' },
  
  studentStatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  studentStatLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 16 },
  studentRankBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(52, 211, 153, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  studentRankText: { fontSize: 11, fontWeight: '900', color: '#34d399' },
  studentStatName: { fontSize: 15, fontWeight: '700', color: '#fff', flex: 1 },
  studentStatScore: { fontSize: 14, fontWeight: '800', color: '#a5b4fc' },
  
  submissionRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  submissionInfo: { gap: 6 },
  submissionStudent: { fontSize: 15, fontWeight: '700', color: '#fff' },
  submissionTask: { fontSize: 13, color: '#94a3b8' },
  submissionMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  submissionGrade: { fontSize: 12, fontWeight: '800', color: '#34d399' },
  
  emptyTable: { paddingVertical: 24, alignItems: 'center' },
  emptyTableText: { fontSize: 14, color: '#64748b', fontStyle: 'italic' },
});
