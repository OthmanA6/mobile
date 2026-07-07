import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Home, BookOpen, ClipboardList, FileText } from 'lucide-react-native';
import { useTheme } from '../../../src/context/ThemeContext';

export default function StudentTabLayout() {
  const { themeMode } = useTheme();
  const isLight = themeMode === 'light';

  return (
    <Tabs
      screenOptions={{
        sceneStyle: { backgroundColor: 'transparent' },
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          position: 'absolute',
          bottom: 25,
          left: 20,
          right: 20,
          height: 76,
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
        tabBarInactiveTintColor: '#94a3b8',
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="StudentDashboard"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="StudentModules"
        options={{
          tabBarLabel: 'Courses',
          tabBarIcon: ({ color }) => <BookOpen size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="StudentTasks"
        options={{
          tabBarLabel: 'Evaluations',
          tabBarIcon: ({ color }) => <ClipboardList size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="StudentForms"
        options={{
          tabBarLabel: 'Surveys',
          tabBarIcon: ({ color }) => <FileText size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarItem: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    paddingBottom: 6,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: 2,
  },
});
