import { Stack } from 'expo-router';
import { ThemeProvider as NavThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import BackgroundWrapper from '../components/BackgroundWrapper';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import RadialGlowOrb from '../src/components/RadialGlowOrb';

function RootNavigator() {
  const { role, isLoading } = useAuth();
  const { theme, themeMode } = useTheme();

  const navTheme = themeMode === 'light'
    ? {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: theme.colors.background,
          card: theme.colors.card,
          text: theme.colors.text,
          border: theme.colors.outline,
        },
      }
    : {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: theme.colors.background,
          card: theme.colors.card,
          text: theme.colors.text,
          border: theme.colors.outline,
        },
      };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        {themeMode === 'dark' ? (
          <LinearGradient
            colors={['#090514', '#0c0a1a', '#02010a']}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        {themeMode === 'dark' ? (
          <RadialGlowOrb color="rgba(99,102,241,0.6)" size={500} style={{ top: -150, right: -150 }} />
        ) : null}
        {themeMode === 'dark' ? (
          <RadialGlowOrb color="rgba(168,85,247,0.5)" size={500} style={{ bottom: -50, left: -200 }} />
        ) : null}
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (role === 'INSTRUCTOR') {
    return (
      <NavThemeProvider value={navTheme}>
        <StatusBar style={theme.colors.statusBar} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="(instructor)" />
          <Stack.Screen name="ProfileScreen" />
        </Stack>
      </NavThemeProvider>
    );
  } else if (role === 'STUDENT') {
    return (
      <NavThemeProvider value={navTheme}>
        <StatusBar style={theme.colors.statusBar} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="(student)" />
          <Stack.Screen name="ProfileScreen" />
        </Stack>
      </NavThemeProvider>
    );
  } else {
    return (
      <NavThemeProvider value={navTheme}>
        <StatusBar style={theme.colors.statusBar} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="otp" />
        </Stack>
      </NavThemeProvider>
    );
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <BackgroundWrapper>
            <RootNavigator />
          </BackgroundWrapper>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}