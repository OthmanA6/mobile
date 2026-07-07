import React from 'react';
import { Stack } from 'expo-router';

export default function InstructorStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'slide_from_right', // Native-like stack animation
      }}
    >
      <Stack.Screen name="(tabs)" />
      
      {/* Detail & Feature Screens */}
      <Stack.Screen name="InstructorCourseDetail" />
      <Stack.Screen name="StudentProfileDetail" />
      <Stack.Screen name="CreateQuizScreen" />
      <Stack.Screen name="CreateStandardTaskScreen" />
      
      {/* Unused/Legacy screens - keeping them accessible just in case */}
      <Stack.Screen name="InstructorDashboard" />
      <Stack.Screen name="InstructorModules" />
      <Stack.Screen name="InstructorEvaluations" />
      <Stack.Screen name="AIQuota" />
    </Stack>
  );
}
