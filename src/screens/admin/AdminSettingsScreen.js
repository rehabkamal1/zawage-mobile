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
import { APP_CONFIG } from '../../constants/config';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function AdminSettingsScreen({ navigation }) {
  const { user, isSuperAdmin, logout } = useAuth();
  const [phoneToPromote, setPhoneToPromote] = useState('');
  const [promoting, setPromoting] = useState(false);

  const handlePromote = async () => {
    const cleanPhone = phoneToPromote.trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      Alert.alert('تنبيه', 'يرجى إدخال رقم هاتف صحيح ومسجل للمستخدم المراد ترقيته.');
      return;
    }

    setPromoting(true);
    try {
      const res = await api.promoteByPhone(cleanPhone);
      Alert.alert('تمت الترقية بنجاح 🛡️', res.message || 'تمت ترقية الحساب إلى مشرف بنجاح!');
      setPhoneToPromote('');
    } catch (e) {
      Alert.alert('تعذر الترقية', e.message || 'لم يتم العثور على حساب مسجل بهذا الرقم.');
    } finally {
      setPromoting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>إعدادات المنصة والإدارة</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Admin Profile Card */}
        <View style={styles.card}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarBox}>
              <Ionicons name="shield-checkmark" size={32} color="#E91E63" />
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.adminName}>{user?.name}</Text>
              <Text style={styles.adminRole}>
                {isSuperAdmin ? '👑 مدير عام (Super Admin)' : '🛡️ مشرف معتمد (Admin)'}
              </Text>
              <Text style={styles.adminPhone}>{user?.phone || user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Super Admin: Promote User by Phone */}
        {isSuperAdmin && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>ترقية عضو إلى مشرف (Admin) بالهاتف</Text>
            <Text style={styles.cardSubtitle}>
              يمكنك ترقية أي مستخدم مسجل في المنصة ليصبح مشرفاً فورياً بمجرد إدخال رقم هاتفه:
            </Text>

            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color="#8B94B7" style={{ marginLeft: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="رقم الهاتف (مثال: 01012345678)"
                placeholderTextColor="#94A3B8"
                value={phoneToPromote}
                onChangeText={setPhoneToPromote}
                keyboardType="phone-pad"
                textAlign="right"
              />
            </View>

            <TouchableOpacity
              style={styles.promoteBtn}
              onPress={handlePromote}
              disabled={promoting}
            >
              {promoting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="arrow-up-circle-outline" size={19} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  <Text style={styles.promoteBtnText}>ترقية الحساب الآن</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* System Settings & Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>إعدادات النظام والتحويل</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoVal}>{APP_CONFIG.VODAFONE_CASH_NUMBER}</Text>
            <Text style={styles.infoKey}>محفظة فودافون كاش:</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoVal}>50 ج.م (يومية) / 100 ج.م (أسبوعية) / 300 ج.م (شهرية)</Text>
            <Text style={styles.infoKey}>أسعار الباقات:</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoVal}>{APP_CONFIG.FREE_VIEWS_LIMIT} استعراضات مجانية</Text>
            <Text style={styles.infoKey}>الرصيد المجاني للعضو:</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoVal}>https://mynosfi.com/api</Text>
            <Text style={styles.infoKey}>سيرفر الـ API المتصل به:</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.88}>
          <Ionicons name="log-out-outline" size={20} color="#E11D48" style={{ marginLeft: 6 }} />
          <Text style={styles.logoutBtnText}>تسجيل الخروج من لوحة الإدارة</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FE' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F4F9',
    alignItems: 'center',
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
  profileHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  avatarBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#FFF0F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
  },
  profileDetails: { flex: 1, alignItems: 'flex-end' },
  adminName: { fontSize: 17, fontWeight: '900', color: '#2D1B4D' },
  adminRole: { fontSize: 12.5, fontWeight: '700', color: '#E91E63', marginTop: 3 },
  adminPhone: { fontSize: 12, fontWeight: '600', color: '#64748B', marginTop: 2 },
  cardTitle: { fontSize: 15, fontWeight: '900', color: '#2D1B4D', textAlign: 'right', marginBottom: 6 },
  cardSubtitle: { fontSize: 12.5, lineHeight: 18, color: '#64748B', textAlign: 'right', marginBottom: 14 },
  inputWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#F8F9FE',
    borderWidth: 1.5,
    borderColor: '#E8ECF4',
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 48,
    marginBottom: 12,
  },
  input: { flex: 1, paddingVertical: 10, fontSize: 13.5, fontWeight: '700', color: '#2D1B4D', textAlign: 'right' },
  promoteBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D1B4D',
    borderRadius: 14,
    paddingVertical: 12,
  },
  promoteBtnText: { fontSize: 14, fontWeight: '900', color: '#FFFFFF' },
  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FE',
  },
  infoKey: { fontSize: 12.5, fontWeight: '700', color: '#8B94B7' },
  infoVal: { fontSize: 12.5, fontWeight: '800', color: '#2D1B4D', flex: 1, textAlign: 'left' },
  switchMemberBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  switchMemberBtnText: { fontSize: 13.5, fontWeight: '800', color: '#3730A3' },
  logoutBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 8,
  },
  logoutBtnText: { fontSize: 14, fontWeight: '900', color: '#E11D48' },
});
