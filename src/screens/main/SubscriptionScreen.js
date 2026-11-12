import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api, getStoredAuthData } from '../../api/client';
import { COLORS, SHADOWS } from '../../constants/theme';

const VODAFONE_CASH_NUMBER = '01017961150';

const PLANS = [
  {
    id: 'daily',
    title: 'باقة يومية',
    price: '50',
    duration: 'صلاحية 24 ساعة',
    views: '10 استمارات تواصل',
    badge: 'الأكثر توفيراً',
    popular: false,
  },
  {
    id: 'weekly',
    title: 'باقة أسبوعية',
    price: '100',
    duration: 'صلاحية 7 أيام',
    views: '20 استمارة تواصل',
    badge: 'الأكثر طلباً ⭐',
    popular: true,
  },
  {
    id: 'monthly',
    title: 'باقة شهرية',
    price: '300',
    duration: 'صلاحية 30 يوماً',
    views: '50 استمارة تواصل',
    badge: 'باقة مميزة 👑',
    popular: false,
  },
];

export default function SubscriptionScreen({ navigation }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('weekly');
  const [loading, setLoading] = useState(false);

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
      console.log('Error fetching user', e);
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>باقات واشتراكات نصفي الآخر</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Active Subscription Status Banner if Active */}
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
              مدى الحياة. بعد استنفاذها يمكنك الاشتراك بأي باقة لتواصل غير محدود.
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

        {/* Payment Instructions Card */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>طريقة الدفع والتفعيل السريع</Text>
          <Text style={styles.instructionsText}>
            1. قم بتحويل قيمة الباقة إلى محفظة فودافون كاش التالية:
          </Text>

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

          <Text style={styles.instructionsText}>
            2. بعد التحويل، اضغط الزر أدناه لإرسال رسالة أو إيصال التحويل عبر واتساب للإدارة ليتم تفعيل باقتك فوراً.
          </Text>

          <TouchableOpacity
            style={styles.whatsAppSubmitBtn}
            activeOpacity={0.88}
            onPress={() => handleWhatsAppSupport(selectedPlan)}
          >
            <Ionicons name="logo-whatsapp" size={22} color="#FFFFFF" style={{ marginLeft: 8 }} />
            <Text style={styles.whatsAppSubmitBtnText}>إرسال الإيصال وتفعيل الباقة عبر واتساب</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  topHeader: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F4F9',
  },
  headerTitle: {
    fontSize: 17.5,
    fontWeight: '900',
    color: '#2D1B4D',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  activeTextCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  activePlanName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#2D1B4D',
  },
  activeExpiry: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B94B7',
    marginTop: 2,
  },
  viewsRemainingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  viewsRemainingLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  viewsRemainingCount: {
    fontSize: 14,
    fontWeight: '900',
    color: '#BE123C',
  },
  freeCard: {
    backgroundColor: '#FFF0F5',
    borderWidth: 1.5,
    borderColor: '#FBCFE8',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  freeCardTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#2D1B4D',
    textAlign: 'right',
    marginBottom: 4,
  },
  freeCardText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'right',
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2D1B4D',
    textAlign: 'right',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#F1F4F9',
    position: 'relative',
    ...SHADOWS.card,
  },
  planCardActive: {
    borderColor: '#E91E63',
    backgroundColor: '#FFFDFE',
  },
  planBadge: {
    position: 'absolute',
    top: -10,
    left: 18,
    backgroundColor: '#F1F4F9',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
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
    justifyContent: 'space-between',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
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
  planTitleCol: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 12,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2D1B4D',
  },
  planDuration: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B94B7',
    marginTop: 2,
  },
  planPriceCol: {
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    gap: 4,
  },
  planPriceNum: {
    fontSize: 24,
    fontWeight: '900',
    color: '#E91E63',
  },
  planCurrency: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  planDivider: {
    height: 1,
    backgroundColor: '#F1F4F9',
    marginVertical: 12,
  },
  planBenefitRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  planBenefitText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },
  instructionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#F1F4F9',
    ...SHADOWS.small,
  },
  instructionsTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#2D1B4D',
    textAlign: 'right',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'right',
    lineHeight: 18,
    marginBottom: 8,
  },
  numberBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF0F5',
    borderWidth: 1,
    borderColor: '#FBCFE8',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
  },
  vodaNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#E91E63',
    letterSpacing: 1,
  },
  copyBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E91E63',
  },
  whatsAppSubmitBtn: {
    backgroundColor: '#25D366',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    marginTop: 6,
    ...SHADOWS.small,
  },
  whatsAppSubmitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
