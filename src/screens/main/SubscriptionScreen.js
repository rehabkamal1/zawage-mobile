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
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { api, getStoredAuthData, API_BASE_URL } from '../../api/client';
import { useAlert } from '../../context/AlertContext';
import { APP_CONFIG } from '../../constants/config';
import { COLORS, SHADOWS } from '../../constants/theme';

const VODAFONE_CASH_NUMBER = '01017961150'; // رقم فودافون كاش المعتمد للتحويل

const PLANS = [
  {
    id: 'daily',
    title: 'باقة يومية',
    price: '50',
    unit: 'جنيه / يوم',
    badge: 'الأكثر توفيراً',
    popular: false,
    features: [
      'تظهر لك 10 استمارات للشركاء',
      'فك قفل 3 محاولات تواصل واتساب',
      'فتح استمارة الزواج فور موافقة الإدارة',
      'خصوصية تامة وأمان كامل للبيانات',
    ],
  },
  {
    id: 'weekly',
    title: 'باقة أسبوعية',
    price: '100',
    unit: 'جنيه / أسبوع',
    badge: 'الأكثر طلباً ⭐',
    popular: true,
    features: [
      'تظهر لك 20 استمارة للشركاء',
      'فك قفل 7 محاولات تواصل واتساب',
      'صلاحية كاملة لمدة 7 أيام من التفعيل',
      'فتح استمارة الزواج فور موافقة الإدارة',
    ],
  },
  {
    id: 'monthly',
    title: 'باقة شهرية',
    price: '300',
    unit: 'جنيه / شهر',
    badge: 'باقة مميزة 👑',
    popular: false,
    features: [
      'تظهر لك 50 استمارة للشركاء',
      'فك قفل 25 محاولة تواصل واتساب',
      'صلاحية كاملة لمدة 30 يوماً من التفعيل',
      'فتح استمارة الزواج فور موافقة الإدارة',
    ],
  },
];

