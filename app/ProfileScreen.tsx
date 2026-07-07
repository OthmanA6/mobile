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
  ChevronLeft,
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
  Camera,
  Edit3,
  Bookmark,
  Lock,
  Sun,
  Moon,
  FileText,
  Folder,
  Trash2,
  Mail,
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../src/api/auth';
import { useTheme } from '../src/context/ThemeContext';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { themeMode, setTheme } = useTheme();
  const isLight = themeMode === 'light';
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit States
  const [isEmailModalVisible, setIsEmailModalVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    email: '',
    password: '',
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
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      const localUri = result.assets[0].uri;
      const filename = localUri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      const formData = new FormData();
      formData.append('profileImage', { uri: localUri, name: filename, type } as any);

      try {
        const response = await authService.updateProfile(formData);
        setUser(response.user);
        Alert.alert('Success', 'Profile image updated successfully');
      } catch (error: any) {
        Alert.alert('Error', error.response?.data?.message || 'Failed to update image');
      }
    }
  };

  const handleUpdateEmail = async () => {
    if (editForm.email === user.email) {
      setIsEmailModalVisible(false);
      return;
    }
    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append('email', editForm.email);
      const response = await authService.updateProfile(formData);
      setUser(response.user);
      Alert.alert('Success', 'Email updated successfully');
      setIsEmailModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update email');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!editForm.password) {
      setIsPasswordModalVisible(false);
      return;
    }
    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append('password', editForm.password);
      const response = await authService.updateProfile(formData);
      setUser(response.user);
      Alert.alert('Success', 'Password updated successfully');
      setIsPasswordModalVisible(false);
      setEditForm(prev => ({ ...prev, password: '' }));
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update password');
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
      <View style={[styles.loadingContainer, isLight ? styles.containerLight : styles.containerDark]}>
        <ActivityIndicator size="large" color={isLight ? '#6750a4' : '#cfbcff'} />
      </View>
    );
  }

  return (
    <View style={[styles.container, isLight ? styles.containerLight : styles.containerDark]}>
      {!isLight ? (
        <LinearGradient
          colors={['#0e0a1a', '#0a0614']}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color={isLight ? '#000' : '#fff'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isLight ? { color: '#000' } : null]}>My Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileCard, isLight ? styles.cardLight : styles.cardDark]}>
          <TouchableOpacity activeOpacity={0.8} style={styles.avatarContainer} onPress={handlePickImage}>
            <Image
              source={{ uri: user?.profileImage ? user.profileImage : `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=random` }}
              style={styles.avatar}
            />
            <View style={styles.cameraIconContainer}>
              <Camera size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <View style={styles.profileTextContainer}>
            <Text style={[styles.nameText, isLight ? { color: '#000' } : null]}>{user?.firstName} {user?.lastName}</Text>
            <Text style={[styles.emailText, isLight ? { color: '#64748b' } : null]}>{user?.email}</Text>
          </View>
        </View>

        {/* ACCOUNT */}
        <Text style={[styles.sectionHeader, isLight ? { color: '#64748b' } : null]}>ACCOUNT</Text>
        <View style={[styles.sectionGroup, isLight ? styles.cardLight : styles.cardDark]}>
          <TouchableOpacity style={styles.rowItem} onPress={() => { setEditForm(prev => ({ ...prev, email: user?.email || '' })); setIsEmailModalVisible(true); }}>
            <View style={styles.rowLeft}>
              <Mail size={20} color={isLight ? '#000' : '#fff'} />
              <Text style={[styles.rowText, isLight ? { color: '#000' } : null]}>Email</Text>
            </View>
            <ChevronRight size={20} color={isLight ? '#000' : '#fff'} />
          </TouchableOpacity>
          <View style={[styles.divider, isLight ? styles.dividerLight : styles.dividerDark]} />

          <TouchableOpacity style={styles.rowItem} onPress={() => { setEditForm(prev => ({ ...prev, password: '' })); setIsPasswordModalVisible(true); }}>
            <View style={styles.rowLeft}>
              <Lock size={20} color={isLight ? '#000' : '#fff'} />
              <Text style={[styles.rowText, isLight ? { color: '#000' } : null]}>Change password</Text>
            </View>
            <ChevronRight size={20} color={isLight ? '#000' : '#fff'} />
          </TouchableOpacity>
        </View>



        {/* OTHER SETTING */}
        <Text style={[styles.sectionHeader, isLight ? { color: '#64748b' } : null]}>OTHER SETTING</Text>
        <View style={[styles.sectionGroup, isLight ? styles.cardLight : styles.cardDark]}>
          <TouchableOpacity style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <Trash2 size={20} color="#ef4444" />
              <Text style={[styles.rowText, { color: '#ef4444' }]}>Deactivate account</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Login/Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>LOGOUT</Text>
        </TouchableOpacity>
      </ScrollView>

      {isEmailModalVisible ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <BlurView intensity={50} tint={isLight ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
          <Animatable.View animation="fadeInUp" duration={400} style={[styles.modalContent, isLight ? styles.modalContentLight : null]}>
            <Text style={[styles.modalTitle, isLight ? { color: '#000' } : null]}>Change Email</Text>

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={[styles.input, isLight ? styles.inputLight : null]}
              value={editForm.email}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
              placeholder="Enter new email"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButtonCancel, isLight ? styles.modalButtonCancelLight : null]} onPress={() => setIsEmailModalVisible(false)}>
                <Text style={[styles.modalButtonText, isLight ? { color: '#64748b' } : null]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonSave} onPress={handleUpdateEmail}>
                {isUpdating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </KeyboardAvoidingView>
      ) : null}

      {isPasswordModalVisible ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <BlurView intensity={50} tint={isLight ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
          <Animatable.View animation="fadeInUp" duration={400} style={[styles.modalContent, isLight ? styles.modalContentLight : null]}>
            <Text style={[styles.modalTitle, isLight ? { color: '#000' } : null]}>Change Password</Text>

            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={[styles.input, isLight ? styles.inputLight : null]}
              value={editForm.password}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, password: text }))}
              placeholder="Enter new password"
              placeholderTextColor="#94a3b8"
              secureTextEntry
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButtonCancel, isLight ? styles.modalButtonCancelLight : null]} onPress={() => setIsPasswordModalVisible(false)}>
                <Text style={[styles.modalButtonText, isLight ? { color: '#64748b' } : null]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonSave} onPress={handleUpdatePassword}>
                {isUpdating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Save Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </KeyboardAvoidingView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerDark: { backgroundColor: '#0e0a1a' },
  containerLight: { backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  
  cardDark: { backgroundColor: '#1a1625', borderRadius: 20 },
  cardLight: { backgroundColor: '#fff', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  
  profileCard: { flexDirection: 'row', alignItems: 'center', padding: 20, marginTop: 10, marginBottom: 30 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 70, height: 70, borderRadius: 35 },
  cameraIconContainer: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#d946ef', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#1a1625' },
  profileTextContainer: { marginLeft: 16, flex: 1 },
  nameText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  emailText: { fontSize: 14, color: '#94a3b8', marginTop: 4 },

  sectionHeader: { fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 8 },
  sectionGroup: { paddingHorizontal: 16, paddingVertical: 8, marginBottom: 24 },
  
  rowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { fontSize: 16, color: '#fff', fontWeight: '500' },
  
  divider: { height: 1 },
  dividerDark: { backgroundColor: 'rgba(255,255,255,0.05)' },
  dividerLight: { backgroundColor: 'rgba(0,0,0,0.05)' },

  appearanceToggleContainer: { flexDirection: 'row', padding: 4, marginBottom: 24, height: 50 },
  toggleButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, overflow: 'hidden' },
  toggleActive: { },
  toggleActiveGradientWrapper: { },
  toggleText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },

  logoutBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  logoutBtnText: { color: '#ef4444', fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Modal Styles
  modalOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 1000 },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 100 },
  modalContentLight: { backgroundColor: '#fff' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  inputLabel: { color: '#94a3b8', fontSize: 12, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  inputLight: { backgroundColor: '#f8fafc', color: '#000', borderColor: '#e2e8f0' },
  imagePickerBtn: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, height: 80, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  imagePickerText: { color: '#6366f1', fontWeight: '600' },
  imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  modalButtonCancel: { flex: 1, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  modalButtonCancelLight: { backgroundColor: '#f1f5f9' },
  modalButtonSave: { flex: 1, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#6366f1' },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});
