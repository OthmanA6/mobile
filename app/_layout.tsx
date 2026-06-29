import { Stack } from 'expo-router';
import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
import { theme } from '../src/theme/theme'; // الثيم بتاعك
import BackgroundWrapper from '../components/BackgroundWrapper';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

// دمج الثيم بتاعك مع إعدادات الشفافية
const customTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    ...theme.colors, // بيسحب كل ألوانك (Primary, Text, etc.)
    background: '#2b292f', // بيجبر الخلفية تبقى شفافة عشان الـ SVG يظهر
  },
};

function RootNavigator() {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#2b292f', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (role === 'INSTRUCTOR') {
    return (
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#2b292f' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(instructor)" />
        <Stack.Screen name="ProfileScreen" />
      </Stack>
    );
  } else if (role === 'STUDENT') {
    return (
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#2b292f' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(student)" />
        <Stack.Screen name="ProfileScreen" />
      </Stack>
    );
  } else {
    // Auth Navigator
    return (
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#2b292f' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="otp" />
      </Stack>
    );
  }
}

export default function RootLayout() {
  // ... كود الـ Fonts والـ useEffect زي ما هو ...

  return (
    <AuthProvider>
      <BackgroundWrapper>
        <ThemeProvider value={customTheme}>
          <RootNavigator />
        </ThemeProvider>
      </BackgroundWrapper>
    </AuthProvider>
  );
}