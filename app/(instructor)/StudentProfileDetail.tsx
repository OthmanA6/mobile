import { useTheme } from '../../src/context/ThemeContext';
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  User,
  Mail,
  Briefcase,
  Calendar,
  BookOpen,
  Award,
  Target,
  BrainCircuit,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '../../src/api/client';
import RadialGlowOrb from '../../src/components/RadialGlowOrb';

type Tab = 'overview' | 'mastery' | 'history';

interface ProfileAnalyticsResponse {
  user: { firstName: string; lastName: string; email: string; role: string; };
  profile?: { 
    academicYear?: number; 
    departmentId?: { name: string } | string; 
  };
  aggregated_metrics: {
    total_submissions: number;
    average_suggested_grade: number;
    average_confidence_score: number;
    concept_mastery: { concept: string; average_mastery: number }[];
  };
  task_history: {
    _id: string;
    task_id: { _id: string; title: string; task_type: string };
    status: string;
    final_grade?: number;
    ai_suggested_grade?: number;
    updatedAt: string;
  }[];
  ai_synthesis?: {
    overall_summary: string;
    core_strengths: string[];
    persistent_weaknesses: string[];
    action_plan: string[];
  };
}

export default function StudentProfileDetail() {
  const { themeMode } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { studentId } = useLocalSearchParams<{ studentId: string }>();

  const [data, setData] = useState<ProfileAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const fetchData = async () => {
    if (!studentId) return;
    try {
      setError(null);
      const response = await apiClient.get(`/users/${studentId}/profile-analytics`);
      setData(response.data.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load profile analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [studentId]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchData(); }, [studentId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        {themeMode === 'dark' ? <LinearGradient colors={['#090514', '#0c0a1a', '#02010a']} style={StyleSheet.absoluteFill} /> : null}
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Generating Profile Data...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.loadingContainer}>
        {themeMode === 'dark' ? <LinearGradient colors={['#090514', '#0c0a1a', '#02010a']} style={StyleSheet.absoluteFill} /> : null}
        <AlertTriangle size={32} color="#f87171" style={{ marginBottom: 16 }} />
        <Text style={[styles.loadingText, { color: '#f87171' }]}>{error || 'Failed to load profile data'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { user, profile, aggregated_metrics, task_history, ai_synthesis } = data;
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  const departmentName = (profile?.departmentId && typeof profile.departmentId === 'object') 
    ? profile.departmentId.name 
    : 'Unknown Department';

  const getGradeColor = (grade: number) => {
    if (grade >= 85) return '#10b981'; // emerald
    if (grade >= 70) return '#3b82f6'; // blue
    if (grade >= 50) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return '#10b981';
    if (score >= 0.5) return '#eab308';
    return '#ef4444';
  };

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return dateStr; }
  };

  return (
    <View style={styles.container}>
      {themeMode === 'dark' ? <LinearGradient colors={['#090514', '#0c0a1a', '#02010a']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} /> : null}
      {themeMode === 'dark' ? <RadialGlowOrb color="rgba(99,102,241,0.6)" size={500} style={{ top: -150, right: -150 }} /> : null}
      {themeMode === 'dark' ? <RadialGlowOrb color="rgba(168,85,247,0.5)" size={500} style={{ bottom: -50, left: -200 }} /> : null}
      {themeMode === 'dark' ? <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} /> : null}

      {/* Header Bar */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top + 10, 30) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <BlurView intensity={30} tint="dark" style={styles.backBlur}>
            <ArrowLeft size={20} color="#fff" />
          </BlurView>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{user.firstName} {user.lastName}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" colors={['#6366f1']} />}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
      >
        {/* Profile Identity Card */}
        <Animatable.View animation="fadeInDown" duration={500}>
          <BlurView intensity={40} tint="dark" style={styles.profileCard}>
            <View style={styles.profileTopRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Text style={styles.profileName}>{user.firstName} {user.lastName}</Text>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>ACTIVE</Text>
                  </View>
                </View>
                <View style={styles.metaWrap}>
                  <View style={styles.metaBadge}><Mail size={12} color="#818cf8" /><Text style={styles.metaBadgeText}>{user.email}</Text></View>
                  <View style={styles.metaBadge}><User size={12} color="#818cf8" /><Text style={styles.metaBadgeText}>{user.role}</Text></View>
                  {profile?.departmentId && <View style={styles.metaBadge}><Briefcase size={12} color="#818cf8" /><Text style={styles.metaBadgeText}>{departmentName}</Text></View>}
                  {profile?.academicYear && <View style={styles.metaBadge}><Calendar size={12} color="#818cf8" /><Text style={styles.metaBadgeText}>Year {profile.academicYear}</Text></View>}
                </View>
              </View>
            </View>
          </BlurView>
        </Animatable.View>

        {/* Metrics Row */}
        <Animatable.View animation="fadeInUp" duration={500} delay={100} style={styles.metricsRow}>
          <BlurView intensity={40} tint="dark" style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>Submissions</Text>
              <View style={styles.metricIconBg}><BookOpen size={14} color="#818cf8" /></View>
            </View>
            <Text style={styles.metricValue}>{aggregated_metrics.total_submissions}</Text>
          </BlurView>

          <BlurView intensity={40} tint="dark" style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>Avg AI Grade</Text>
              <View style={styles.metricIconBg}><Award size={14} color="#818cf8" /></View>
            </View>
            <Text style={[styles.metricValue, { color: getGradeColor(aggregated_metrics.average_suggested_grade) }]}>
              {aggregated_metrics.average_suggested_grade.toFixed(1)} <Text style={styles.metricValueSuffix}>/ 100</Text>
            </Text>
          </BlurView>

          <BlurView intensity={40} tint="dark" style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>AI Confidence</Text>
              <View style={styles.metricIconBg}><Target size={14} color="#818cf8" /></View>
            </View>
            <Text style={[styles.metricValue, { color: getConfidenceColor(aggregated_metrics.average_confidence_score) }]}>
              {(aggregated_metrics.average_confidence_score * 100).toFixed(1)}%
            </Text>
          </BlurView>
        </Animatable.View>

        {/* Segmented Control */}
        <View style={styles.tabBar}>
          {(['overview', 'mastery', 'history'] as Tab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── OVERVIEW TAB (AI Synthesis) ────────────────────────────── */}
        {activeTab === 'overview' && (
          <Animatable.View animation="fadeIn" duration={400} style={styles.tabContent}>
            {ai_synthesis ? (
              <View style={{ gap: 16 }}>
                <BlurView intensity={30} tint="dark" style={styles.synthesisCard}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionIconBg}><BrainCircuit size={16} color="#818cf8" /></View>
                    <View>
                      <Text style={styles.sectionTitle}>Senior Academic Advisor Synthesis</Text>
                      <Text style={styles.sectionSubtitle}>Automated Profile Analysis</Text>
                    </View>
                  </View>
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryText}>{ai_synthesis.overall_summary}</Text>
                  </View>
                </BlurView>

                {/* Strengths */}
                <BlurView intensity={30} tint="dark" style={[styles.synthesisCard, { borderColor: 'rgba(16,185,129,0.2)' }]}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionIconBg, { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)' }]}>
                      <TrendingUp size={16} color="#34d399" />
                    </View>
                    <Text style={[styles.sectionTitle, { color: '#34d399' }]}>Core Strengths</Text>
                  </View>
                  <View style={{ gap: 8 }}>
                    {ai_synthesis.core_strengths.length > 0 ? (
                      ai_synthesis.core_strengths.map((s, i) => (
                        <View key={i} style={styles.listItem}>
                          <Text style={[styles.listNum, { color: '#34d399', backgroundColor: 'rgba(16,185,129,0.1)' }]}>{String(i + 1).padStart(2, '0')}</Text>
                          <Text style={styles.listText}>{s}</Text>
                        </View>
                      ))
                    ) : <Text style={styles.emptyListText}>No specific strengths identified.</Text>}
                  </View>
                </BlurView>

                {/* Weaknesses */}
                <BlurView intensity={30} tint="dark" style={[styles.synthesisCard, { borderColor: 'rgba(239,68,68,0.2)' }]}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionIconBg, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' }]}>
                      <AlertTriangle size={16} color="#f87171" />
                    </View>
                    <Text style={[styles.sectionTitle, { color: '#f87171' }]}>Persistent Weaknesses</Text>
                  </View>
                  <View style={{ gap: 8 }}>
                    {ai_synthesis.persistent_weaknesses.length > 0 ? (
                      ai_synthesis.persistent_weaknesses.map((w, i) => (
                        <View key={i} style={styles.listItem}>
                          <Text style={[styles.listNum, { color: '#f87171', backgroundColor: 'rgba(239,68,68,0.1)' }]}>{String(i + 1).padStart(2, '0')}</Text>
                          <Text style={styles.listText}>{w}</Text>
                        </View>
                      ))
                    ) : <Text style={styles.emptyListText}>No persistent weaknesses identified.</Text>}
                  </View>
                </BlurView>

                {/* Action Plan */}
                <BlurView intensity={30} tint="dark" style={[styles.synthesisCard, { borderColor: 'rgba(99,102,241,0.2)' }]}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionIconBg, { backgroundColor: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.2)' }]}>
                      <Target size={16} color="#818cf8" />
                    </View>
                    <Text style={[styles.sectionTitle, { color: '#818cf8' }]}>Action Plan</Text>
                  </View>
                  <View style={{ gap: 8 }}>
                    {ai_synthesis.action_plan.length > 0 ? (
                      ai_synthesis.action_plan.map((a, i) => (
                        <View key={i} style={styles.listItem}>
                          <Text style={[styles.listNum, { color: '#818cf8', backgroundColor: 'rgba(99,102,241,0.1)' }]}>{String(i + 1).padStart(2, '0')}</Text>
                          <Text style={styles.listText}>{a}</Text>
                        </View>
                      ))
                    ) : <Text style={styles.emptyListText}>No action plan available.</Text>}
                  </View>
                </BlurView>
              </View>
            ) : (
              <BlurView intensity={20} tint="dark" style={styles.emptyCard}>
                <Lightbulb size={32} color="#6366f1" style={{ marginBottom: 12, opacity: 0.5 }} />
                <Text style={styles.emptyTitle}>No AI Synthesis</Text>
                <Text style={styles.emptyText}>Complete more tasks to generate an advisor profile.</Text>
              </BlurView>
            )}
          </Animatable.View>
        )}

        {/* ── MASTERY TAB ────────────────────────────────────────────── */}
        {activeTab === 'mastery' && (
          <Animatable.View animation="fadeIn" duration={400} style={styles.tabContent}>
            <BlurView intensity={30} tint="dark" style={styles.synthesisCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconBg}><Target size={16} color="#818cf8" /></View>
                <View>
                  <Text style={styles.sectionTitle}>Concept Mastery</Text>
                  <Text style={styles.sectionSubtitle}>AI evaluated mastery levels</Text>
                </View>
              </View>
              
              {aggregated_metrics.concept_mastery.length > 0 ? (
                <View style={{ gap: 16 }}>
                  {aggregated_metrics.concept_mastery.map((c, i) => {
                    const pct = Math.round(c.average_mastery * 100);
                    return (
                      <View key={i} style={styles.progressRow}>
                        <View style={styles.progressHeader}>
                          <Text style={styles.progressLabel}>{c.concept}</Text>
                          <Text style={styles.progressValue}>{pct}%</Text>
                        </View>
                        <View style={styles.progressBarBg}>
                          <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.emptyListText}>No concept mastery data available yet.</Text>
              )}
            </BlurView>
          </Animatable.View>
        )}

        {/* ── HISTORY TAB ────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <Animatable.View animation="fadeIn" duration={400} style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBg}><BookOpen size={16} color="#818cf8" /></View>
              <View>
                <Text style={[styles.sectionTitle, { color: '#fff' }]}>Submission History</Text>
                <Text style={styles.sectionSubtitle}>Recent assignments and evaluations</Text>
              </View>
            </View>

            {task_history.length > 0 ? (
              <View style={{ gap: 12, marginTop: 12 }}>
                {task_history.map((item, i) => (
                  <BlurView key={item._id} intensity={40} tint="dark" style={styles.historyCard}>
                    <View style={styles.historyTopRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.historyTaskTitle}>{item.task_id?.title || 'Unknown Task'}</Text>
                        <Text style={styles.historyTaskType}>{item.task_id?.task_type || 'Unknown Type'} • {formatDate(item.updatedAt)}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: item.status === 'FINALIZED' ? 'rgba(16,185,129,0.1)' : 'rgba(251,191,36,0.1)' }]}>
                        <Text style={[styles.statusBadgeText, { color: item.status === 'FINALIZED' ? '#34d399' : '#fbbf24' }]}>
                          {item.status.replace('_', ' ')}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.historyGradeRow}>
                      <View style={styles.historyGradeCol}>
                        <Text style={styles.historyGradeLabel}>AI Grade</Text>
                        <Text style={styles.historyGradeAi}>{item.ai_suggested_grade ?? '-'}</Text>
                      </View>
                      <View style={styles.historyGradeCol}>
                        <Text style={styles.historyGradeLabel}>Final Grade</Text>
                        <Text style={styles.historyGradeFinal}>{item.final_grade ?? '-'}</Text>
                      </View>
                    </View>
                  </BlurView>
                ))}
              </View>
            ) : (
              <BlurView intensity={20} tint="dark" style={styles.emptyCard}>
                <BookOpen size={32} color="#6366f1" style={{ marginBottom: 12, opacity: 0.5 }} />
                <Text style={styles.emptyTitle}>No Task History</Text>
                <Text style={styles.emptyText}>No task history found for this student.</Text>
              </BlurView>
            )}
          </Animatable.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  glowOrb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.8 },
  loadingContainer: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94a3b8', fontSize: 12, fontWeight: '700', letterSpacing: 2, marginTop: 16, textTransform: 'uppercase' },
  retryBtn: { marginTop: 20, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8 },
  retryBtnText: { color: '#fff', fontWeight: 'bold' },
  
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginRight: 12 },
  backBlur: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.3, flex: 1 },

  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },

  // Profile Card
  profileCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 18, marginBottom: 16 },
  profileTopRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 70, height: 70, borderRadius: 24, backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 24, fontWeight: '900', color: '#818cf8' },
  profileName: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  activeBadge: { backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' },
  activeBadgeText: { fontSize: 9, fontWeight: '800', color: '#34d399', letterSpacing: 1 },
  metaWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  metaBadgeText: { fontSize: 10, fontWeight: '600', color: '#e2e8f0' },

  // Metrics Row
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 8 },
  metricCard: { flex: 1, padding: 14, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  metricTitle: { fontSize: 10, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  metricIconBg: { padding: 4, backgroundColor: 'rgba(99,102,241,0.1)', borderRadius: 8 },
  metricValue: { fontSize: 20, fontWeight: '900', color: '#fff' },
  metricValueSuffix: { fontSize: 12, fontWeight: '700', color: '#64748b' },

  // Tabs
  tabBar: { flexDirection: 'row', backgroundColor: 'rgba(99,102,241,0.07)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 4, marginBottom: 20 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 14, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#4f46e5' },
  tabBtnText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  tabBtnTextActive: { color: '#fff' },
  tabContent: { flex: 1 },

  // Synthesis Cards
  synthesisCard: { padding: 18, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionIconBg: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(99,102,241,0.1)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)', justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#fff' },
  sectionSubtitle: { fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  
  summaryBox: { padding: 14, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  summaryText: { fontSize: 13, color: '#e2e8f0', lineHeight: 20, fontWeight: '500' },

  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 12, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  listNum: { width: 24, height: 24, borderRadius: 8, textAlign: 'center', textAlignVertical: 'center', fontSize: 10, fontWeight: '800' },
  listText: { flex: 1, fontSize: 12, color: '#e2e8f0', lineHeight: 18, marginTop: 2 },
  emptyListText: { fontSize: 12, color: '#64748b', fontStyle: 'italic', paddingLeft: 4 },

  emptyCard: { padding: 32, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 6 },
  emptyText: { fontSize: 13, color: '#94a3b8', textAlign: 'center' },

  // Mastery Progress Bars
  progressRow: { marginBottom: 4 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, fontWeight: '600', color: '#e2e8f0' },
  progressValue: { fontSize: 12, fontWeight: '800', color: '#818cf8' },
  progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#6366f1', borderRadius: 3 },

  // History Cards
  historyCard: { padding: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  historyTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  historyTaskTitle: { fontSize: 14, fontWeight: '800', color: '#fff', marginBottom: 4 },
  historyTaskType: { fontSize: 11, fontWeight: '600', color: '#94a3b8' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statusBadgeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  historyGradeRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 },
  historyGradeCol: { flex: 1 },
  historyGradeLabel: { fontSize: 10, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: 4 },
  historyGradeAi: { fontSize: 16, fontWeight: '800', color: '#818cf8' },
  historyGradeFinal: { fontSize: 16, fontWeight: '900', color: '#34d399' },
});
