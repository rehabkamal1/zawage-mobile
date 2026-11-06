import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/client';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function MatchDetailScreen({ route, navigation }) {
  const { partner } = route.params || {};
  const profile = partner?.profile || {};
  const isFemale = partner?.gender === 'female';

  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingContact, setLoadingContact] = useState(false);

  const calculateAge = (dob) => {
    if (!dob) return '-';
    const diff = Date.now() - new Date(dob).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const handleToggleFavorite = async () => {
    try {
      await api.toggleFavorite(partner.id);
      setIsFavorite(!isFavorite);
    } catch (_) {}
  };

  const handleRequestContact = () => {
    Alert.alert(
      'طلب رقم التواصل',
      isFemale
        ? `هل تود طلب بيانات التواصل مع ولي أمر [${profile.nickname || partner.name}]؟`
        : `هل تود طلب رقم التواصل مع [${profile.nickname || partner.name}]؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'نعم، إرسال الطلب',
          onPress: () => {
            Alert.alert('تم استلام طلبك! 🎉', 'سيتم إشعار الإدارة وولي الأمر للتواصل وفق الضوابط الشرعية.');
          },
        },
      ]
    );
  };

  const handleReport = () => {
    Alert.alert(
      'إبلاغ عن الاستمارة',
      'هل ترغب في تقديم بلاغ ضد هذه الاستمارة في حال وجود بيانات غير صحيحة أو مخالفة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'نعم، إبلاغ',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.sendReport(partner.id, 'بيانات غير صحيحة / مخالفة');
              Alert.alert('شكراً لتعاونك', 'تم تسجيل البلاغ وستتم مراجعته من قِبل إدارة المنصة فوراً.');
            } catch (e) {
              Alert.alert('خطأ', e.message || 'تعذر إرسال البلاغ');
            }
          },
        },
      ]
    );
  };

  const SpecItem = ({ label, value, icon }) => (
    <View style={styles.specItem}>
      <Text style={styles.specValue}>{value || '-'}</Text>
      <View style={styles.specLabelRow}>
        <Text style={styles.specLabel}>{label}</Text>
        {icon && <Ionicons name={icon} size={16} color={COLORS.primary} style={{ marginLeft: 6 }} />}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={handleReport}>
          <Ionicons name="flag-outline" size={20} color={COLORS.danger} />
        </TouchableOpacity>

        <Text style={styles.topBarTitle}>تفاصيل الاستمارة</Text>

        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-forward" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header Banner */}
        <View style={styles.bannerCard}>
          <View style={[styles.avatarBig, isFemale ? styles.femaleAvatar : styles.maleAvatar]}>
            <Ionicons name={isFemale ? 'woman' : 'man'} size={44} color="#FFFFFF" />
          </View>

          <Text style={styles.profileName}>{profile.nickname || partner?.name}</Text>
          <Text style={styles.profileId}>كود الاستمارة: #{partner?.id}</Text>

          <View style={styles.quickChips}>
            <View style={styles.quickChip}>
              <Ionicons name="location" size={13} color={COLORS.primary} />
              <Text style={styles.quickChipText}>{profile.governorate || 'مصر'}</Text>
            </View>
            <View style={styles.quickChip}>
              <Ionicons name="calendar" size={13} color={COLORS.primary} />
              <Text style={styles.quickChipText}>{calculateAge(profile.dob)} سنة</Text>
            </View>
            <View style={styles.quickChip}>
              <Ionicons name="ribbon" size={13} color={COLORS.primary} />
              <Text style={styles.quickChipText}>{profile.marital_status || 'أعزب'}</Text>
            </View>
          </View>
        </View>

        {/* Bio Quote */}
        {profile.bio ? (
          <View style={styles.bioCard}>
            <Text style={styles.sectionTitle}>نبذة شخصية</Text>
            <Text style={styles.bioText}>"{profile.bio}"</Text>
          </View>
        ) : null}

        {/* Personal Specs Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>المواصفات الشخصية</Text>
          <SpecItem label="العمر" value={`${calculateAge(profile.dob)} سنة`} icon="calendar-outline" />
          <SpecItem label="الطول" value={profile.height ? `${profile.height} سم` : '-'} icon="resize-outline" />
          <SpecItem label="الوزن" value={profile.weight ? `${profile.weight} كجم` : '-'} icon="barbell-outline" />
          <SpecItem label="لون البشرة" value={profile.skin_tone} icon="color-palette-outline" />
          <SpecItem label="الحالة الاجتماعية" value={profile.marital_status} icon="heart-outline" />
          <SpecItem label="المحافظة والمنطقة" value={`${profile.governorate || ''} ${profile.area ? `- ${profile.area}` : ''}`} icon="map-outline" />
          <SpecItem label="طبيعة السكن" value={profile.accommodation} icon="home-outline" />
        </View>

        {/* Education & Job Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>التعليم والعمل</Text>
          <SpecItem label="المؤهل الدراسي" value={profile.education} icon="school-outline" />
          <SpecItem label="الوظيفة / العمل" value={profile.job} icon="briefcase-outline" />
          <SpecItem label="مستوى الدخل" value={profile.income} icon="cash-outline" />
        </View>

        {/* Religious Commitment */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>الالتزام الديني</Text>
          <SpecItem label="المحافظة على الصلاة" value={profile.prayer} icon="sparkles-outline" />
          {isFemale && <SpecItem label="الحجاب / النقاب" value={profile.hijab} icon="shield-checkmark-outline" />}
          <SpecItem label="التدخين" value={profile.smoking} icon="alert-circle-outline" />
          <SpecItem label="أي أمراض مزمنة" value={profile.diseases || 'لا يوجد'} icon="medkit-outline" />
        </View>

        {/* Partner Specifications */}
        {profile.partner_specs || profile.req_governorate ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>المواصفات المطلوبة في شريك الحياة</Text>
            {profile.req_age_min && (
              <SpecItem label="السن المطلوب" value={`من ${profile.req_age_min} إلى ${profile.req_age_max || '+'} سنة`} />
            )}
            {profile.req_governorate && <SpecItem label="المحافظة المطلوبة" value={profile.req_governorate} />}
            {profile.req_education && <SpecItem label="المؤهل المطلوب" value={profile.req_education} />}
            {profile.partner_specs ? (
              <Text style={[styles.bioText, { marginTop: 10 }]}>"{profile.partner_specs}"</Text>
            ) : null}
          </View>
        ) : null}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Bottom Action Bar */}
      <View style={styles.floatingActionBar}>
        <TouchableOpacity
          style={styles.favBottomBtn}
          onPress={handleToggleFavorite}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? COLORS.primary : COLORS.textMuted}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactBtn}
          onPress={handleRequestContact}
        >
          <Ionicons name="call" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
          <Text style={styles.contactBtnText}>
            {isFemale ? 'طلب رقم ولي الأمر' : 'طلب رقم التواصل'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  bannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
    ...SHADOWS.small,
  },
  avatarBig: {
    width: 86,
    height: 86,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  maleAvatar: {
    backgroundColor: COLORS.male,
  },
  femaleAvatar: {
    backgroundColor: COLORS.female,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  profileId: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 12,
  },
  quickChips: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  quickChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  bioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    ...SHADOWS.small,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.secondary,
    textAlign: 'right',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    paddingBottom: 8,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  specLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  specValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.text,
  },
  bioText: {
    fontSize: 13.5,
    color: COLORS.text,
    textAlign: 'right',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  floatingActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    ...SHADOWS.medium,
  },
  favBottomBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  contactBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  contactBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
