import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Zap, ShieldAlert, CheckCircle, BarChart3, HelpCircle } from 'lucide-react-native';
import apiClient from '../../src/api/client';

interface QuotaData {
  totalTokensUsed: number;
  maxTokens: number;
  remainingTokens: number;
}

export default function AIQuota() {
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
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#F59E0B" />
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {error && (
          <View style={styles.errorBanner}>
            <ShieldAlert size={20} color="#ef4444" style={{ marginRight: 10 }} />
            <Text style={styles.errorText} numberOfLines={1}>{error}</Text>
          </View>
        )}

        {/* Progress Ring / Visual Indicator */}
        <View style={styles.quotaHeader}>
          <BlurView intensity={20} tint="dark" style={styles.progressBlurInner}>
            <View style={styles.progressRow}>
              <Zap size={36} color="#F59E0B" />
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
        </View>

        {/* Detailed Cards */}
        <Text style={styles.sectionTitle}>Quota Breakdown</Text>
        <View style={styles.breakdownGrid}>
          <View style={styles.breakdownCard}>
            <BlurView intensity={20} tint="dark" style={styles.breakdownBlur}>
              <Text style={styles.breakdownValue}>{used.toLocaleString()}</Text>
              <Text style={styles.breakdownLabel}>Used</Text>
            </BlurView>
          </View>
          <View style={styles.breakdownCard}>
            <BlurView intensity={20} tint="dark" style={styles.breakdownBlur}>
              <Text style={styles.breakdownValue}>{remaining.toLocaleString()}</Text>
              <Text style={styles.breakdownLabel}>Remaining</Text>
            </BlurView>
          </View>
        </View>

        {/* Active AI Modules Status */}
        <Text style={styles.sectionTitle}>AI Features Enabled</Text>
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <BlurView intensity={10} tint="dark" style={styles.featureBlur}>
              <CheckCircle size={20} color="#F59E0B" style={styles.featureIcon} />
              <View>
                <Text style={styles.featureName}>Automated Homework Grading</Text>
                <Text style={styles.featureDesc}>Extracts student answers, matches rubrics and evaluates logic.</Text>
              </View>
            </BlurView>
          </View>

          <View style={styles.featureItem}>
            <BlurView intensity={10} tint="dark" style={styles.featureBlur}>
              <CheckCircle size={20} color="#F59E0B" style={styles.featureIcon} />
              <View>
                <Text style={styles.featureName}>Smart Quiz Generation</Text>
                <Text style={styles.featureDesc}>Generates questions matching standard department formats.</Text>
              </View>
            </BlurView>
          </View>

          <View style={styles.featureItem}>
            <BlurView intensity={10} tint="dark" style={styles.featureBlur}>
              <CheckCircle size={20} color="#F59E0B" style={styles.featureIcon} />
              <View>
                <Text style={styles.featureName}>Student Synthesis Analysis</Text>
                <Text style={styles.featureDesc}>Aggregates class submissions and builds weakpoint guides.</Text>
              </View>
            </BlurView>
          </View>
        </View>

        {/* Refresh Button */}
        <TouchableOpacity style={styles.refreshButton} onPress={fetchQuota}>
          <BarChart3 size={20} color="#0B1120" style={{ marginRight: 8 }} />
          <Text style={styles.refreshText}>Sync Usage Data</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 110,
    paddingHorizontal: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  quotaHeader: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
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
    backgroundColor: '#F59E0B',
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
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
    borderColor: 'rgba(255, 255, 255, 0.03)',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    height: 52,
    borderRadius: 16,
    marginTop: 8,
  },
  refreshText: {
    color: '#0B1120',
    fontWeight: '800',
    fontSize: 16,
  },
});
