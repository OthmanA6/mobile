import { Stack } from 'expo-router';
import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
import { theme } from '../src/theme/theme'; // الثيم بتاعك
import BackgroundWrapper from '../components/BackgroundWrapper';

// دمج الثيم بتاعك مع إعدادات الشفافية
const customTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    ...theme.colors, // بيسحب كل ألوانك (Primary, Text, etc.)
    background: '#2b292f', // بيجبر الخلفية تبقى شفافة عشان الـ SVG يظهر
  },
};

export default function RootLayout() {
  // ... كود الـ Fonts والـ useEffect زي ما هو ...

  return (
    <BackgroundWrapper>
      <ThemeProvider value={customTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#2b292f' },
            animation: 'fade',
          }}
        >
          {/* الشاشات بتاعتك */}
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </BackgroundWrapper>
  );
}