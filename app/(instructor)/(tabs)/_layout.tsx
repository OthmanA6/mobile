import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { BookOpen, LayoutDashboard, Users, BarChart3 } from 'lucide-react-native';
import { useTheme } from '../../../src/context/ThemeContext';

export default function InstructorTabLayout() {
  const { themeMode } = useTheme();
  const isLight = themeMode === 'light';

  return (
    <Tabs
      screenOptions={{
        sceneStyle: { backgroundColor: '#020617' },
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          position: 'absolute',
          bottom: 25,
          left: 16,
          right: 16,
          height: 80,
          borderRadius: 24,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255, 255, 255, 0.1)',
          backgroundColor: isLight ? '#ffffff' : '#0e0c20',
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isLight ? 0.08 : 0,
          shadowRadius: 12,
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: isLight ? '#94a3b8' : '#94a3b8',
        tabBarItemStyle: styles.tabBarItemWithLabel,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="InstructorHome"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <LayoutDashboard size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="InstructorCourses"
        options={{
          tabBarLabel: 'My Courses',
          tabBarIcon: ({ color }) => <BookOpen size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="StudentDirectory"
        options={{
          tabBarLabel: 'Directory',
          tabBarIcon: ({ color }) => <Users size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="TaskAnalytics"
        options={{
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ color }) => <BarChart3 size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
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
