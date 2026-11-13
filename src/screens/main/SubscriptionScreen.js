import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/client';
import { APP_CONFIG } from '../../constants/config';
import { COLORS, SHADOWS } from '../../constants/theme';

const VODAFONE_CASH_NUMBER = APP_CONFIG.VODAFONE_CASH_NUMBER;

const PLANS = [
  {
    id: 'daily',
    title: 'باقة يومية',
    price: '50',
    duration: 'صلاحية 24 ساعة',
    views: '3 استمارات تواصل',
    badge: 'الأكثر توفيراً',
    popular: false,
  },
  {
    id: 'weekly',
    title: 'باقة أسبوعية',
    price: '100',
    duration: 'صلاحية 7 أيام',
    views: '7 استمارات تواصل',
    badge: 'الأكثر طلباً ⭐',
    popular: true,
  },
  {
    id: 'monthly',
    title: 'باقة شهرية',
    price: '300',
    duration: 'صلاحية 30 يوماً',
    views: '25 استمارة تواصل',
    badge: 'باقة مميزة 👑',
    popular: false,
  },
];

export default function SubscriptionScreen({ navigation }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('weekly');
  const [senderWallet, setSenderWallet] = useState('');
  const [receiptImage, setReceiptImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await api.getMe();
      if (res.user) {
        setCurrentUser(res.user);
      }
    } catch (e) {
      console.log('Error fetching user info', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('صلاحية الوصول', 'يرجى السماح بالوصول لمعرض الصور لإرفاق إيصال التحويل.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setReceiptImage(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('خطأ', 'تعذر فتح معرض الصور');
    }
  };

  const handleSubmitTransfer = async () => {
    if (!receiptImage) {
      Alert.alert('تنبيه', 'يرجى إرفاق صورة (سكرين شوت) إيصال التحويل أولاً.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('type', selectedPlan);
      if (senderWallet.trim()) {
        formData.append('sender_wallet_number', senderWallet.trim());
      }

      const filename = receiptImage.split('/').pop() || 'receipt.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1].toLowerCase() : 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

      formData.append('receipt_image', {
        uri: receiptImage,
        name: filename,
        type: mimeType,
      });

      const res = await api.submitManualTransfer(formData, true);

      Alert.alert(
        'تم إرسال إيصال التحويل بنجاح 🎉',
        res.message || 'طلبك الآن قيد المراجعة والتدقيق من قبل الإدارة، وسيتم تفعيل رصيدك فور مراجعة التحويل.'
      );

      setReceiptImage(null);
      setSenderWallet('');
      fetchUserData();
    } catch (err) {
      Alert.alert('خطأ في إرسال الإيصال', err.message || 'يرجى التأكد من اتصال الإنترنت والمحاولة مجدداً.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsAppSupport = (planId) => {
    const plan = PLANS.find(p => p.id === planId) || PLANS[1];
    const userPhone = currentUser?.phone || '';
    const userName = currentUser?.profile?.nickname || currentUser?.name || '';
    const text = encodeURIComponent(
      `السلام عليكم، قمت بتحويل مبلغ ${plan.price} جنيهاً عبر فودافون كاش للاشتراك في (${plan.title}) في تطبيق نصفي الآخر.\nالاسم: ${userName}\nرقم الهاتف المسجل: ${userPhone}`
    );
    Linking.openURL(`https://wa.me/201017961150?text=${text}`).catch(() => {
      Alert.alert('خطأ', 'تعذر فتح واتساب.');
    });
  };

  const activeSub = currentUser?.active_subscription;
  const isPendingReview = currentUser?.latest_payment?.status === 'pending';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>باقات واشتراكات نصفي الآخر</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Pending Review Banner */}
        {isPendingReview && (
          <View style={styles.pendingCard}>
            <View style={styles.pendingIconBox}>
              <Ionicons name="time" size={24} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingCardTitle}>طلب التحويل قيد المراجعة حالياً ⏳</Text>
              <Text style={styles.pendingCardText}>
                قمت بإرسال إيصال التحويل وجاري تدقيقه من إدارة المنصة لتفعيل باقتك فوراً.
              </Text>
            </View>
          </View>
        )}

        {/* Active Subscription Banner */}
        {activeSub && (
          <View style={styles.activeCard}>
            <View style={styles.activeHeaderRow}>
              <View style={styles.crownCircle}>
                <Text style={{ fontSize: 22 }}>👑</Text>
              </View>
              <View style={styles.activeTextCol}>
                <Text style={styles.activePlanName}>
                  {activeSub.type === 'daily' ? 'باقة يومية مفعلة' : activeSub.type === 'weekly' ? 'باقة أسبوعية مفعلة' : 'باقة شهرية مفعلة'}
                </Text>
                <Text style={styles.activeExpiry}>
                  تنتهي في: {new Date(activeSub.expires_at).toLocaleDateString('ar-EG')}
                </Text>
              </View>
            </View>

            <View style={styles.viewsRemainingRow}>
              <Text style={styles.viewsRemainingLabel}>رصيد التواصل المتبقي:</Text>
              <Text style={styles.viewsRemainingCount}>
                {Math.max(0, (activeSub.views_allowed || 0) - (activeSub.views_used || 0))} استمارة
              </Text>
            </View>
          </View>
        )}

        {/* Free Tier Remaining Status */}
        {!activeSub && (
          <View style={styles.freeCard}>
            <Text style={styles.freeCardTitle}>🎁 رصيدك المجاني الحالي</Text>
            <Text style={styles.freeCardText}>
              متبقي لك{' '}
              <Text style={{ color: '#BE123C', fontWeight: '900' }}>
                {currentUser?.free_views_remaining ?? 3} من أصل 3 استمارات مجانية
              </Text>{' '}
              مدى الحياة. بعد استنفاذها يمكنك الاشتراك بأي باقة لمتابعة التواصل مع العرايس.
            </Text>
          </View>
        )}

        {/* Plans Selector */}
        <Text style={styles.sectionHeading}>اختر الباقة المناسبة لك</Text>

        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          return (
            <TouchableOpacity
              key={plan.id}
              activeOpacity={0.9}
              style={[styles.planCard, isSelected && styles.planCardActive]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              {plan.badge ? (
                <View style={[styles.planBadge, isSelected && styles.planBadgeActive]}>
                  <Text style={[styles.planBadgeText, isSelected && styles.planBadgeTextActive]}>
                    {plan.badge}
                  </Text>
                </View>
              ) : null}

              <View style={styles.planHeaderRow}>
                <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>

                <View style={styles.planTitleCol}>
                  <Text style={styles.planTitle}>{plan.title}</Text>
                  <Text style={styles.planDuration}>{plan.duration}</Text>
                </View>

                <View style={styles.planPriceCol}>
                  <Text style={styles.planPriceNum}>{plan.price}</Text>
                  <Text style={styles.planCurrency}>جنيه</Text>
                </View>
              </View>

              <View style={styles.planDivider} />

              <View style={styles.planBenefitRow}>
                <Ionicons name="checkmark-circle" size={18} color="#25D366" />
                <Text style={styles.planBenefitText}>رؤية وفك قفل حتى {plan.views}</Text>
              </View>
              <View style={styles.planBenefitRow}>
                <Ionicons name="checkmark-circle" size={18} color="#25D366" />
                <Text style={styles.planBenefitText}>تواصل مباشر عبر واتساب مع أولياء الأمور</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Payment & Receipt Upload Card (Matches Web Subscribe.jsx) */}
        <View style={styles.uploadCard}>
          <Text style={styles.cardHeaderTitle}>طريقة الدفع وتفعيل الباقة</Text>

          {/* Step 1: Cash Wallet */}
          <Text style={styles.stepTitleText}>1. قم بتحويل قيمة الباقة إلى محفظة فودافون كاش التالية:</Text>
          <View style={styles.numberBox}>
            <Text style={styles.vodaNumber}>{VODAFONE_CASH_NUMBER}</Text>
            <TouchableOpacity
              style={styles.copyBtn}
              onPress={() => {
                Alert.alert('تم النسخ', `تم نسخ الرقم (${VODAFONE_CASH_NUMBER}) بنجاح`);
              }}
            >
              <Ionicons name="copy-outline" size={18} color="#E91E63" />
              <Text style={styles.copyBtnText}>نسخ الرقم</Text>
            </TouchableOpacity>
          </View>

          {/* Step 2: Sender Wallet Number */}
          <Text style={styles.stepTitleText}>2. أدخل رقم المحفظة التي قمت بالتحويل منها (اختياري):</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="call-outline" size={19} color="#8B94B7" style={{ marginLeft: 8 }} />
            <TextInput
              style={styles.input}
              placeholder="مثال: 01012345678"
              placeholderTextColor="#94A3B8"
              value={senderWallet}
              onChangeText={setSenderWallet}
              keyboardType="phone-pad"
              textAlign="right"
            />
          </View>

          {/* Step 3: Receipt Screenshot Upload */}
          <Text style={styles.stepTitleText}>3. ارفع صورة إيصال التحويل (Screenshot) * :</Text>

          {receiptImage ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: receiptImage }} style={styles.receiptPreviewImage} resizeMode="cover" />
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => setReceiptImage(null)}
              >
                <Ionicons name="trash-outline" size={17} color="#E11D48" style={{ marginLeft: 4 }} />
                <Text style={styles.removeImageText}>حذف الصورة وتغييرها</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadDropZone} onPress={handlePickImage} activeOpacity={0.8}>
              <Ionicons name="cloud-upload-outline" size={40} color="#E91E63" style={{ marginBottom: 8 }} />
              <Text style={styles.uploadDropTitle}>اضغط هنا لاختيار صورة الإيصال (سكرين شوت)</Text>
              <Text style={styles.uploadDropSubtitle}>يدعم صور PNG, JPG حتى 5 ميجابايت</Text>
            </TouchableOpacity>
          )}

          {/* Submit Receipt Button */}
          <TouchableOpacity
            style={styles.submitReceiptBtn}
            onPress={handleSubmitTransfer}
            disabled={submitting}
            activeOpacity={0.88}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="arrow-up-circle-outline" size={21} color="#FFFFFF" style={{ marginLeft: 6 }} />
                <Text style={styles.submitReceiptBtnText}>إرسال إيصال التحويل لتفعيل الباقة الآن 🚀</Text>
              </>
            )}
          </TouchableOpacity>

          {/* WhatsApp Direct Alternative */}
          <View style={styles.whatsappDividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.orText}>أو</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.whatsAppSubmitBtn}
            activeOpacity={0.88}
            onPress={() => handleWhatsAppSupport(selectedPlan)}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" style={{ marginLeft: 6 }} />
            <Text style={styles.whatsAppSubmitBtnText}>تأكيد التحويل ومراسلة الدعم عبر واتساب</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FE' },
  topHeader: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F4F9',
  },
  headerTitle: { fontSize: 17.5, fontWeight: '900', color: '#2D1B4D' },
  scrollContent: { padding: 16, paddingBottom: 40 },

  pendingCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 16,
    ...SHADOWS.small,
  },
  pendingIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  pendingCardTitle: { fontSize: 14.5, fontWeight: '900', color: '#92400E', textAlign: 'right' },
  pendingCardText: { fontSize: 12, color: '#B45309', textAlign: 'right', marginTop: 3, lineHeight: 18 },

  activeCard: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
    borderColor: '#F3C4D8',
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    ...SHADOWS.small,
  },
  activeHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  crownCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTextCol: { flex: 1, alignItems: 'flex-end' },
  activePlanName: { fontSize: 16, fontWeight: '900', color: '#7E22CE' },
  activeExpiry: { fontSize: 12.5, fontWeight: '600', color: '#6B7280', marginTop: 2 },
  viewsRemainingRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
  },
  viewsRemainingLabel: { fontSize: 13, fontWeight: '700', color: '#4B5563' },
  viewsRemainingCount: { fontSize: 14, fontWeight: '900', color: '#E91E63' },

  freeCard: {
    backgroundColor: '#FFF0F5',
    borderWidth: 1.5,
    borderColor: '#FBCFE8',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    ...SHADOWS.small,
  },
  freeCardTitle: { fontSize: 15, fontWeight: '900', color: '#BE123C', textAlign: 'right', marginBottom: 4 },
  freeCardText: { fontSize: 13, lineHeight: 20, color: '#475569', textAlign: 'right', fontWeight: '600' },

  sectionHeading: { fontSize: 16, fontWeight: '900', color: '#2D1B4D', textAlign: 'right', marginBottom: 12 },

  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#F1F4F9',
    ...SHADOWS.card,
  },
  planCardActive: { borderColor: '#E91E63', backgroundColor: '#FFFDFE' },
  planBadge: {
    position: 'absolute',
    top: -11,
    left: 20,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 20,
  },
  planBadgeActive: { backgroundColor: '#E91E63' },
  planBadgeText: { fontSize: 11, fontWeight: '800', color: '#64748B' },
  planBadgeTextActive: { color: '#FFFFFF' },
  planHeaderRow: { flexDirection: 'row-reverse', alignItems: 'center' },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  radioCircleActive: { borderColor: '#E91E63' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#E91E63' },
  planTitleCol: { flex: 1, alignItems: 'flex-end' },
  planTitle: { fontSize: 16, fontWeight: '900', color: '#2D1B4D' },
  planDuration: { fontSize: 12, fontWeight: '600', color: '#64748B', marginTop: 2 },
  planPriceCol: { alignItems: 'flex-start' },
  planPriceNum: { fontSize: 24, fontWeight: '900', color: '#E91E63' },
  planCurrency: { fontSize: 11, fontWeight: '700', color: '#8B94B7', marginTop: -4 },
  planDivider: { height: 1, backgroundColor: '#F8F9FE', marginVertical: 12 },
  planBenefitRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 6 },
  planBenefitText: { fontSize: 13, fontWeight: '700', color: '#475569', marginRight: 8 },

  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: '#F1F4F9',
    ...SHADOWS.card,
  },
  cardHeaderTitle: { fontSize: 16.5, fontWeight: '900', color: '#2D1B4D', textAlign: 'right', marginBottom: 12 },
  stepTitleText: { fontSize: 13, fontWeight: '800', color: '#2D1B4D', textAlign: 'right', marginBottom: 8, marginTop: 6 },
  numberBox: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    borderWidth: 1.5,
    borderColor: '#FCE7F3',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },
  vodaNumber: { fontSize: 19, fontWeight: '900', color: '#E91E63', letterSpacing: 1 },
  copyBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FBCFE8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  copyBtnText: { fontSize: 12, fontWeight: '800', color: '#E91E63' },

  inputWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#F8F9FE',
    borderWidth: 1.5,
    borderColor: '#E8ECF4',
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 14,
    minHeight: 48,
  },
  input: { flex: 1, paddingVertical: 10, fontSize: 13.5, fontWeight: '700', color: '#2D1B4D', textAlign: 'right' },

  uploadDropZone: {
    backgroundColor: '#FFF9FB',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#F472B6',
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadDropTitle: { fontSize: 13.5, fontWeight: '800', color: '#BE123C', textAlign: 'center', marginBottom: 4 },
  uploadDropSubtitle: { fontSize: 11.5, color: '#8B94B7', textAlign: 'center' },

  previewContainer: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    backgroundColor: '#F8F9FE',
    padding: 10,
    alignItems: 'center',
  },
  receiptPreviewImage: { width: '100%', height: 180, borderRadius: 12 },
  removeImageBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  removeImageText: { fontSize: 12, fontWeight: '800', color: '#E11D48' },

  submitReceiptBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E91E63',
    borderRadius: 16,
    paddingVertical: 14,
    ...SHADOWS.small,
  },
  submitReceiptBtnText: { fontSize: 14.5, fontWeight: '900', color: '#FFFFFF' },

  whatsappDividerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  orText: { marginHorizontal: 10, fontSize: 12, color: '#8B94B7', fontWeight: '700' },

  whatsAppSubmitBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: 16,
    paddingVertical: 13,
  },
  whatsAppSubmitBtnText: { fontSize: 13.5, fontWeight: '800', color: '#047857' },
});
