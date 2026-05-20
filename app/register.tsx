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
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Mail, User, ShieldCheck, ArrowLeft, Lock, CreditCard, Eye, EyeOff } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import * as Animatable from 'react-native-animatable';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authService } from '../src/api/auth';
import { theme } from '../src/theme/theme';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  nationalId: z.string().length(14, 'National ID must be 14 digits'),
  role: z.enum(['ADMIN', 'HOD', 'INSTRUCTOR', 'STUDENT']),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      nationalId: '',
      role: 'STUDENT',
    },
  });

  const selectedRole = watch('role');

  const onRegister = async (data: RegisterForm) => {
    if (data.role !== 'STUDENT' && data.role !== 'INSTRUCTOR') {
      Alert.alert(
        'Registration Restricted / التسجيل غير متاح',
        'Only Students and Instructors can create accounts via the mobile application.\nمتاح فقط للطلاب والمدربين إنشاء حسابات عبر تطبيق الهاتف.'
      );
      return;
    }
    setIsLoading(true);
    try {
      await authService.register(data);
      Alert.alert('Success', 'Account created! Please verify your email.', [
        { text: 'Verify OTP', onPress: () => router.push({ pathname: '/otp', params: { email: data.email } }) },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Registration failed');
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the enterprise AI network.</Text>
        </View>

        <Animatable.View animation="fadeInUp" duration={800}>
          <BlurView intensity={20} tint="dark" style={styles.glassCard}>
            <View style={styles.form}>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>FIRST NAME</Text>
                  <Controller
                    control={control}
                    name="firstName"
                    render={({ field: { onChange, value } }) => (
                      <View style={styles.inputWrapper}>
                        <User size={16} color={theme.colors.onSurfaceVariant} />
                        <TextInput
                          style={styles.input}
                          placeholder="John"
                          placeholderTextColor={theme.colors.outline}
                          value={value}
                          onChangeText={onChange}
                        />
                      </View>
                    )}
                  />
                  {errors.firstName && <Text style={styles.errorText}>{errors.firstName.message}</Text>}
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>LAST NAME</Text>
                  <Controller
                    control={control}
                    name="lastName"
                    render={({ field: { onChange, value } }) => (
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.input}
                          placeholder="Doe"
                          placeholderTextColor={theme.colors.outline}
                          value={value}
                          onChangeText={onChange}
                        />
                      </View>
                    )}
                  />
                  {errors.lastName && <Text style={styles.errorText}>{errors.lastName.message}</Text>}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>INSTITUTIONAL EMAIL</Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.inputWrapper}>
                      <Mail size={18} color={theme.colors.onSurfaceVariant} />
                      <TextInput
                        style={styles.input}
                        placeholder="john@university.edu"
                        placeholderTextColor={theme.colors.outline}
                        value={value}
                        onChangeText={onChange}
                        keyboardType="email-address"
                      />
                    </View>
                  )}
                />
                {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>NATIONAL ID (14 DIGITS)</Text>
                <Controller
                  control={control}
                  name="nationalId"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.inputWrapper}>
                      <CreditCard size={18} color={theme.colors.onSurfaceVariant} />
                      <TextInput
                        style={styles.input}
                        placeholder="29901011234567"
                        placeholderTextColor={theme.colors.outline}
                        value={value}
                        onChangeText={onChange}
                        keyboardType="number-pad"
                        maxLength={14}
                      />
                    </View>
                  )}
                />
                {errors.nationalId && <Text style={styles.errorText}>{errors.nationalId.message}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>PASSWORD</Text>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.inputWrapper}>
                      <Lock size={18} color={theme.colors.onSurfaceVariant} />
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

              <View style={styles.inputGroup}>
                <Text style={styles.label}>YOUR ROLE</Text>
                <View style={styles.roleContainer}>
                  {['STUDENT', 'INSTRUCTOR'].map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.roleButton, selectedRole === r && styles.roleButtonActive]}
                      onPress={() => setValue('role', r as any)}
                    >
                      <Text style={[styles.roleButtonText, selectedRole === r && styles.roleButtonTextActive]}>
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit(onRegister)}
                disabled={isLoading}
              >
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Request Access</Text>}
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animatable.View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.replace('/login')}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  subtitle: {
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 2,
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
    gap: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: '100%',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  roleButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  roleButtonText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '700',
  },
  roleButtonTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: theme.colors.primaryContainer,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  footer: {
    marginTop: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  footerText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
  },
  loginLink: {
    color: theme.colors.primary,
    fontWeight: '900',
    fontSize: 14,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: 4,
  },
});
