import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { BlurView } from 'expo-blur';
import { Search, Mail, GraduationCap, School, AlertTriangle, Users, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useRouter } from 'expo-router';
import apiClient from '../../../src/api/client';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profile: {
    id: string;
    data: {
      academicYear: number;
      departmentId?: {
        name: string;
        code: string;
      };
    };
  } | null;
}

export default function StudentDirectory() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = async () => {
    try {
      setError(null);
      const response = await apiClient.get('/admin/users');
      // Filter list to only show STUDENT roles (since listAdminUsers returns all users in instructor's context)
      const list = response.data.data.filter((u: any) => u.role === 'STUDENT');
      setStudents(list);
      setFilteredStudents(list);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load student directory');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStudents();
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setFilteredStudents(students);
      return;
    }
    const query = text.toLowerCase();
    const filtered = students.filter(
      (s) =>
        s.firstName.toLowerCase().includes(query) ||
        s.lastName.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query)
    );
    setFilteredStudents(filtered);
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
        <Text style={styles.loadingText}>Syncing Directory...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Dark Premium Gradient Background */}
      <LinearGradient colors={['#090514', '#0c0a1a', '#02010a']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
      <View style={[styles.glowOrb, { top: -150, right: -100, backgroundColor: 'rgba(99,102,241,0.45)' }]} />
      <View style={[styles.glowOrb, { bottom: 50, left: -150, backgroundColor: 'rgba(168,85,247,0.35)' }]} />
      <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />

      <View style={[styles.mainWrapper, { paddingTop: Math.max(insets.top + 15, 35) }]}>
        {/* Header */}
        <View style={styles.headerTop}>
          <Text style={styles.title}>Student Directory</Text>
          <Text style={styles.subtitle}>Browse and search all students enrolled in your courses.</Text>
        </View>

        {/* Search Header */}
        <View style={styles.searchHeader}>
          <BlurView intensity={30} tint="dark" style={styles.searchBlur}>
            <Search size={20} color="#94a3b8" style={styles.searchIcon} />
            <TextInput
              placeholder="Search students..."
              placeholderTextColor="#64748b"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </BlurView>
        </View>

        {error && (
          <Animatable.View animation="fadeInDown" style={styles.errorContainer}>
            <BlurView intensity={40} tint="dark" style={styles.errorBlur}>
              <View style={styles.errorLeft}>
                <AlertTriangle size={18} color="#f87171" style={styles.errorIcon} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
              <TouchableOpacity style={styles.retryBannerButton} onPress={fetchStudents}>
                <Text style={styles.retryBannerText}>Retry</Text>
              </TouchableOpacity>
            </BlurView>
          </Animatable.View>
        )}

        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item._id || item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 140 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
          renderItem={({ item, index }) => (
            <Animatable.View animation="fadeInUp" duration={600} delay={index * 50} style={styles.studentCard}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/(instructor)/StudentProfileDetail', params: { studentId: item.id || item._id } })}
              >
                <BlurView intensity={45} tint="dark" style={styles.blurInner}>
                  <View style={styles.avatarRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {item.firstName[0]}
                        {item.lastName[0]}
                      </Text>
                    </View>
                    <View style={styles.info}>
                      <Text style={styles.name}>
                        {item.firstName} {item.lastName}
                      </Text>
                      <View style={styles.emailRow}>
                        <Mail size={12} color="#94a3b8" style={{ marginRight: 6 }} />
                        <Text style={styles.email}>{item.email}</Text>
                      </View>
                    </View>
                    <ChevronRight size={18} color="#4f46e5" />
                  </View>

                  <View style={styles.metadataRow}>
                    <View style={styles.metaItem}>
                      <GraduationCap size={16} color="#a5b4fc" />
                      <Text style={styles.metaText}>
                        Year {item.profile?.data.academicYear || 1}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <School size={16} color="#a5b4fc" />
                      <Text style={styles.metaText} numberOfLines={1}>
                        {item.profile?.data.departmentId?.code || 'CS'}
                      </Text>
                    </View>
                  </View>
                </BlurView>
              </TouchableOpacity>
            </Animatable.View>
          )}
          ListEmptyComponent={
            <BlurView intensity={20} tint="dark" style={styles.emptyContainer}>
              <Users size={36} color="#4f46e5" style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>No Students Found</Text>
              <Text style={styles.emptyText}>No students match your criteria.</Text>
            </BlurView>
          }
        />
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
  searchHeader: {
    marginBottom: 20,
  },
  searchBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(15, 23, 42, 0.2)',
    overflow: 'hidden',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 28,
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
  studentCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  blurInner: {
    padding: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#a5b4fc',
    fontWeight: '700',
    fontSize: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  email: {
    fontSize: 13,
    color: '#94a3b8',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  metaText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyContainer: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 20,
  },
  emptyIcon: {
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
});
