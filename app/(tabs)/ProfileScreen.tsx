import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Settings as SettingsIcon,
  Bell,
  BadgeCheck,
  Star,
  Zap,
  Globe,
  Shield,
  HelpCircle,
  ChevronRight,
  LogOut,
  LayoutGrid,
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../../src/api/auth';
import { theme } from '../../src/theme/theme';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Profile States
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    email: '',
    password: '',
    profileImage: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await authService.getProfile();
      setUser(data.user);
      setEditForm({
        email: data.user.email || '',
        password: '',
        profileImage: data.user.profileImage || '',
      });
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setEditForm(prev => ({ ...prev, profileImage: result.assets[0].uri }));
    }
  };

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    try {
      const formData = new FormData();
      let hasChanges = false;

      if (editForm.email !== user.email) {
        formData.append('email', editForm.email);
        hasChanges = true;
      }
      if (editForm.password) {
        formData.append('password', editForm.password);
        hasChanges = true;
      }
      if (editForm.profileImage !== user.profileImage && editForm.profileImage !== '') {
        const localUri = editForm.profileImage;
        const filename = localUri.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('profileImage', {
          uri: localUri,
          name: filename,
          type,
        } as any);
        hasChanges = true;
      }

      if (!hasChanges) {
        setIsEditModalVisible(false);
        setIsUpdating(false);
        return;
      }

      const response = await authService.updateProfile(formData);
      setUser(response.user);
      Alert.alert('Success', 'Profile updated successfully');
      setIsEditModalVisible(false);
      setEditForm(prev => ({ ...prev, password: '' })); // Clear password
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    router.replace('/login');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background, '#0f172a']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logoText}>Profile</Text>
          <TouchableOpacity style={styles.iconButton}>
            <Bell size={24} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* Bento Box Layout */}
        <View style={styles.bentoContainer}>
          {/* Main Profile Card */}
          <Animatable.View animation="fadeInDown" duration={800} style={styles.mainCard}>
            <BlurView intensity={20} tint="dark" style={styles.blurInner}>
              <View style={styles.profileInfo}>
                <Image
                  source={{ uri: user?.profileImage ? user.profileImage : `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=random` }}
                  style={styles.avatar}
                />
                <View style={styles.profileText}>
                  <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
                  <Text style={styles.email}>{user?.email}</Text>
                  <View style={styles.verifiedBadge}>
                    <BadgeCheck size={12} color={theme.colors.primary} />
                    <Text style={styles.verifiedText}>Verified Account</Text>
                  </View>
                </View>
              </View>
            </BlurView>
          </Animatable.View>

          <View style={styles.row}>
            {/* Role Card */}
            <Animatable.View animation="fadeInLeft" duration={800} delay={200} style={styles.smallCard}>
              <BlurView intensity={20} tint="dark" style={styles.blurInner}>
                <LayoutGrid size={24} color={theme.colors.secondary} />
                <Text style={styles.cardLabel}>ROLE</Text>
                <Text style={styles.cardValue}>{user?.role || 'N/A'}</Text>
              </BlurView>
            </Animatable.View>

            {/* National ID Card */}
            <Animatable.View animation="fadeInRight" duration={800} delay={200} style={styles.smallCard}>
              <BlurView intensity={20} tint="dark" style={styles.blurInner}>
                <Shield size={24} color={theme.colors.tertiary} />
                <Text style={styles.cardLabel}>NATIONAL ID</Text>
                <Text style={styles.cardValue}>{user?.nationalId || 'N/A'}</Text>
              </BlurView>
            </Animatable.View>
          </View>

          <View style={styles.row}>
            {/* Status Card */}
            <Animatable.View animation="fadeInUp" duration={800} delay={300} style={styles.smallCard}>
              <BlurView intensity={20} tint="dark" style={styles.blurInner}>
                <Zap size={24} color={user?.isActive ? theme.colors.primary : theme.colors.error} />
                <Text style={styles.cardLabel}>ACCOUNT STATUS</Text>
                <Text style={styles.cardValue}>{user?.isActive ? 'Active' : 'Inactive'}</Text>
              </BlurView>
            </Animatable.View>

            {/* Verification Card */}
            <Animatable.View animation="fadeInUp" duration={800} delay={300} style={styles.smallCard}>
              <BlurView intensity={20} tint="dark" style={styles.blurInner}>
                <BadgeCheck size={24} color={user?.isVerified ? theme.colors.primary : theme.colors.outline} />
                <Text style={styles.cardLabel}>VERIFICATION</Text>
                <Text style={styles.cardValue}>{user?.isVerified ? 'Verified' : 'Pending'}</Text>
              </BlurView>
            </Animatable.View>
          </View>

          {/* Settings Section */}
          <Animatable.View animation="fadeInUp" duration={800} delay={400} style={styles.settingsCard}>
            <BlurView intensity={20} tint="dark" style={styles.blurInner}>
              <Text style={styles.sectionTitle}>SYSTEM SETTINGS</Text>

              <TouchableOpacity style={styles.settingItem} onPress={() => setIsEditModalVisible(true)}>
                <SettingsIcon size={20} color={theme.colors.primary} />
                <Text style={styles.settingText}>Edit Profile</Text>
                <ChevronRight size={18} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </BlurView>
          </Animatable.View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={theme.colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      {isEditModalVisible && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
          <Animatable.View animation="fadeInUp" duration={400} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <Text style={styles.inputLabel}>Profile Image</Text>
            <TouchableOpacity style={styles.imagePickerBtn} onPress={handlePickImage}>
              {editForm.profileImage ? (
                <Image source={{ uri: editForm.profileImage }} style={styles.imagePreview} />
              ) : (
                <Text style={styles.imagePickerText}>Select Image</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={editForm.email}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
              placeholder="Enter new email"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.inputLabel}>New Password (Optional)</Text>
            <TextInput
              style={styles.input}
              value={editForm.password}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, password: text }))}
              placeholder="Enter new password"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              secureTextEntry
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButtonCancel} onPress={() => setIsEditModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonSave} onPress={handleUpdateProfile}>
                {isUpdating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  scrollContent: { paddingTop: 60, paddingBottom: 120, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  logoText: { fontSize: 24, fontWeight: '900', color: '#fff' },
  iconButton: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  bentoContainer: { gap: 16 },
  mainCard: { borderRadius: 24, overflow: 'hidden', height: 140 },
  blurInner: { flex: 1, padding: 20, justifyContent: 'center' },
  profileInfo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: theme.colors.primary },
  profileText: { flex: 1 },
  name: { fontSize: 22, fontWeight: '900', color: '#fff' },
  email: { fontSize: 14, color: theme.colors.onSurfaceVariant, marginTop: 4 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  verifiedText: { fontSize: 10, fontWeight: '900', color: theme.colors.primary, letterSpacing: 0.5 },
  row: { flexDirection: 'row', gap: 16 },
  smallCard: { flex: 1, height: 140, borderRadius: 24, overflow: 'hidden' },
  cardLabel: { fontSize: 10, fontWeight: '900', color: theme.colors.onSurfaceVariant, letterSpacing: 1.5, marginTop: 12 },
  cardValue: { fontSize: 18, fontWeight: '900', color: '#fff', marginTop: 4 },
  settingsCard: { borderRadius: 24, overflow: 'hidden' },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: theme.colors.onSurfaceVariant, letterSpacing: 2, marginBottom: 16 },
  settingItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  settingText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#fff' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 32, height: 56, borderRadius: 16, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  logoutText: { fontSize: 16, fontWeight: '800', color: theme.colors.error },

  // Modal Styles
  modalOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 1000 },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 100 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  inputLabel: { color: theme.colors.onSurfaceVariant, fontSize: 12, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  imagePickerBtn: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, height: 80, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  imagePickerText: { color: theme.colors.primary, fontWeight: '600' },
  imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  modalButtonCancel: { flex: 1, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  modalButtonSave: { flex: 1, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.primary },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});
