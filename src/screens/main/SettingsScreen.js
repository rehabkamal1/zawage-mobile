import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function SettingsScreen({ navigation }) {
  const { user, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('تنبيه', 'يرجى إدخال كلمة المرور الحالية وكلمة المرور الجديدة وتأكيدها.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('تنبيه', 'كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف أو أرقام.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('تنبيه', 'كلمة المرور الجديدة وتأكيدها غير متطابقين.');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await api.updatePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      Alert.alert('تم بنجاح 🎉', res.message || 'تم تحديث كلمة المرور بنجاح.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      Alert.alert('تعذر التحديث', e.message || 'كلمة المرور الحالية غير صحيحة.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-forward" size={22} color="#2D1B4D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إعدادات الحساب والأمان</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>بيانات الحساب</Text>
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
            <Text style={styles.infoVal}>{user?.gender === 'male' ? 'عريس (شاب)' : 'عروسة (فتاة)'}</Text>
            <Text style={styles.infoKey}>الجنس:</Text>
          </View>
        </View>

        {/* Change Password Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>تغيير كلمة المرور</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>كلمة المرور الحالية</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
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
              placeholder="••••••••"
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
              placeholder="••••••••"
              placeholderTextColor="#94A3B8"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              textAlign="right"
            />
          </View>

          <TouchableOpacity
            style={styles.showPassRow}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.showPassText}>{showPassword ? 'إخفاء كلمات المرور' : 'إظهار كلمات المرور'}</Text>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleChangePassword}
            disabled={savingPassword}
          >
            {savingPassword ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>حفظ كلمة المرور الجديدة</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Legal & Support Links */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.navLinkRow}
            onPress={() => navigation.navigate('Terms')}
          >
            <Ionicons name="chevron-back" size={18} color="#8B94B7" />
            <Text style={styles.navLinkText}>شروط الاستخدام والضوابط الشرعية</Text>
            <Ionicons name="document-text-outline" size={20} color="#E91E63" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navLinkRow}
            onPress={() => navigation.navigate('Privacy')}
          >
            <Ionicons name="chevron-back" size={18} color="#8B94B7" />
            <Text style={styles.navLinkText}>سياسة الخصوصية وأمان البيانات</Text>
            <Ionicons name="shield-checkmark-outline" size={20} color="#0284C7" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navLinkRow}
            onPress={() => navigation.navigate('Contact')}
          >
            <Ionicons name="chevron-back" size={18} color="#8B94B7" />
            <Text style={styles.navLinkText}>اتصل بنا والدعم الفني</Text>
            <Ionicons name="headset-outline" size={20} color="#059669" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.88}>
          <Ionicons name="log-out-outline" size={20} color="#E11D48" style={{ marginLeft: 6 }} />
          <Text style={styles.logoutBtnText}>تسجيل الخروج من الحساب</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FE' },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F4F9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8F9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#2D1B4D' },
  content: { padding: 18, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  cardTitle: { fontSize: 15, fontWeight: '900', color: '#2D1B4D', textAlign: 'right', marginBottom: 14 },
  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FE',
  },
  infoKey: { fontSize: 12.5, fontWeight: '700', color: '#8B94B7' },
  infoVal: { fontSize: 13, fontWeight: '800', color: '#2D1B4D' },
  inputGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 12.5, fontWeight: '700', color: '#64748B', textAlign: 'right', marginBottom: 6 },
  input: {
    backgroundColor: '#F8F9FE',
    borderWidth: 1.5,
    borderColor: '#E8ECF4',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#2D1B4D',
    fontWeight: '700',
  },
  showPassRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginVertical: 10,
    justifyContent: 'flex-start',
  },
  showPassText: { fontSize: 12.5, fontWeight: '700', color: '#64748B' },
  saveBtn: {
    backgroundColor: '#E91E63',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 6,
    ...SHADOWS.glow,
  },
  saveBtnText: { fontSize: 14.5, fontWeight: '900', color: '#FFFFFF' },
  navLinkRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FE',
  },
  navLinkText: { flex: 1, fontSize: 13.5, fontWeight: '700', color: '#2D1B4D', textAlign: 'right', marginRight: 12 },
  logoutBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 4,
  },
  logoutBtnText: { fontSize: 14, fontWeight: '900', color: '#E11D48' },
});
