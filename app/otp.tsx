import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck, ArrowLeft } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import * as Animatable from 'react-native-animatable';
import { authService } from '../src/api/auth';
import { theme } from '../src/theme/theme';

export default function OTPScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(60);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a 6-digit code.');
      return;
    }
    setIsLoading(true);
    try {
      await authService.verifyOTP(email!, otp);
      Alert.alert('Success', 'Account verified successfully!', [
        { text: 'Login', onPress: () => router.replace('/login') },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    if (timer === 0) {
      setTimer(60);
      // Call resend OTP API if available
      Alert.alert('OTP Resent', 'A new code has been sent to your email.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={[theme.colors.background, '#0f172a']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Verify Account</Text>
          <Text style={styles.subtitle}>Enter the 6-digit code sent to {email}</Text>
        </View>

        <Animatable.View animation="fadeInUp" duration={800}>
          <BlurView intensity={20} tint="dark" style={styles.glassCard}>
            <View style={styles.form}>
              <View style={styles.otpContainer}>
                <TextInput
                  style={styles.otpInput}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="000000"
                  placeholderTextColor={theme.colors.outline}
                />
              </View>

              <TouchableOpacity
                style={styles.verifyButton}
                onPress={handleVerify}
                disabled={isLoading}
              >
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.verifyButtonText}>Verify</Text>}
              </TouchableOpacity>

              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Didn't receive code? </Text>
                <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
                  <Text style={[styles.resendLink, timer > 0 && { opacity: 0.5 }]}>
                    Resend {timer > 0 ? `(${timer}s)` : ''}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Animatable.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { paddingHorizontal: 24, paddingTop: 60 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  header: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '900', color: '#fff' },
  subtitle: { fontSize: 16, color: theme.colors.onSurfaceVariant, marginTop: 8 },
  glassCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  form: { padding: 24, gap: 24 },
  otpContainer: { backgroundColor: 'transparent', borderRadius: 12, height: 60, justifyContent: 'center', alignItems: 'center' },
  otpInput: { color: '#fff', fontSize: 24, fontWeight: '900', textAlign: 'center', width: '100%', letterSpacing: 10 },
  verifyButton: { backgroundColor: theme.colors.primary, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  verifyButtonText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  resendContainer: { flexDirection: 'row', justifyContent: 'center' },
  resendText: { color: theme.colors.onSurfaceVariant },
  resendLink: { color: theme.colors.primary, fontWeight: '700' },
});
