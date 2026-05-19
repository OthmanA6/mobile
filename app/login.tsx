import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Mail, Lock, ChevronRight, Fingerprint, Eye, EyeOff } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import * as Animatable from 'react-native-animatable';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../src/api/auth';
import { theme } from '../src/theme/theme';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onLogin = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await authService.login(data);
      if (response.token) {
        await AsyncStorage.setItem('userToken', response.token);
        
        const userRole = response.user?.role || 'STUDENT';
        await AsyncStorage.setItem('userRole', userRole);

        if (userRole.toUpperCase() === 'INSTRUCTOR') {
          router.replace('/(tabs)/InstructorDashboard');
        } else {
          router.replace('/(tabs)/StudentDashboard');
        }
      } else {
        Alert.alert('Login Failed', 'No token received');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Invalid email or password.';
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <TrendingUp size={24} color={theme.colors.primary} />
            <Text style={styles.logoText}>insightO</Text>
          </View>
        </View>

        <Animatable.View animation="fadeInDown" duration={800} style={styles.heroSection}>
          <Text style={styles.heroTitle}>Welcome back</Text>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" duration={1000} delay={200}>
          <BlurView intensity={20} tint="dark" style={styles.glassCard}>
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>WORK EMAIL</Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, value } }) => (
                    <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                      <Mail size={18} color={theme.colors.onSurfaceVariant} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="name@company.com"
                        placeholderTextColor={theme.colors.outline}
                        value={value}
                        onChangeText={onChange}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  )}
                />
                {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>PASSWORD</Text>
                  <TouchableOpacity>
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, value } }) => (
                    <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                      <Lock size={18} color={theme.colors.onSurfaceVariant} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor={theme.colors.outline}
                        value={value}
                        onChangeText={onChange}
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        {showPassword ? (
                          <EyeOff size={18} color={theme.colors.onSurfaceVariant} />
                        ) : (
                          <Eye size={18} color={theme.colors.onSurfaceVariant} />
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                />
                {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
              </View>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleSubmit(onLogin)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Sign In</Text>
                    <ChevronRight size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                <View style={styles.divider} />
              </View>

              <TouchableOpacity style={styles.ssoButton}>
                <Image
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
                  style={styles.ssoIcon}
                />
                <Text style={styles.ssoButtonText}>Google</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animatable.View>

        <TouchableOpacity style={styles.footer} onPress={() => router.push('/register')}>
          <Text style={styles.footerText}>
            Don't have an account? <Text style={styles.footerLink}>Request access</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.gutter,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.primary,
    letterSpacing: -0.5,
  },
  heroSection: {
    marginBottom: 32,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginTop: 8,
    lineHeight: 24,
  },
  glassCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
  form: {
    padding: 24,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 2,
  },
  forgotText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020617',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    height: 56,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: '100%',
  },
  loginButton: {
    backgroundColor: theme.colors.indigo,
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: theme.colors.indigo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.2)',
    letterSpacing: 1,
  },
  ssoButton: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  ssoIcon: {
    width: 20,
    height: 20,
  },
  ssoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
  },
  footerLink: {
    color: theme.colors.primary,
    fontWeight: '900',
  },
  biometricContainer: {
    marginTop: 48,
    alignItems: 'center',
  },
  biometricButton: {
    alignItems: 'center',
    gap: 8,
    opacity: 0.6,
  },
  biometricText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.onSurfaceVariant,
  }
});
