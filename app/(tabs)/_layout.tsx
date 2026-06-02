import React, { useEffect, useState } from 'react';
import { Tabs, router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Home, BookOpen, ClipboardList, User, FileText, LayoutDashboard, ClipboardCheck, Users, Zap } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TabLayout() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const storedRole = await AsyncStorage.getItem('userRole');
        setRole(storedRole || 'STUDENT');
      } catch (error) {
        setRole('STUDENT');
      } finally {
        setLoading(false);
      }
    };
    fetchRole();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const isStudent = role?.toUpperCase() === 'STUDENT';
  const isInstructor = role?.toUpperCase() === 'INSTRUCTOR';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: isInstructor, // Labels shown for instructor, hidden for student
        tabBarStyle: isInstructor ? styles.tabBarWithLabels : styles.tabBar,
        tabBarActiveTintColor: isInstructor ? '#F59E0B' : '#6366f1',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarItemStyle: isInstructor ? styles.tabBarItemWithLabel : styles.tabBarItem,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarBackground: () => (
          <View style={styles.blurContainer}>
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          </View>
        ),
      }}
    >
      {/* Student Screens */}
      <Tabs.Screen
        name="StudentDashboard"
        options={{
          href: isStudent ? undefined : null,
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="StudentModules"
        options={{
          href: isStudent ? undefined : null,
          tabBarIcon: ({ color }) => <BookOpen size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="StudentTasks"
        options={{
          href: isStudent ? undefined : null,
          tabBarIcon: ({ color }) => <ClipboardList size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="StudentForms"
        options={{
          href: isStudent ? undefined : null,
          tabBarIcon: ({ color }) => <FileText size={24} color={color} />,
        }}
      />

      {/* Legacy Instructor Screens (Hidden) */}
      <Tabs.Screen
        name="InstructorDashboard"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="InstructorModules"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="InstructorEvaluations"
        options={{
          href: null,
        }}
      />

      {/* Rebuilt 4-Tab Instructor Screens */}
      <Tabs.Screen
        name="InstructorHome"
        options={{
          href: isInstructor ? undefined : null,
          headerShown: isInstructor,
          headerTitle: 'Command Center',
          headerStyle: { backgroundColor: '#0B1120', borderBottomWidth: 0, shadowColor: 'transparent', elevation: 0 },
          headerTintColor: '#F59E0B',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/ProfileScreen')} style={{ marginRight: 20 }}>
              <User size={24} color="#F59E0B" />
            </TouchableOpacity>
          ),
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <LayoutDashboard size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="InstructorCourses"
        options={{
          href: isInstructor ? undefined : null,
          headerShown: isInstructor,
          headerTitle: 'My Courses',
          headerStyle: { backgroundColor: '#0B1120', borderBottomWidth: 0, shadowColor: 'transparent', elevation: 0 },
          headerTintColor: '#F59E0B',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/ProfileScreen')} style={{ marginRight: 20 }}>
              <User size={24} color="#F59E0B" />
            </TouchableOpacity>
          ),
          tabBarLabel: 'My Courses',
          tabBarIcon: ({ color }) => <BookOpen size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="StudentDirectory"
        options={{
          href: isInstructor ? undefined : null,
          headerShown: isInstructor,
          headerTitle: 'Student Directory',
          headerStyle: { backgroundColor: '#0B1120', borderBottomWidth: 0, shadowColor: 'transparent', elevation: 0 },
          headerTintColor: '#F59E0B',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/ProfileScreen')} style={{ marginRight: 20 }}>
              <User size={24} color="#F59E0B" />
            </TouchableOpacity>
          ),
          tabBarLabel: 'Directory',
          tabBarIcon: ({ color }) => <Users size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="AIQuota"
        options={{
          href: isInstructor ? undefined : null,
          headerShown: isInstructor,
          headerTitle: 'AI Quota',
          headerStyle: { backgroundColor: '#0B1120', borderBottomWidth: 0, shadowColor: 'transparent', elevation: 0 },
          headerTintColor: '#F59E0B',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/ProfileScreen')} style={{ marginRight: 20 }}>
              <User size={24} color="#F59E0B" />
            </TouchableOpacity>
          ),
          tabBarLabel: 'AI Quota',
          tabBarIcon: ({ color }) => <Zap size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Student tab bar — icon only, compact
  tabBar: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    height: 70,
    borderRadius: 24,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'transparent',
    elevation: 0,
  },
  // Instructor tab bar — icon + label, taller
  tabBarWithLabels: {
    position: 'absolute',
    bottom: 25,
    left: 16,
    right: 16,
    height: 80,
    borderRadius: 24,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.12)',
    backgroundColor: 'transparent',
    elevation: 0,
  },
  blurContainer: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  // Student icon-only tab item
  tabBarItem: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  // Instructor icon+label tab item
  tabBarItemWithLabel: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: 2,
  },
});
