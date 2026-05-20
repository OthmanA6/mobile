import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Home, BookOpen, ClipboardList, User, FileText } from 'lucide-react-native';
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
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#6366f1', // Indigo
        tabBarInactiveTintColor: '#94a3b8', // Slate
        tabBarItemStyle: styles.tabBarItem,
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

      {/* Instructor Screens */}
      <Tabs.Screen
        name="InstructorDashboard"
        options={{
          href: isInstructor ? undefined : null,
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="InstructorModules"
        options={{
          href: isInstructor ? undefined : null,
          tabBarIcon: ({ color }) => <BookOpen size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="InstructorTasks"
        options={{
          href: isInstructor ? undefined : null,
          tabBarIcon: ({ color }) => <ClipboardList size={24} color={color} />,
        }}
      />

      {/* Shared Screens */}
      <Tabs.Screen
        name="ProfileScreen"
        options={{
          href: null,
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
  blurContainer: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  tabBarItem: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
});
