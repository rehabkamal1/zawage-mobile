import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Switch,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function SettingsScreen({ navigation }) {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useAlert();

  const [activeTab, setActiveTab] = useState('security'); // 'security' | 'notifications'
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Notifications Preferences (Parity with UserSettings.jsx)
  const [notifyNewMatch, setNotifyNewMatch] = useState(true);
  const [notifyProfileLike, setNotifyProfileLike] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const matchPref = await AsyncStorage.getItem('notify_new_match');
      const likePref = await AsyncStorage.getItem('notify_profile_like');
      if (matchPref !== null) setNotifyNewMatch(matchPref === 'true');
      if (likePref !== null) setNotifyProfileLike(likePref === 'true');
    } catch (e) {
      console.log('Error loading settings', e);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      await AsyncStorage.setItem('notify_new_match', String(notifyNewMatch));
      await AsyncStorage.setItem('notify_profile_like', String(notifyProfileLike));
      showSuccess('تم بنجاح 🎉', 'تم حفظ تفضيلات التنبيهات بنجاح.');
    } catch (e) {
      showError('خطأ', 'تعذر حفظ إعدادات التنبيهات.');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showWarning('تنبيه', 'يرجى إدخال كلمة المرور الحالية وكلمة المرور الجديدة وتأكيدها.');
      return;
    }

    if (newPassword.length < 6) {
      showWarning('تنبيه', 'كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف أو أرقام.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showWarning('خطأ', 'كلمة المرور الجديدة غير متطابقة.');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await api.updatePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      showSuccess('تم بنجاح 🎉', res.message || 'تم تحديث كلمة المرور بنجاح.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      showError('خطأ', e.message || 'فشل تحديث كلمة المرور. يرجى التحقق من كلمة المرور الحالية.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-forward" size={22} color="#2D1B4D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إعدادات الحساب</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab Switcher (Parity with UserSettings.jsx: الأمان & التنبيهات) */}
      <View style={styles.tabsBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'security' && styles.tabItemActive]}
          onPress={() => setActiveTab('security')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="shield-checkmark"
            size={18}
            color={activeTab === 'security' ? '#E91E63' : '#8B94B7'}
            style={{ marginLeft: 6 }}
          />
          <Text style={[styles.tabItemText, activeTab === 'security' && styles.tabItemTextActive]}>
            الأمان
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'notifications' && styles.tabItemActive]}
          onPress={() => setActiveTab('notifications')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="notifications"
            size={18}
            color={activeTab === 'notifications' ? '#E91E63' : '#8B94B7'}
            style={{ marginLeft: 6 }}
          />
          <Text style={[styles.tabItemText, activeTab === 'notifications' && styles.tabItemTextActive]}>
            التنبيهات
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* TAB 1: SECURITY (الأمان) */}
        {activeTab === 'security' && (
          <>
            {/* Account Info Summary Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>بيانات الحساب المسجلة</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoVal}>{user?.name}</Text>
                <Text style={styles.infoKey}>الاسم المسجل:</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoVal}>{user?.phone || 'غير مسجل'}</Text>
                <Text style={styles.infoKey}>رقم الهاتف:</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoVal}>{user?.email || 'غير مسجل'}</Text>
                <Text style={styles.infoKey}>البريد الإلكتروني:</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoVal}>{user?.gender === 'male' ? 'عريس' : 'عروسة'}</Text>
                <Text style={styles.infoKey}>نوع الحساب:</Text>
              </View>
            </View>

            {/* Change Password Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>تغيير كلمة المرور</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>كلمة المرور الحالية</Text>
                <TextInput
                  style={styles.input}
                  placeholder="كلمة المرور الحالية"
                  placeholderTextColor="#94A3B8"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showPassword}
                  textAlign="right"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>كلمة المرور الجديدة</Text>
                <TextInput
                  style={styles.input}
                  placeholder="كلمة المرور الجديدة"
                  placeholderTextColor="#94A3B8"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  textAlign="right"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>تأكيد كلمة المرور الجديدة</Text>
                <TextInput
                  style={styles.input}
                  placeholder="تأكيد كلمة المرور الجديدة"
                  placeholderTextColor="#94A3B8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  textAlign="right"
                />
              </View>

              <TouchableOpacity
                style={styles.showPassBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#64748B"
                  style={{ marginLeft: 6 }}
                />
                <Text style={styles.showPassText}>
                  {showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleChangePassword}
                disabled={savingPassword}
                activeOpacity={0.88}
              >
                {savingPassword ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={19} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    <Text style={styles.submitBtnText}>حفظ كلمة المرور الجديدة</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* TAB 2: NOTIFICATIONS (التنبيهات) */}
        {activeTab === 'notifications' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>تفضيلات التنبيهات والإشعارات</Text>
            <Text style={styles.cardSubtitle}>
              حدد الإشعارات التي ترغب في تلقيها لمتابعة مستجدات حسابك والتوافق الشرعي:
            </Text>

            <View style={styles.toggleRow}>
              <Switch
                value={notifyNewMatch}
                onValueChange={setNotifyNewMatch}
                trackColor={{ false: '#CBD5E1', true: '#FCE7F3' }}
                thumbColor={notifyNewMatch ? '#E91E63' : '#F1F5F9'}
              />
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>استلام تنبيهات عند وجود ترشيح وتوافق جديد</Text>
                <Text style={styles.toggleSub}>إشعارك فور تسجيل شريك مطابق لمواصفاتك</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.toggleRow}>
              <Switch
                value={notifyProfileLike}
                onValueChange={setNotifyProfileLike}
                trackColor={{ false: '#CBD5E1', true: '#FCE7F3' }}
                thumbColor={notifyProfileLike ? '#E91E63' : '#F1F5F9'}
              />
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>استلام تنبيهات عند إعجاب أحدهم بملفي</Text>
                <Text style={styles.toggleSub}>إشعارك عند إضافة استمارتك إلى قائمة المفضلات</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSaveNotifications}
              activeOpacity={0.88}
            >
              <Ionicons name="save-outline" size={19} color="#FFFFFF" style={{ marginLeft: 6 }} />
              <Text style={styles.submitBtnText}>حفظ تفضيلات التنبيهات</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#F1F4F9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#2D1B4D',
  },
  tabsBar: {
    flexDirection: 'row-reverse',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F4F9',
  },
  tabItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#E91E63',
  },
  tabItemText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#8B94B7',
  },
  tabItemTextActive: {
    color: '#E91E63',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F4F9',
    ...SHADOWS.small,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2D1B4D',
    marginBottom: 8,
    textAlign: 'right',
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 16,
    textAlign: 'right',
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  infoKey: {
    fontSize: 13,
    color: '#8B94B7',
    fontWeight: '700',
  },
  infoVal: {
    fontSize: 14,
    color: '#2D1B4D',
    fontWeight: '800',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 6,
    textAlign: 'right',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#2D1B4D',
    backgroundColor: '#F8FAFC',
  },
  showPassBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 18,
    alignSelf: 'flex-start',
  },
  showPassText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  submitBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E91E63',
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 8,
    ...SHADOWS.small,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  toggleTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 14,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2D1B4D',
    textAlign: 'right',
    marginBottom: 4,
  },
  toggleSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B94B7',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F4F9',
    marginVertical: 6,
  },
});
