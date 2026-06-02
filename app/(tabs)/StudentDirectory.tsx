import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { BlurView } from 'expo-blur';
import { Search, User, Mail, GraduationCap, School, AlertCircle } from 'lucide-react-native';
import apiClient from '../../src/api/client';

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
        <TouchableOpacity style={styles.retryButton} onPress={fetchStudents}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <BlurView intensity={20} tint="dark" style={styles.searchBlur}>
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

      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" />}
        renderItem={({ item }) => (
          <View style={styles.studentCard}>
            <BlurView intensity={20} tint="dark" style={styles.blurInner}>
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
              </View>

              <View style={styles.metadataRow}>
                <View style={styles.metaItem}>
                  <GraduationCap size={16} color="#F59E0B" />
                  <Text style={styles.metaText}>
                    Year {item.profile?.data.academicYear || 1}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <School size={16} color="#F59E0B" />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {item.profile?.data.departmentId?.code || 'CS'}
                  </Text>
                </View>
              </View>
            </BlurView>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No students found in your courses.</Text>
        }
      />
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
  searchHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
  },
  searchBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
    paddingTop: 10,
    paddingBottom: 110,
    paddingHorizontal: 20,
  },
  studentCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#F59E0B',
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
    textAlign: 'center',
    marginTop: 40,
  },
});
