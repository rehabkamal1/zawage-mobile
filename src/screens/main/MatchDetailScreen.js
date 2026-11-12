import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/client';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function MatchDetailScreen({ route, navigation }) {
  const { partner: initialPartner, currentUser } = route.params || {};
  const [partner, setPartner] = useState(initialPartner || {});
  const [unlocking, setUnlocking] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const profile = partner.profile || {};
  const isMale = currentUser?.gender === 'male';

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
  const score = partner.match_percentage ?? null;

  const handleWhatsApp = () => {
    const phone = partner.phone || profile.guardian_phone;
    if (!phone) {
      Alert.alert('تنبيه', 'رقم الهاتف غير متاح حالياً.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone;
    const partnerName = profile.nickname || partner.name;
    const msg = encodeURIComponent(`السلام عليكم، بخصوص استمارة العروس (${partnerName}) في تطبيق نصفي الآخر وأريد التواصل معك.`);
    Linking.openURL(`https://wa.me/${fullPhone}?text=${msg}`).catch(() => {
      Alert.alert('خطأ', 'تعذر فتح تطبيق واتساب على هاتفك.');
    });
  };

  const handleUnlock = async () => {
    Alert.alert(
      'فك قفل بيانات التواصل',
      `هل تود فك قفل استمارة (${profile.nickname || partner.name}) للتواصل مع ولي الأمر عبر واتساب؟\nسيتم استهلاك 1 استمارة من رصيدك.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد وفك القفل',
          onPress: async () => {
            setUnlocking(true);
            try {
              const res = await api.unlockContact(partner.id);
              Alert.alert('تهانينا 🎉', res.message || 'تم فك القفل بنجاح، يمكنك الآن التواصل عبر واتساب.');
              setPartner(prev => ({ ...prev, is_unlocked: true, phone: res.phone || prev.phone }));
            } catch (err) {
              const msg = err.message || 'تعذر فك القفل';
              if (err.data?.requires_subscription || err.data?.limit_reached) {
                Alert.alert(
                  'انتهى الرصيد ⚠️',
                  msg,
                  [
                    { text: 'إلغاء', style: 'cancel' },
                    { text: 'الاشتراك في باقة الآن 🚀', onPress: () => navigation.navigate('SubscriptionsTab') }
                  ]
                );
              } else {
                Alert.alert('تنبيه', msg);
              }
            } finally {
              setUnlocking(false);
            }
          }
        }
      ]
    );
  };

  const handleSendReport = async () => {
    if (!reportReason.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة سبب البلاغ قبل الإرسال.');
      return;
    }
    setSubmittingReport(true);
    try {
      await api.sendReport(partner.id, reportReason.trim());
      setReportModalVisible(false);
      setReportReason('');
      Alert.alert(
        'تم إرسال البلاغ 🛡️',
        'شكراً لتعاونك وحرصك. ستقوم إدارة المنصة بمراجعة البلاغ وتفاصيل الاستمارة واتخاذ الإجراء اللازم فوراً.'
      );
    } catch (err) {
      Alert.alert('خطأ', err.message || 'تعذر إرسال البلاغ');
    } finally {
      setSubmittingReport(false);
    }
  };

  const profileFields = [
    { label: 'المحافظة', value: profile.governorate || 'غير محدد' },
    { label: 'المدينة / المركز', value: profile.area || 'غير محدد' },
    { label: 'الحالة الاجتماعية', value: profile.marital_status || 'غير محدد' },
    { label: 'السن', value: age ? `${age} سنة` : 'غير محدد' },
    { label: 'الوظيفة', value: profile.job || 'غير محدد' },
    { label: 'المؤهل الدراسي', value: profile.education || 'غير محدد' },
    { label: 'الطول والوزن', value: profile.height ? `${profile.height} سم • ${profile.weight || ''} كجم` : 'غير محدد' },
    { label: 'لون البشرة', value: profile.skin_tone || 'غير محدد' },
    { label: 'الالتزام بالصلاة', value: profile.prayer || 'غير محدد' },
    { label: partner.gender === 'female' ? 'الحجاب' : 'التدخين', value: (partner.gender === 'female' ? profile.hijab : profile.smoking) || 'غير محدد' },
    { label: 'الإنجاب / الأطفال', value: profile.has_children ? `لديه أطفال (${profile.children_count || 1})` : 'لا يوجد أطفال' },
    { label: 'الانتقال لمحافظة أخرى', value: profile.move_other_gov || 'حسب الاتفاق' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-forward" size={24} color="#2D1B4D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل الاستمارة</Text>
        <TouchableOpacity
          style={styles.reportHeaderBtn}
          onPress={() => setReportModalVisible(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="flag-outline" size={20} color="#E11D48" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card Center Avatar & Header (Matches Web Modal) */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="heart" size={44} color="#E91E63" />
          </View>
          <Text style={styles.partnerName}>
            {profile.nickname || partner.name}
            {age ? `، ${age} سنة` : ''}
          </Text>
          <Text style={styles.partnerSub}>
            {profile.marital_status || 'غير محدد'} • {profile.job || 'غير محدد'}
          </Text>

          {score !== null && score !== undefined && (
            <View style={styles.scorePill}>
              <Text style={styles.scoreValue}>{score}%</Text>
              <Text style={styles.scoreText}>نسبة التوافق</Text>
            </View>
          )}
        </View>

        {/* Profile Attributes Grid (Matches Web Modal Grid) */}
        <Text style={styles.sectionTitle}>المعلومات والمواصفات الشخصية</Text>
        <View style={styles.gridContainer}>
          {profileFields.map((field, index) => (
            <View key={index} style={styles.gridItem}>
              <Text style={styles.gridLabel}>{field.label}</Text>
              <Text style={styles.gridValue}>{field.value}</Text>
            </View>
          ))}
        </View>

        {/* Bio Quote Card */}
        {profile.bio ? (
          <View style={styles.quoteSection}>
            <Text style={styles.quoteTitle}>نبذة تعريفية</Text>
            <View style={styles.bioCard}>
              <Text style={styles.bioText}>{profile.bio}</Text>
            </View>
          </View>
        ) : null}

        {/* Partner Specs Quote Card */}
        {profile.partner_specs ? (
          <View style={styles.quoteSection}>
            <Text style={styles.quoteTitle}>المواصفات المطلوبة في الشريك</Text>
            <View style={styles.specsCard}>
              <Text style={styles.specsText}>{profile.partner_specs}</Text>
            </View>
          </View>
        ) : null}

        {/* Contact Action Box (Matches Web Modal) */}
        <View style={styles.contactContainer}>
          {partner.is_unlocked ? (
            <View>
              <View style={styles.unlockedBox}>
                <View style={styles.unlockedHeaderRow}>
                  <Ionicons name="lock-open" size={20} color="#25D366" />
                  <Text style={styles.unlockedHeaderText}>تم فك القفل — رقم ولي الأمر</Text>
                </View>
                <Text style={styles.unlockedPhone}>{partner.phone || profile.guardian_phone || 'متاح'}</Text>
              </View>

              <TouchableOpacity
                style={styles.whatsAppFullBtn}
                activeOpacity={0.88}
                onPress={handleWhatsApp}
              >
                <Ionicons name="logo-whatsapp" size={22} color="#FFFFFF" style={{ marginLeft: 8 }} />
                <Text style={styles.whatsAppFullBtnText}>تواصل مع ولي الأمر عبر واتساب</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.lockedBox}>
                <Ionicons name="lock-closed" size={24} color="#E91E63" style={{ marginBottom: 6 }} />
                <Text style={styles.lockedBoxText}>
                  رقم ولي الأمر مخفي — اضغط فك القفل للتواصل عبر واتساب
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleUnlock}
                disabled={unlocking}
                style={styles.unlockBtnWrapper}
              >
                <LinearGradient
                  colors={['#E91E63', '#FF85A2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.unlockFullBtn}
                >
                  <Ionicons name="lock-open-outline" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                  <Text style={styles.unlockFullBtnText}>
                    {unlocking ? 'جاري فك القفل...' : 'فك القفل والتواصل عبر واتساب'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
          {/* Report Button Link */}
          <TouchableOpacity
            style={styles.bottomReportLink}
            onPress={() => setReportModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="shield-alert-outline" size={17} color="#E11D48" style={{ marginLeft: 6 }} />
            <Text style={styles.bottomReportText}>إبلاغ إدارة المنصة عن مخالفة في هذه الاستمارة</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Report Modal */}
      <Modal
        visible={reportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                <Ionicons name="close-circle-outline" size={26} color="#8B94B7" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>إبلاغ عن استمارة</Text>
            </View>

            <Text style={styles.modalDesc}>
              يرجى توضيح سبب الإبلاغ عن استمارة ({profile.nickname || partner.name}) لمساعدة الإدارة في اتخاذ الإجراء الشرعي والنظامي المناسب:
            </Text>

            {/* Quick Reason Chips */}
            <View style={styles.chipsRow}>
              {['بيانات غير صحيحة', 'سلوك غير لائق', 'رقم وهمي', 'طلب أموال'].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, reportReason === item && styles.chipActive]}
                  onPress={() => setReportReason(item)}
                >
                  <Text style={[styles.chipText, reportReason === item && styles.chipTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="اكتب تفاصيل البلاغ هنا..."
              placeholderTextColor="#94A3B8"
              value={reportReason}
              onChangeText={setReportReason}
              multiline
              numberOfLines={4}
              textAlign="right"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setReportModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>إلغاء</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitReportBtn}
                onPress={handleSendReport}
                disabled={submittingReport}
              >
                {submittingReport ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitReportBtnText}>إرسال البلاغ الآن</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  topHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F4F9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FE',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#2D1B4D',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F4F9',
    ...SHADOWS.card,
  },
  avatarCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#FFF0F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  partnerName: {
    fontSize: 21,
    fontWeight: '900',
    color: '#2D1B4D',
    textAlign: 'center',
    marginBottom: 4,
  },
  partnerSub: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E91E63',
    textAlign: 'center',
    marginBottom: 10,
  },
  scorePill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    borderWidth: 1,
    borderColor: '#FBCFE8',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#E91E63',
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B94B7',
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#2D1B4D',
    textAlign: 'right',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  gridContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F4F9',
    alignItems: 'flex-end',
    ...SHADOWS.small,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B94B7',
    marginBottom: 3,
  },
  gridValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2D1B4D',
    textAlign: 'right',
  },
  quoteSection: {
    marginBottom: 18,
  },
  quoteTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#2D1B4D',
    textAlign: 'right',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  bioCard: {
    backgroundColor: '#FFF9FB',
    borderWidth: 1,
    borderColor: '#FFE6EE',
    borderRadius: 18,
    padding: 16,
  },
  bioText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#4C3A7A',
    textAlign: 'right',
    lineHeight: 22,
  },
  specsCard: {
    backgroundColor: '#F9FFF9',
    borderWidth: 1,
    borderColor: '#E6FFE6',
    borderRadius: 18,
    padding: 16,
  },
  specsText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#166534',
    textAlign: 'right',
    lineHeight: 22,
  },
  contactContainer: {
    marginTop: 10,
  },
  unlockedBox: {
    backgroundColor: '#F0FFF4',
    borderWidth: 1.5,
    borderColor: '#C6F6D5',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  unlockedHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  unlockedHeaderText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  unlockedPhone: {
    fontSize: 19,
    fontWeight: '900',
    color: '#2D1B4D',
  },
  whatsAppFullBtn: {
    backgroundColor: '#25D366',
    borderRadius: 18,
    paddingVertical: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  whatsAppFullBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  lockedBox: {
    backgroundColor: '#FFF9FB',
    borderWidth: 1.5,
    borderColor: '#FFE6EE',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  lockedBoxText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  unlockBtnWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  unlockFullBtn: {
    paddingVertical: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glow,
  },
  unlockFullBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  reportHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F2',
  },
  bottomReportLink: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  bottomReportText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#E11D48',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    width: '100%',
    maxWidth: 400,
    ...SHADOWS.card,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#2D1B4D',
  },
  modalDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: '#64748B',
    textAlign: 'right',
    marginBottom: 14,
  },
  chipsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    backgroundColor: '#F8F9FE',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: '#FFF1F2',
    borderColor: '#E11D48',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#E11D48',
    fontWeight: '800',
  },
  modalInput: {
    backgroundColor: '#F8F9FE',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
    fontSize: 13.5,
    color: '#2D1B4D',
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#64748B',
  },
  submitReportBtn: {
    flex: 2,
    backgroundColor: '#E11D48',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitReportBtnText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
