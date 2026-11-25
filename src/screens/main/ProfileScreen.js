import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatProfileValue } from '../../utils/formatProfileValue';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function ProfileScreen({ navigation }) {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(authUser);
  const [loading, setLoading] = useState(!authUser);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await api.getMe();
      if (res.user) {
        setUser(res.user);
      }
    } catch (e) {
      console.log('Error fetching user profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const profile = user?.profile || {};
  const isFemale = user?.gender === 'female';

  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(profile.dob);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E91E63" />
        <Text style={styles.loadingText}>جاري تحميل الملف الشخصي...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        {navigation.canGoBack() && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-forward" size={22} color="#2D1B4D" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>ملفي الشخصي</Text>
        <TouchableOpacity
          style={styles.editHeaderBtn}
          onPress={() => navigation.navigate('EditProfile')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="create" size={22} color="#E91E63" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Summary Card (Matches Web Profile Sidebar Card) */}
        <View style={styles.summaryCard}>
          <View style={[styles.avatarCircle, isFemale ? styles.femaleAvatar : styles.maleAvatar]}>
            <Ionicons name={isFemale ? 'woman' : 'man'} size={48} color="#FFFFFF" />
          </View>

          <Text style={styles.nameText}>{profile.nickname || user?.name || 'مستخدم نصفي الآخر'}</Text>
          <Text style={styles.roleText}>
            {isFemale ? 'عروسة' : 'عريس'}{age ? ` • ${age} سنة` : ''}
          </Text>

          <View style={styles.tagsRow}>
            {profile.job ? (
              <View style={styles.metaTag}>
                <Ionicons name="briefcase" size={13} color="#E91E63" style={{ marginLeft: 4 }} />
                <Text style={styles.metaTagText}>{formatProfileValue(profile.job)}</Text>
              </View>
            ) : null}
            {profile.governorate ? (
              <View style={styles.metaTag}>
                <Ionicons name="location" size={13} color="#0284C7" style={{ marginLeft: 4 }} />
                <Text style={styles.metaTagText}>{formatProfileValue(profile.governorate)}</Text>
              </View>
            ) : null}
            {profile.marital_status ? (
              <View style={styles.metaTag}>
                <Ionicons name="heart" size={13} color="#8B5CF6" style={{ marginLeft: 4 }} />
                <Text style={styles.metaTagText}>{formatProfileValue(profile.marital_status)}</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.88}
          >
            <Ionicons name="create" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
            <Text style={styles.editProfileBtnText}>تعديل الاستمارة ✏️</Text>
          </TouchableOpacity>
        </View>

        {/* Section 1: Bio (نبذة عني) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="star" size={20} color="#E91E63" style={{ marginLeft: 8 }} />
            <Text style={styles.sectionHeaderTitle}>نبذة عني</Text>
          </View>
          <Text style={styles.bioText}>
            {profile.bio || 'لا توجد نبذة حالياً. يمكنك تعديل استمارتك لإضافة نبذة تعريفية.'}
          </Text>
        </View>

        {/* Section 2: Location & Housing (الموقع والسكن) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="location" size={20} color="#0284C7" style={{ marginLeft: 8 }} />
            <Text style={styles.sectionHeaderTitle}>الموقع والسكن</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{formatProfileValue(profile.governorate, 'غير محدد')}</Text>
            <Text style={styles.infoLabel}>المحافظة:</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{formatProfileValue(profile.area, 'غير محدد')}</Text>
            <Text style={styles.infoLabel}>المدينة / المركز:</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>
              {profile.family_house === 'yes' || profile.family_house === true ? 'نعم (بيت عائلة)' : 'شقة مستقلة'}
            </Text>
            <Text style={styles.infoLabel}>السكن:</Text>
          </View>
          {!isFemale && profile.accommodation && (
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{formatProfileValue(profile.accommodation)}</Text>
              <Text style={styles.infoLabel}>نوع السكن:</Text>
            </View>
          )}
        </View>

        {/* Section 3: Education & Work (التعليم والعمل) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="school" size={20} color="#8B5CF6" style={{ marginLeft: 8 }} />
            <Text style={styles.sectionHeaderTitle}>التعليم والعمل والالتزام</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{formatProfileValue(profile.education, 'غير محدد')}</Text>
            <Text style={styles.infoLabel}>المؤهل الدراسي:</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{formatProfileValue(profile.job, 'غير محدد')}</Text>
            <Text style={styles.infoLabel}>الوظيفة / العمل:</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{formatProfileValue(profile.prayer, 'غير محدد')}</Text>
            <Text style={styles.infoLabel}>الالتزام بالصلاة:</Text>
          </View>
          {isFemale && profile.hijab && (
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{formatProfileValue(profile.hijab)}</Text>
              <Text style={styles.infoLabel}>نوع الحجاب:</Text>
            </View>
          )}
          {!isFemale && profile.smoking && (
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{formatProfileValue(profile.smoking)}</Text>
              <Text style={styles.infoLabel}>الموقف من التدخين:</Text>
            </View>
          )}
        </View>

        {/* Section 4: Partner Specs (شريك الحياة المطلوب) */}
        <View style={[styles.sectionCard, styles.partnerSpecsCard]}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="heart" size={20} color="#E91E63" style={{ marginLeft: 8 }} />
            <Text style={styles.sectionHeaderTitle}>شريك الحياة المطلوب</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>
              {profile.req_age_min ? `من ${profile.req_age_min} إلى ${profile.req_age_max || 60} سنة` : 'غير محدد'}
            </Text>
            <Text style={styles.infoLabel}>السن المطلوب:</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{formatProfileValue(profile.req_governorate, 'الكل')}</Text>
            <Text style={styles.infoLabel}>المحافظة المطلوبة:</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{formatProfileValue(profile.req_marital_status, 'لا يهم / الكل')}</Text>
            <Text style={styles.infoLabel}>الحالة الاجتماعية:</Text>
          </View>

          <Text style={styles.partnerSpecsText}>
            {profile.partner_specs || 'لم يتم تحديد مواصفات إضافية بعد. يمكنك تعديل استمارتك وتوضيح تطلعاتك للشريك.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFD',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFD',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#8B94B7',
  },
  topHeader: {
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
  editHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#F1F4F9',
    ...SHADOWS.medium,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    ...SHADOWS.small,
  },
  maleAvatar: {
    backgroundColor: '#0284C7',
  },
  femaleAvatar: {
    backgroundColor: '#E91E63',
  },
  nameText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#2D1B4D',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B94B7',
    marginBottom: 14,
  },
  tagsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 18,
  },
  metaTag: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  metaTagText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  editProfileBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E91E63',
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 25,
    width: '100%',
    ...SHADOWS.small,
  },
  editProfileBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F4F9',
    ...SHADOWS.small,
  },
  partnerSpecsCard: {
    backgroundColor: '#FFF9FB',
    borderColor: '#FFD7E5',
    borderWidth: 1.5,
  },
  sectionHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    paddingBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2D1B4D',
  },
  bioText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4C3A7A',
    lineHeight: 24,
    textAlign: 'right',
    backgroundColor: '#FDFBFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F4F9',
  },
  partnerSpecsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4C3A7A',
    lineHeight: 24,
    textAlign: 'right',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#FFE4E6',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8B94B7',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2D1B4D',
  },
});
