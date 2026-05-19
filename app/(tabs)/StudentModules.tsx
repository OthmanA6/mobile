import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Search,
  User,
  ChevronRight,
  BookOpen,
  AlertTriangle,
} from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import { useRouter } from 'expo-router';
import { theme } from '../../src/theme/theme';
import apiClient from '../../src/api/client';

interface Course {
  id: string;
  _id?: string;
  name: string;
  courseCode: string;
  description?: string;
  instructorId?: string;
  instructor?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

export default function StudentModules() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // State
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchModules = async (showFullScreenLoading = true) => {
    if (showFullScreenLoading) {
      setLoading(true);
    }
    setError(false);
    try {
      const response = await apiClient.get('/courses');
      const coursesList = response.data?.data?.courses || [];
      setCourses(coursesList);
    } catch (err) {
      console.error('Failed to fetch modules:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules(true);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchModules(false);
    setRefreshing(false);
  };

  // Search Filter
  const filteredCourses = courses.filter((course) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = course.name?.toLowerCase().includes(term);
    const codeMatch = course.courseCode?.toLowerCase().includes(term);
    return nameMatch || codeMatch;
  });

  const handleCardPress = (course: Course) => {
    const instructorName = course.instructor
      ? `${course.instructor.firstName} ${course.instructor.lastName}`
      : 'Unassigned Instructor';

    router.push({
      pathname: '/ModuleDetailView',
      params: {
        moduleId: course.id || course._id,
        courseName: course.name,
        courseCode: course.courseCode,
        instructorName,
        description: course.description || '',
      },
    });
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
        <Text style={styles.loadingText}>Syncing Modules...</Text>
      </View>
    );
  }

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

      <View style={[styles.mainWrapper, { paddingTop: Math.max(insets.top, 24) }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Modules</Text>
          <Text style={styles.subtitle}>Track your enrolled courses and instructors</Text>
        </View>

        {/* Search Bar */}
        <BlurView intensity={30} tint="dark" style={styles.searchBarContainer}>
          <Search size={18} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            placeholder="Search by code or title..."
            placeholderTextColor="#94a3b8"
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={styles.searchInput}
            autoCapitalize="none"
          />
        </BlurView>

        {/* Error Banner */}
        {error && (
          <Animatable.View animation="fadeInDown" style={styles.errorContainer}>
            <BlurView intensity={40} tint="dark" style={styles.errorBlur}>
              <View style={styles.errorLeft}>
                <AlertTriangle size={18} color="#f87171" style={styles.errorIcon} />
                <Text style={styles.errorText}>Failed to sync modules.</Text>
              </View>
              <TouchableOpacity style={styles.retryButton} onPress={() => fetchModules(true)}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </BlurView>
          </Animatable.View>
        )}

        {/* Courses List */}
        <FlatList
          data={filteredCourses}
          keyExtractor={(item) => item.id || item._id || ''}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: insets.bottom + 140 }, // safe distance from bottom bar
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6366f1"
              colors={['#6366f1']}
            />
          }
          renderItem={({ item, index }) => {
            const instructorName = item.instructor
              ? `${item.instructor.firstName} ${item.instructor.lastName}`
              : 'Unassigned Instructor';

            return (
              <Animatable.View
                animation="fadeInUp"
                duration={600}
                delay={index * 50}
                style={styles.cardContainer}
              >
                <TouchableOpacity
                  onPress={() => handleCardPress(item)}
                  activeOpacity={0.85}
                >
                  <BlurView intensity={45} tint="dark" style={styles.cardBlur}>
                    <View style={styles.cardLeft}>
                      <View style={styles.codeBadge}>
                        <Text style={styles.codeBadgeText}>{item.courseCode}</Text>
                      </View>
                      <Text style={styles.courseName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <View style={styles.instructorRow}>
                        <User size={13} color="#94a3b8" />
                        <Text style={styles.instructorText} numberOfLines={1}>
                          {instructorName}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.cardRight}>
                      <View style={styles.detailsIconWrapper}>
                        <ChevronRight size={18} color="#fff" />
                      </View>
                    </View>
                  </BlurView>
                </TouchableOpacity>
              </Animatable.View>
            );
          }}
          ListEmptyComponent={
            !loading ? (
              <BlurView intensity={20} tint="dark" style={styles.emptyContainer}>
                <BookOpen size={36} color="#4f46e5" style={styles.emptyIcon} />
                <Text style={styles.emptyTitle}>No Modules Found</Text>
                <Text style={styles.emptyText}>
                  {searchTerm
                    ? 'No courses match your search criteria.'
                    : 'You are not currently enrolled in any academic modules.'}
                </Text>
              </BlurView>
            ) : null
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
  header: {
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
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.2)',
    overflow: 'hidden',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    height: '100%',
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
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  listContainer: {
    gap: 14,
  },
  cardContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  cardLeft: {
    flex: 1,
    marginRight: 12,
  },
  codeBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 0.5,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    marginBottom: 10,
  },
  codeBadgeText: {
    color: '#a5b4fc',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  courseName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
    lineHeight: 22,
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  instructorText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  cardRight: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
