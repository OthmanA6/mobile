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
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, ChevronRight, Eye, EyeOff } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import * as Animatable from 'react-native-animatable';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authService } from '../src/api/auth';
import { theme } from '../src/theme/theme';
import { useAuth } from '../src/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onLogin = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await authService.login(data);
      if (response.token) {
        const userRole = response.user?.role || 'STUDENT';
        if (userRole.toUpperCase() === 'ADMIN') {
          Alert.alert('Access Denied', 'Admins are not allowed to log in via the mobile application.');
          setIsLoading(false);
          return;
        }
        await login(response.token, userRole.toUpperCase());
        if (userRole.toUpperCase() === 'INSTRUCTOR') {
          router.replace('/(instructor)/(tabs)/InstructorHome');
        } else {
          router.replace('/(student)/(tabs)/StudentDashboard');
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
    <View style={styles.mainContainer}>
      <LinearGradient colors={['#02010a', '#0a0a1a', '#02010a']} style={StyleSheet.absoluteFill} />
      
      {/* Decorative Premium Glows */}
      <Animatable.View animation="pulse" iterationCount="infinite" duration={6000} style={[styles.glowOrb, { top: -150, right: -100, backgroundColor: 'rgba(99, 102, 241, 0.15)' }]} />
      <Animatable.View animation="pulse" iterationCount="infinite" duration={7000} delay={1000} style={[styles.glowOrb, { bottom: -100, left: -150, backgroundColor: 'rgba(168, 85, 247, 0.15)' }]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top + 40, 60), paddingBottom: Math.max(insets.bottom + 40, 60) }]} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Section */}
          <Animatable.View animation="fadeInDown" duration={1000} style={styles.header}>
            <View style={styles.logoBox}>
              <Image 
                source={require('../assets/splash-icon.png')} 
                style={styles.logoImage} 
                resizeMode="contain"
              />
            </View>
            <Text style={styles.logoText}>insightO</Text>
          </Animatable.View>

          {/* Hero Section */}
          <Animatable.View animation="fadeInUp" duration={1000} delay={200} style={styles.heroSection}>
            <Text style={styles.heroTitle}>Welcome Back</Text>
            <Text style={styles.heroSubtitle}>Sign in to access your dashboard</Text>
          </Animatable.View>

          {/* Form Section */}
          <Animatable.View animation="fadeInUp" duration={1000} delay={400}>
            <BlurView intensity={30} tint="dark" style={styles.glassCard}>
              <View style={styles.form}>
                
                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>WORK EMAIL</Text>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, value } }) => (
                      <View style={[
                        styles.inputWrapper, 
                        focusedInput === 'email' && styles.inputWrapperFocused,
                        errors.email && styles.inputError
                      ]}>
                        <Mail size={20} color={focusedInput === 'email' ? '#818cf8' : '#94a3b8'} style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="name@company.com"
                          placeholderTextColor="#475569"
                          value={value}
                          onChangeText={onChange}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          onFocus={() => setFocusedInput('email')}
                          onBlur={() => setFocusedInput(null)}
                        />
                      </View>
                    )}
                  />
                  {errors.email && (
                    <Animatable.Text animation="fadeIn" style={styles.errorText}>{errors.email.message}</Animatable.Text>
                  )}
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>PASSWORD</Text>
                    <TouchableOpacity activeOpacity={0.7}>
                      <Text style={styles.forgotText}>Forgot password?</Text>
                    </TouchableOpacity>
                  </View>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, value } }) => (
                      <View style={[
                        styles.inputWrapper, 
                        focusedInput === 'password' && styles.inputWrapperFocused,
                        errors.password && styles.inputError
                      ]}>
                        <Lock size={20} color={focusedInput === 'password' ? '#818cf8' : '#94a3b8'} style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="••••••••"
                          placeholderTextColor="#475569"
                          value={value}
                          onChangeText={onChange}
                          secureTextEntry={!showPassword}
                          onFocus={() => setFocusedInput('password')}
                          onBlur={() => setFocusedInput(null)}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                          {showPassword ? (
                            <EyeOff size={20} color="#94a3b8" />
                          ) : (
                            <Eye size={20} color="#94a3b8" />
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                  {errors.password && (
                    <Animatable.Text animation="fadeIn" style={styles.errorText}>{errors.password.message}</Animatable.Text>
                  )}
                </View>

                {/* Login Button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleSubmit(onLogin)}
                  disabled={isLoading}
                  style={styles.loginBtnWrapper}
                >
                  <LinearGradient 
                    colors={['#6366f1', '#4f46e5']} 
                    start={{ x: 0, y: 0 }} 
                    end={{ x: 1, y: 1 }} 
                    style={styles.loginButton}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Text style={styles.loginButtonText}>Sign In</Text>
                        <ChevronRight size={20} color="#fff" style={{ marginLeft: 4 }} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </BlurView>
          </Animatable.View>

          {/* Footer */}
          <Animatable.View animation="fadeIn" duration={1000} delay={600} style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/register')} activeOpacity={0.7}>
              <Text style={styles.footerLink}>Request access</Text>
            </TouchableOpacity>
          </Animatable.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#02010a',
  },
  glowOrb: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.6,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  logoImage: {
    width: 48,
    height: 48,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
  heroSection: {
    marginBottom: 40,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#94a3b8',
    fontWeight: '500',
  },
  glassCard: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  form: {
    padding: 24,
    paddingTop: 32,
    gap: 24,
  },
  inputGroup: {
    gap: 10,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  forgotText: {
    fontSize: 12,
    color: '#818cf8',
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    height: 60,
    paddingHorizontal: 16,
  },
  inputWrapperFocused: {
    borderColor: 'rgba(99, 102, 241, 0.5)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  inputError: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    height: '100%',
  },
  eyeBtn: {
    padding: 8,
  },
  loginBtnWrapper: {
    marginTop: 12,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  loginButton: {
    height: 60,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  footerLink: {
    color: '#818cf8',
    fontSize: 14,
    fontWeight: '800',
  },
});
