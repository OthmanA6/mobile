import React from 'react';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';
import { BookOpen, LayoutDashboard, Users, Zap } from 'lucide-react-native';

export default function InstructorTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBarWithLabels,
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarItemStyle: styles.tabBarItemWithLabel,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarBackground: () => (
          <View style={styles.blurContainer}>
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          </View>
        ),
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
        name="AIQuota"
        options={{
          tabBarLabel: 'AI Quota',
          tabBarIcon: ({ color }) => <Zap size={22} color={color} />,
        }}
      />

      {/* Hidden Screens inside the Instructor Route Group */}
      <Tabs.Screen name="InstructorDashboard" options={{ href: null }} />
      <Tabs.Screen name="InstructorModules" options={{ href: null }} />
      <Tabs.Screen name="InstructorEvaluations" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWithLabels: {
    position: 'absolute',
    bottom: 25,
    left: 16,
    right: 16,
    height: 80,
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
