import { Stack } from 'expo-router';
import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
import { theme } from '../src/theme/theme'; // الثيم بتاعك
import BackgroundWrapper from '../components/BackgroundWrapper';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// دمج الثيم بتاعك مع إعدادات الشفافية
const customTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    ...theme.colors, // بيسحب كل ألوانك (Primary, Text, etc.)
    background: '#02010a', // يتطابق مع خلفية الشاشات لتجنب الوميض
  },
};

function RootNavigator() {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#02010a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (role === 'INSTRUCTOR') {
    return (
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#02010a' },
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
          contentStyle: { backgroundColor: '#02010a' },
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
          contentStyle: { backgroundColor: '#02010a' },
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
    <SafeAreaProvider>
      <AuthProvider>
        <BackgroundWrapper>
          <ThemeProvider value={customTheme}>
            <StatusBar style="light" />
            <RootNavigator />
          </ThemeProvider>
        </BackgroundWrapper>
      </AuthProvider>
    </SafeAreaProvider>
  );
}