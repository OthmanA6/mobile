import React from 'react';
import { Stack } from 'expo-router';

export default function StudentStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" />
      {/* Any future detail screens will be added here (e.g., TaskDetails) */}
    </Stack>
  );
}
