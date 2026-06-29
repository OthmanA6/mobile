import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { Users, ClipboardCheck, BookOpen, TrendingUp, AlertCircle, Calendar } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import apiClient from '../../src/api/client';

interface DashboardData {
  metrics: {
    totalModules: number;
    totalStudents: number;
    avgPerformance: number;
    pendingReviews: number;
  };
  recentModules: {
    _id: string;
    courseCode: string;
    name: string;
    enrolledCount: number;
  }[];
  activeTasks: {
    _id: string;
    title: string;
    courseId: {
      courseCode: string;
    };
    deadline: string;
  }[];
}

export default function InstructorDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setError(null);
      const response = await apiClient.get('/instructor/dashboard');
      setData(response.data.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDashboard}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderMetricCard = (title: string, value: string | number, icon: React.ReactNode) => (
    <View style={styles.metricCard}>
      <BlurView intensity={20} tint="dark" style={styles.blurInner}>
        <View style={styles.metricIcon}>{icon}</View>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricTitle}>{title}</Text>
      </BlurView>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={[]} // Using FlatList just for the scroll structure with RefreshControl
        renderItem={null}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" />}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
          <>
            {/* Metrics 2x2 Grid */}
            <View style={styles.metricsGrid}>
              {renderMetricCard('Total Modules', data?.metrics.totalModules || 0, <BookOpen size={20} color="#F59E0B" />)}
              {renderMetricCard('Total Students', data?.metrics.totalStudents || 0, <Users size={20} color="#F59E0B" />)}
              {renderMetricCard('Avg Performance', `${data?.metrics.avgPerformance || 0}%`, <TrendingUp size={20} color="#F59E0B" />)}
              {renderMetricCard('Pending Reviews', data?.metrics.pendingReviews || 0, <ClipboardCheck size={20} color="#F59E0B" />)}
            </View>

            {/* Recent Modules */}
            <Text style={styles.sectionTitle}>Recent Modules</Text>
            {data?.recentModules && data.recentModules.length > 0 ? (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={data.recentModules}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => (
                  <View style={styles.moduleCard}>
                    <BlurView intensity={20} tint="dark" style={styles.moduleBlurInner}>
                      <Text style={styles.moduleCode}>{item.courseCode}</Text>
                      <Text style={styles.moduleName} numberOfLines={1}>{item.name}</Text>
                      <View style={styles.moduleFooter}>
                        <Users size={12} color="#94a3b8" />
                        <Text style={styles.moduleStudents}>{item.enrolledCount} Enrolled</Text>
                      </View>
                    </BlurView>
                  </View>
                )}
              />
            ) : (
              <Text style={styles.emptyText}>No recent modules found.</Text>
            )}

            {/* Active Tasks Feed */}
            <Text style={styles.sectionTitle}>Active Task Feed</Text>
            {data?.activeTasks && data.activeTasks.length > 0 ? (
              data.activeTasks.map((task) => (
                <View key={task._id} style={styles.taskCard}>
                  <BlurView intensity={20} tint="dark" style={styles.taskBlurInner}>
                    <View style={styles.taskInfo}>
                      <Text style={styles.taskCourse}>{task.courseId?.courseCode}</Text>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      <View style={styles.taskMeta}>
                        <Calendar size={14} color="#94a3b8" />
                        <Text style={styles.taskDeadline}>
                          {new Date(task.deadline).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.reviewButton}
                      onPress={() => router.push('/InstructorEvaluations')}
                    >
                      <Text style={styles.reviewButtonText}>Review</Text>
                    </TouchableOpacity>
                  </BlurView>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No active tasks right now.</Text>
            )}
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120', // Deep Navy
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 100, // For bottom tab spacing
    paddingHorizontal: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricCard: {
    width: '48%',
    height: 110,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)', // Amber hint
  },
  blurInner: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  metricIcon: {
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  metricTitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    marginTop: 8,
  },
  horizontalList: {
    paddingBottom: 8,
  },
  moduleCard: {
    width: 160,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  moduleBlurInner: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  moduleCode: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  moduleName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginTop: 4,
  },
  moduleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
  },
  moduleStudents: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 6,
  },
  taskCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  taskBlurInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },
  taskInfo: {
    flex: 1,
    marginRight: 16,
  },
  taskCourse: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '700',
  },
  taskTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskDeadline: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 6,
  },
  reviewButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  reviewButtonText: {
    color: '#F59E0B',
    fontWeight: '700',
    fontSize: 14,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 24,
  },
});
