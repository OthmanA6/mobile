import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Zap, CheckCircle, BarChart3, AlertTriangle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import apiClient from '../../../src/api/client';

interface QuotaData {
  totalTokensUsed: number;
  maxTokens: number;
  remainingTokens: number;
}

export default function AIQuota() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<QuotaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuota = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/ai/token-usage');
      setData(response.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch AI quota details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuota();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#090514', '#0c0a1a', '#02010a']}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.glowOrb, { top: '30%', left: '20%', backgroundColor: 'rgba(99, 102, 241, 0.2)' }]} />
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Syncing Quota...</Text>
      </View>
    );
  }

  // Fallback defaults if limit is not set on the user document in database
  const limit = data?.maxTokens || 100000;
  const used = data?.totalTokensUsed || 0;
  const remaining = data?.remainingTokens || (limit - used);
  const percentage = Math.min(Math.round((used / limit) * 100), 100);

  return (
    <View style={styles.container}>
      {/* Dark Premium Gradient Background */}
      <LinearGradient
        colors={['#090514', '#0c0a1a', '#02010a']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient background glows */}
      <View style={[styles.glowOrb, { top: -100, right: -100, backgroundColor: 'rgba(99, 102, 241, 0.15)' }]} />
      <View style={[styles.glowOrb, { bottom: 100, left: -150, backgroundColor: 'rgba(168, 85, 247, 0.1)' }]} />

      <View style={[styles.mainWrapper, { paddingTop: Math.max(insets.top + 15, 35) }]}>
        {/* Header */}
        <View style={styles.headerTop}>
          <Text style={styles.title}>AI Quota</Text>
          <Text style={styles.subtitle}>Monitor your AI token usage for grading and generation.</Text>
        </View>

        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 140 }]} showsVerticalScrollIndicator={false}>
          {error && (
            <Animatable.View animation="fadeInDown" style={styles.errorContainer}>
              <BlurView intensity={40} tint="dark" style={styles.errorBlur}>
                <View style={styles.errorLeft}>
                  <AlertTriangle size={18} color="#f87171" style={styles.errorIcon} />
                  <Text style={styles.errorBannerText}>{error}</Text>
                </View>
                <TouchableOpacity style={styles.retryBannerButton} onPress={fetchQuota}>
                  <Text style={styles.retryBannerText}>Retry</Text>
                </TouchableOpacity>
              </BlurView>
            </Animatable.View>
          )}

        {/* Progress Ring / Visual Indicator */}
        <Animatable.View animation="fadeInUp" duration={600} style={styles.quotaHeader}>
          <BlurView intensity={45} tint="dark" style={styles.progressBlurInner}>
            <View style={styles.progressRow}>
              <Zap size={36} color="#6366f1" />
              <View style={styles.percentageInfo}>
                <Text style={styles.percentageText}>{percentage}%</Text>
                <Text style={styles.percentageSubtitle}>Of Monthly AI Quota Used</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
            </View>

            <View style={styles.usageLabels}>
              <Text style={styles.usageLabelText}>{used.toLocaleString()} Tokens Used</Text>
              <Text style={styles.usageLabelText}>{remaining.toLocaleString()} Left</Text>
            </View>
          </BlurView>
        </Animatable.View>

        {/* Detailed Cards */}
        <Animatable.Text animation="fadeIn" duration={600} delay={100} style={styles.sectionTitle}>Quota Breakdown</Animatable.Text>
        <Animatable.View animation="fadeInUp" duration={600} delay={100} style={styles.breakdownGrid}>
          <View style={styles.breakdownCard}>
            <BlurView intensity={45} tint="dark" style={styles.breakdownBlur}>
              <Text style={styles.breakdownValue}>{used.toLocaleString()}</Text>
              <Text style={styles.breakdownLabel}>Used</Text>
            </BlurView>
          </View>
          <View style={styles.breakdownCard}>
            <BlurView intensity={45} tint="dark" style={styles.breakdownBlur}>
              <Text style={styles.breakdownValue}>{remaining.toLocaleString()}</Text>
              <Text style={styles.breakdownLabel}>Remaining</Text>
            </BlurView>
          </View>
        </Animatable.View>

        {/* Active AI Modules Status */}
        <Animatable.Text animation="fadeIn" duration={600} delay={200} style={styles.sectionTitle}>AI Features Enabled</Animatable.Text>
        <Animatable.View animation="fadeInUp" duration={600} delay={200} style={styles.featureList}>
          <View style={styles.featureItem}>
            <BlurView intensity={30} tint="dark" style={styles.featureBlur}>
              <CheckCircle size={20} color="#6366f1" style={styles.featureIcon} />
              <View>
                <Text style={styles.featureName}>Automated Homework Grading</Text>
                <Text style={styles.featureDesc}>Extracts student answers, matches rubrics and evaluates logic.</Text>
              </View>
            </BlurView>
          </View>

          <View style={styles.featureItem}>
            <BlurView intensity={30} tint="dark" style={styles.featureBlur}>
              <CheckCircle size={20} color="#6366f1" style={styles.featureIcon} />
              <View>
                <Text style={styles.featureName}>Smart Quiz Generation</Text>
                <Text style={styles.featureDesc}>Generates questions matching standard department formats.</Text>
              </View>
            </BlurView>
          </View>

          <View style={styles.featureItem}>
            <BlurView intensity={30} tint="dark" style={styles.featureBlur}>
              <CheckCircle size={20} color="#6366f1" style={styles.featureIcon} />
              <View>
                <Text style={styles.featureName}>Student Synthesis Analysis</Text>
                <Text style={styles.featureDesc}>Aggregates class submissions and builds weakpoint guides.</Text>
              </View>
            </BlurView>
          </View>
        </Animatable.View>

        {/* Refresh Button */}
        <Animatable.View animation="fadeInUp" duration={600} delay={300}>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchQuota}>
            <LinearGradient
              colors={['#6366f1', '#4f46e5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <BarChart3 size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.refreshText}>Sync Usage Data</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>
        </ScrollView>
      </View>
    </View>
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
    paddingBottom: 28,
  },
  headerTop: {
    marginBottom: 20,
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
    lineHeight: 20,
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
  errorBannerText: {
    color: '#fca5a5',
    fontSize: 13,
    fontWeight: '600',
  },
  retryBannerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  retryBannerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  quotaHeader: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 24,
  },
  progressBlurInner: {
    padding: 24,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  percentageInfo: {
    marginLeft: 16,
  },
  percentageText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
  },
  percentageSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 2,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#6366f1',
  },
  usageLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  usageLabelText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    marginTop: 8,
  },
  breakdownGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  breakdownCard: {
    width: '48%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  breakdownBlur: {
    padding: 20,
    alignItems: 'center',
  },
  breakdownValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 6,
  },
  featureList: {
    marginBottom: 24,
  },
  featureItem: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  featureBlur: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    marginRight: 16,
  },
  featureName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  featureDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    lineHeight: 16,
    paddingRight: 32,
  },
  refreshButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    paddingHorizontal: 24,
  },
  refreshText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});