export default function SubscriptionScreen({ navigation }) {
  const { showSuccess, showError, showWarning } = useAlert();
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('weekly');
  const [senderWallet, setSenderWallet] = useState('');
  const [receiptImage, setReceiptImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRenewForm, setShowRenewForm] = useState(false);

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
      console.log('Error fetching user info in subscriptions', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showWarning('صلاحية الوصول', 'يرجى السماح بالوصول لمعرض الصور لإرفاق إيصال التحويل.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setReceiptImage(result.assets[0].uri);
      }
    } catch (err) {
      showError('خطأ', 'تعذر فتح معرض الصور');
    }
  };

  const handleSubmitTransfer = async () => {
    if (!receiptImage) {
      showWarning('تنبيه مطلوب', 'يرجى اختيار صورة (سكرين شوت) إيصال التحويل أولاً.');
      return;
    }

    setSubmitting(true);
    try {
      const { token } = await getStoredAuthData();
      const endpoint = `${API_BASE_URL}/subscriptions/manual-transfer`;

      const uploadResult = await FileSystem.uploadAsync(endpoint, receiptImage, {
        fieldName: 'receipt_image',
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType?.MULTIPART ?? 1,
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        parameters: {
          type: selectedPlan,
          ...(senderWallet.trim() ? { sender_wallet_number: senderWallet.trim() } : {}),
        },
      });

      let res = {};
      try {
        res = uploadResult.body ? JSON.parse(uploadResult.body) : {};
      } catch (_) {}

      if (uploadResult.status >= 200 && uploadResult.status < 300) {
        showSuccess(
          'تم إرسال إيصال التحويل بنجاح! 🎉',
          res.message || 'طلبك الآن قيد المراجعة والتدقيق من قبل الإدارة. سيتم تفعيل باقتك فور مراجعة الإيصال.'
        );

        setReceiptImage(null);
        setSenderWallet('');
        setShowRenewForm(false);
        fetchUserData();
      } else {
        const errorMsg =
          res.message ||
          res.error ||
          (res.errors ? Object.values(res.errors)[0]?.[0] : null) ||
          'حدث خطأ أثناء إرسال الإيصال';
        showError('خطأ في إرسال الإيصال', errorMsg);
      }
    } catch (err) {
      showError('خطأ في إرسال الإيصال', err.message || 'يرجى التأكد من اتصال الإنترنت والمحاولة مجدداً.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsAppSupport = () => {
    const plan = PLANS.find(p => p.id === selectedPlan) || PLANS[1];
    const userPhone = currentUser?.phone || '';
    const userName = currentUser?.profile?.nickname || currentUser?.name || '';
    const text = encodeURIComponent(
      `السلام عليكم، قمت بتحويل مبلغ ${plan.price} جنيهاً عبر فودافون كاش للاشتراك في (${plan.title}) في تطبيق نصفي الآخر.\nالاسم: ${userName}\nرقم الهاتف: ${userPhone}`
    );
    Linking.openURL(`https://wa.me/201017961150?text=${text}`).catch(() => {
      showError('خطأ', 'تعذر فتح واتساب.');
    });
  };

  const currentActiveSub = currentUser?.active_subscription;
  const latestPayment = currentUser?.latest_payment;
  const isPending = latestPayment?.status === 'pending';
  const isRejected = latestPayment?.status === 'failed';
  const isFinished = currentActiveSub && (
    (currentActiveSub.views_allowed - currentActiveSub.views_used <= 0) ||
    new Date(currentActiveSub.expires_at) <= new Date()
  );

  if (loading) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color="#E91E63" />
        <Text style={styles.centerLoadingText}>جاري تحميل بيانات الاشتراك...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>باقات واشتراكات نصفي الآخر</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 1. Finished / Expired Subscription Banner (Matches Web) */}
        {currentActiveSub && isFinished && (
          <View style={styles.expiredBanner}>
            <View style={styles.expiredIconBox}>
              <Ionicons name="alert-circle" size={32} color="#9A3412" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.expiredTitle}>انتهى رصيد أو صلاحية باقتك السابقة ⚠️</Text>
              <Text style={styles.expiredSubtitle}>
                لقد استنفدت جميع محاولات التواصل أو انتهت صلاحية اشتراكك. يمكنك اختيار باقة جديدة أدناه ورفع إيصال التحويل لتجديد اشتراكك فوراً.
              </Text>
            </View>
          </View>
        )}

        {/* 2. Active Subscription Banner (Matches Web) */}
        {currentActiveSub && !isFinished && (
          <View style={styles.activeCard}>
            <View style={styles.activeHeaderRow}>
              <View style={styles.crownCircle}>
                <Ionicons name="shield-checkmark" size={28} color="#0D9488" />
              </View>
              <View style={styles.activeTextCol}>
                <Text style={styles.activePlanName}>
                  أنت مشترك بالفعل في الباقة {currentActiveSub.type === 'daily' ? 'اليومية' : (currentActiveSub.type === 'weekly' ? 'الأسبوعية' : 'الشهرية')} ✅
                </Text>
                <Text style={styles.activeExpiry}>
                  رصيد الاتصالات المتبقي: {Math.max(0, (currentActiveSub.views_allowed || 0) - (currentActiveSub.views_used || 0))} من أصل {currentActiveSub.views_allowed}
                </Text>
                <Text style={[styles.activeExpiry, { marginTop: 2, fontSize: 11, opacity: 0.9 }]}>
                  تاريخ الانتهاء: {new Date(currentActiveSub.expires_at).toLocaleDateString('ar-EG')}
                </Text>
              </View>
            </View>

            <View style={styles.activeActionsRow}>
              <TouchableOpacity
                style={styles.activeFormBtn}
                onPress={() => navigation.navigate('EditProfileTab')}
              >
                <Ionicons name="document-text-outline" size={17} color="#0F766E" style={{ marginLeft: 6 }} />
                <Text style={styles.activeFormBtnText}>استمارتي</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.activeRenewBtn}
                onPress={() => setShowRenewForm(!showRenewForm)}
              >
                <Ionicons name="refresh-outline" size={17} color="#FFFFFF" style={{ marginLeft: 6 }} />
                <Text style={styles.activeRenewBtnText}>
                  {showRenewForm ? 'إخفاء نموذج التجديد' : 'تجديد / ترقية الباقة الآن 🔄'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 3. Pending Verification Banner (Matches Web) */}
        {isPending && (
          <View style={styles.pendingCard}>
            <View style={styles.pendingIconBox}>
              <Ionicons name="time" size={32} color="#D97706" />
            </View>
            <Text style={styles.pendingCardTitle}>طلب التحويل قيد المراجعة حالياً ⏳</Text>
            <Text style={styles.pendingCardText}>
              لقد استلمنا إيصال التحويل الخاص بك بنجاح، ويقوم فريق الإدارة بمراجعته الآن لتفعيل باقتك وفتح استمارة الزواج.
            </Text>

            <View style={styles.pendingDetailsBox}>
              <View style={styles.pendingDetailItem}>
                <Text style={styles.pendingDetailLabel}>الباقة المطلوبة:</Text>
                <Text style={styles.pendingDetailVal}>
                  {latestPayment.subscription?.type === 'daily'
                    ? 'باقة يومية (50 ج)'
                    : latestPayment.subscription?.type === 'weekly'
                    ? 'باقة أسبوعية (100 ج)'
                    : 'باقة شهرية (300 ج)'}
                </Text>
              </View>
              <View style={styles.pendingDetailItem}>
                <Text style={styles.pendingDetailLabel}>تاريخ الطلب:</Text>
                <Text style={styles.pendingDetailVal}>
                  {new Date(latestPayment.created_at).toLocaleDateString('ar-EG')}
                </Text>
              </View>
              <View style={styles.pendingDetailItem}>
                <Text style={styles.pendingDetailLabel}>الحالة:</Text>
                <Text style={[styles.pendingDetailVal, { color: '#D97706' }]}>بانتظار موافقة الإدارة</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.refreshStatusBtn} onPress={fetchUserData}>
              <Ionicons name="refresh-outline" size={18} color="#92400E" style={{ marginLeft: 6 }} />
              <Text style={styles.refreshStatusBtnText}>تحديث حالة الطلب الآن 🔄</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 4. Rejected Banner with Reason (Matches Web) */}
        {isRejected && (
          <View style={styles.rejectedCard}>
            <View style={styles.rejectedIconBox}>
              <Ionicons name="close-circle" size={30} color="#DC2626" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rejectedTitle}>عذراً، تم رفض إيصال التحويل السابق ❌</Text>
              <Text style={styles.rejectedText}>
                يرجى مراجعة سبب الرفض أدناه وإعادة إرفاق صورة إيصال صحيحة وواضحة لإتمام تفعيل اشتراكك:
              </Text>
              {latestPayment.rejection_reason && (
                <View style={styles.rejectionReasonBox}>
                  <Text style={styles.rejectionReasonText}>
                    سبب الرفض من الإدارة: {latestPayment.rejection_reason}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Free Tier Status if no active sub */}
        {!currentActiveSub && !isPending && (
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

        {/* 5. Transfer Form & Plans (Shown if no active sub OR finished OR user clicked renew) */}
        {(!currentActiveSub || isFinished || showRenewForm) && !isPending && (
          <View style={styles.formContainer}>
            {/* Vodafone Cash Instructions Card (Matches Web) */}
            <View style={styles.vodafoneCard}>
              <View style={styles.vodafoneHeader}>
                <Ionicons name="wallet-outline" size={32} color="#FACC15" />
                <Text style={styles.vodafoneTitle}>
                  لإكمال التفعيل، حوّل على رقم فودافون كاش التالي:
                </Text>
              </View>
              <Text style={styles.vodafoneDesc}>
                اختر الباقة المناسبة لك أدناه، وقم بتحويل المبلغ المطلوب على محفظة فودافون كاش الموضحة، ثم ارفع صورة (سكرين شوت) الإيصال ليتم تفعيل حسابك وفتح الاستمارة فوراً.
              </Text>

              <View style={styles.numberRow}>
                <View>
                  <Text style={styles.numberLabel}>رقم محفظة فودافون كاش المعتمد:</Text>
                  <Text style={styles.numberValue}>{VODAFONE_CASH_NUMBER}</Text>
                </View>
                <TouchableOpacity
                  style={styles.copyBtn}
                  onPress={() => {
                    showSuccess('تم النسخ!', `تم نسخ رقم فودافون كاش (${VODAFONE_CASH_NUMBER}) بنجاح`);
                  }}
                  activeOpacity={0.88}
                >
                  <Ionicons name="copy-outline" size={17} color="#1E1B4B" style={{ marginLeft: 6 }} />
                  <Text style={styles.copyBtnText}>نسخ الرقم</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Step 1: Select Plan */}
            <Text style={styles.sectionHeading}>1. اختر باقة الاشتراك</Text>
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
                    <View style={styles.planTextCol}>
                      <Text style={styles.planTitle}>{plan.title}</Text>
                      <Text style={styles.planPrice}>
                        {plan.price} <Text style={styles.planUnit}>{plan.unit}</Text>
                      </Text>
                    </View>
                  </View>

                  <View style={styles.planFeaturesBox}>
                    {plan.features.map((feat, idx) => (
                      <View key={idx} style={styles.featureLine}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginLeft: 6 }} />
                        <Text style={styles.featureLineText}>{feat}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Step 2: Upload Receipt Screenshot */}
            <View style={styles.uploadSection}>
              <Text style={styles.sectionHeading}>2. ارفع صورة إيصال التحويل (Screenshot)</Text>

              {receiptImage ? (
                <View style={styles.previewBox}>
                  <Image source={{ uri: receiptImage }} style={styles.previewImage} resizeMode="contain" />
                  <TouchableOpacity
                    style={styles.changeImageBtn}
                    onPress={() => setReceiptImage(null)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" style={{ marginLeft: 6 }} />
                    <Text style={styles.changeImageText}>حذف الصورة وتغييرها</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.dropZone}
                  activeOpacity={0.8}
                  onPress={handlePickImage}
                >
                  <Ionicons name="cloud-upload-outline" size={44} color="#E91E63" />
                  <Text style={styles.dropZoneTitle}>اضغط لاختيار صورة إيصال التحويل من جهازك</Text>
                  <Text style={styles.dropZoneSubtitle}>يدعم صيغ JPG, PNG, WEBP (الحد الأقصى 5 ميجابايت)</Text>
                </TouchableOpacity>
              )}

              <View style={styles.walletInputBox}>
                <Text style={styles.inputLabel}>رقم المحفظة التي قمت بالتحويل منها (اختياري لتسهيل المراجعة):</Text>
                <TextInput
                  style={styles.walletInput}
                  placeholder="مثال: 01012345678"
                  placeholderTextColor="#94A3B8"
                  value={senderWallet}
                  onChangeText={(v) => setSenderWallet(v.replace(/\D/g, ''))}
                  keyboardType="phone-pad"
                  maxLength={11}
                  textAlign="right"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitPayBtn, submitting && { opacity: 0.7 }]}
                activeOpacity={0.88}
                onPress={handleSubmitTransfer}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="arrow-up-circle-outline" size={22} color="#FFFFFF" style={{ marginLeft: 8 }} />
                    <Text style={styles.submitPayBtnText}>إرسال إيصال التحويل لتفعيل الباقة الآن 🚀</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.orDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.orText}>أو</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.whatsAppBtn}
                activeOpacity={0.88}
                onPress={handleWhatsAppSupport}
              >
                <Ionicons name="logo-whatsapp" size={20} color="#059669" style={{ marginLeft: 8 }} />
                <Text style={styles.whatsAppBtnText}>تأكيد التحويل ومراسلة الدعم عبر واتساب</Text>
              </TouchableOpacity>
            </View>
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
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFD',
  },
  centerLoadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#8B94B7',
  },
  topHeader: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#F1F4F9',
    alignItems: 'center',
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
  expiredBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 2,
    borderColor: '#EA580C',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    ...SHADOWS.small,
  },
  expiredIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FDBA74',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
  },
  expiredTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#9A3412',
    textAlign: 'right',
    marginBottom: 4,
  },
  expiredSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C2410C',
    textAlign: 'right',
    lineHeight: 18,
  },
  activeCard: {
    backgroundColor: '#0F766E',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...SHADOWS.medium,
  },
  activeHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  crownCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
  },
  activeTextCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  activePlanName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'right',
  },
  activeExpiry: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E6FFFA',
    textAlign: 'right',
  },
  activeActionsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeFormBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  activeFormBtnText: {
    color: '#0F766E',
    fontSize: 13,
    fontWeight: '800',
  },
  activeRenewBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  activeRenewBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  pendingCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  pendingIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pendingCardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#92400E',
    marginBottom: 6,
    textAlign: 'center',
  },
  pendingCardText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78350F',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  pendingDetailsBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 14,
  },
  pendingDetailItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  pendingDetailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  pendingDetailVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#78350F',
  },
  refreshStatusBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D97706',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  refreshStatusBtnText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '800',
  },
  rejectedCard: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#EF4444',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  rejectedIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  rejectedTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#991B1B',
    textAlign: 'right',
    marginBottom: 4,
  },
  rejectedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7F1D1D',
    textAlign: 'right',
    lineHeight: 18,
    marginBottom: 8,
  },
  rejectionReasonBox: {
    backgroundColor: '#FFFFFF',
    borderRightWidth: 4,
    borderRightColor: '#DC2626',
    padding: 10,
    borderRadius: 8,
  },
  rejectionReasonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#991B1B',
    textAlign: 'right',
  },
  freeCard: {
    backgroundColor: '#FFF0F5',
    borderWidth: 1.5,
    borderColor: '#FFD6E5',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },
  freeCardTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#BE123C',
    textAlign: 'right',
    marginBottom: 4,
  },
  freeCardText: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'right',
    lineHeight: 20,
    fontWeight: '600',
  },
  formContainer: {},
  vodafoneCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    ...SHADOWS.medium,
  },
  vodafoneHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 10,
  },
  vodafoneTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'right',
    marginRight: 10,
    lineHeight: 22,
  },
  vodafoneDesc: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#C7D2FE',
    textAlign: 'right',
    lineHeight: 20,
    marginBottom: 16,
  },
  numberRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
    padding: 14,
  },
  numberLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E0E7FF',
    textAlign: 'right',
    marginBottom: 2,
  },
  numberValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FACC15',
    letterSpacing: 2,
    textAlign: 'right',
  },
  copyBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FACC15',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1E1B4B',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '900',
    color: '#2D1B4D',
    textAlign: 'right',
    marginBottom: 12,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#F1F4F9',
    position: 'relative',
    ...SHADOWS.small,
  },
  planCardActive: {
    borderColor: '#E91E63',
    backgroundColor: '#FFF9FB',
  },
  planBadge: {
    position: 'absolute',
    top: 12,
    left: 14,
    backgroundColor: '#F1F4F9',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  planBadgeActive: {
    backgroundColor: '#E91E63',
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  planBadgeTextActive: {
    color: '#FFFFFF',
  },
  planHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 12,
  },
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
  radioCircleActive: {
    borderColor: '#E91E63',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E91E63',
  },
  planTextCol: {
    alignItems: 'flex-end',
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2D1B4D',
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#E91E63',
  },
  planUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  planFeaturesBox: {
    borderTopWidth: 1,
    borderTopColor: '#F1F4F9',
    paddingTop: 10,
    marginTop: 4,
  },
  featureLine: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 3,
  },
  featureLineText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'right',
  },
  uploadSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F1F4F9',
    ...SHADOWS.small,
  },
  dropZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E91E63',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FFF9FB',
    marginBottom: 16,
  },
  dropZoneTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2D1B4D',
    marginTop: 8,
    textAlign: 'center',
  },
  dropZoneSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B94B7',
    marginTop: 4,
    textAlign: 'center',
  },
  previewBox: {
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 10,
    backgroundColor: '#F8FAFC',
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  changeImageBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  changeImageText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EF4444',
  },
  walletInputBox: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 6,
    textAlign: 'right',
  },
  walletInput: {
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
  submitPayBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E91E63',
    paddingVertical: 15,
    borderRadius: 25,
    ...SHADOWS.small,
  },
  submitPayBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  orText: {
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  whatsAppBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    paddingVertical: 13,
    borderRadius: 25,
  },
  whatsAppBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#059669',
  },
});
