import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SHADOWS } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

export const ONBOARDING_KEY = '@has_seen_onboarding';

const SLIDES = [
  {
    id: '1',
    badge: '🕌 زواج إسلامي شرعي 100%',
    badgeBg: '#FDF2F8',
    badgeColor: '#DB2777',
    title: 'طريقك الشرعي نحو شريك الحياة 🌸',
    description:
      'منصة "نصفي الآخر" قائمة على كتاب الله وسنة رسوله ﷺ؛ نساعدك في العثور على الشريك الصالح بكل جدية وعفة، مع حفظ تام للكرامة والخصوصية الشرعية.',
    mainIcon: 'heart-outline',
    subIcon: 'shield-checkmark-outline',
    accentColor: '#E91E63',
    subColor: '#9333EA',
    cardBg: '#FFF5F8',
    chips: ['ضوابط شرعية صارمة', 'خصوصية وأمان تام', 'جدية في الارتباط'],
  },
  {
    id: '2',
    badge: '📋 استمارات دقيقة وشاملة',
    badgeBg: '#EFF6FF',
    badgeColor: '#2563EB',
    title: 'استمارات مفصلة وتوافق ذكي 🎯',
    description:
      'استمارة زواج متكاملة تشمل الالتزام بالصلاة، الحجاب، التدخين، المؤهل، ونبذة عن النفس ومواصفات الشريك للوصول لأعلى درجات التوافق والسكينة.',
    mainIcon: 'document-text-outline',
    subIcon: 'sparkles-outline',
    accentColor: '#2563EB',
    subColor: '#059669',
    cardBg: '#F0F7FF',
    chips: ['بيانات دقيقة وموثوقة', 'تدقيق ومراجعة للإدارة', 'توافق في الطباع'],
  },
  {
    id: '3',
    badge: '🛡️ الأبواب من بيوتها',
    badgeBg: '#ECFDF5',
    badgeColor: '#059669',
    title: 'تواصل مباشر مع ولي الأمر 💬',
    description:
      'حفاظاً على بنات المسلمين، يتم فك قفل بيانات التواصل والتخاطب المباشر عبر واتساب مع ولي أمر العروسة لضمان الجدية التامة والوضوح والأمان.',
    mainIcon: 'logo-whatsapp',
    subIcon: 'call-outline',
    accentColor: '#10B981',
    subColor: '#0284C7',
    cardBg: '#F0FDF4',
    chips: ['حفظ حياء العرائس', 'مخاطبة ولي الأمر', 'لا محادثات غير شرعية'],
  },
  {
    id: '4',
    badge: '🎁 هدايا وباقات ميسرة',
    badgeBg: '#FEF3C7',
    badgeColor: '#D97706',
    title: 'تسجيل مجاني وباقات مرنة 👑',
    description:
      'تسجيل مجاني بالكامل لجميع العرائس، مع 3 استمارات مجانية كهدية ترحيبية لكل عريس جاد، بالإضافة لباقات اشتراك ميسرة للتجديد وفك أقفال إضافية.',
    mainIcon: 'gift-outline',
    subIcon: 'card-outline',
    accentColor: '#F59E0B',
    subColor: '#E91E63',
    cardBg: '#FFFDF0',
    chips: ['تسجيل مجاني للعرائس', '3 استمارات هدية للعرسان', 'باقات مرنة ومناسبة'],
  },
];

export default function OnboardingScreen({ navigation, onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (err) {
      console.log('Error saving onboarding key:', err);
    }

    if (onFinish) {
      onFinish();
    } else if (navigation && navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else if (navigation) {
      navigation.replace('Login');
    }
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
      setCurrentIndex(prevIndex);
    }
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;

  const renderSlide = ({ item }) => {
    return (
      <View style={styles.slideContainer}>
        {/* Visual Illustration Card */}
        <View style={[styles.visualCard, { backgroundColor: item.cardBg }]}>
          <View style={[styles.iconHaloOuter, { borderColor: item.accentColor + '30' }]}>
            <View style={[styles.iconHaloInner, { backgroundColor: item.accentColor + '15' }]}>
              <Ionicons name={item.mainIcon} size={72} color={item.accentColor} />
            </View>
          </View>

          {/* Floating Sub-Icon Badge */}
          <View style={[styles.floatingBadge, { backgroundColor: item.subColor }]}>
            <Ionicons name={item.subIcon} size={22} color="#FFFFFF" />
          </View>
        </View>

        {/* Text Content */}
        <View style={styles.contentBox}>
          {/* Badge Pill */}
          <View style={[styles.badgePill, { backgroundColor: item.badgeBg }]}>
            <Text style={[styles.badgePillText, { color: item.badgeColor }]}>{item.badge}</Text>
          </View>

          {/* Title */}
          <Text style={styles.slideTitle}>{item.title}</Text>

          {/* Description */}
          <Text style={styles.slideDescription}>{item.description}</Text>

          {/* Feature Chips */}
          <View style={styles.chipsRow}>
            {item.chips.map((chip, idx) => (
              <View key={idx} style={styles.chip}>
                <Ionicons name="checkmark-circle-outline" size={14} color="#10B981" />
                <Text style={styles.chipText}>{chip}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header Row (Logo + Skip Button) */}
      <View style={styles.topHeader}>
        <View style={styles.logoRow}>
          <Image
            source={require('../../../assets/logo1.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>نصفي الآخر</Text>
        </View>

        {!isLastSlide ? (
          <TouchableOpacity onPress={handleFinish} style={styles.skipButton} activeOpacity={0.7}>
            <Text style={styles.skipText}>تخطي</Text>
            <Ionicons name="arrow-back" size={16} color="#8B94B7" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {/* Main Slides Carousel */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        contentContainerStyle={styles.flatListContent}
      />

      {/* Bottom Controls Bar */}
      <View style={styles.bottomArea}>
        {/* Pagination Dots Indicator */}
        <View style={styles.paginationRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Buttons Action Container */}
        <View style={styles.actionsContainer}>
          {isLastSlide ? (
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={handleFinish}
              activeOpacity={0.88}
            >
              <Text style={styles.getStartedText}>ابدأ رحلتك الآن 🚀</Text>
              <Ionicons name="sparkles" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
            </TouchableOpacity>
          ) : (
            <View style={styles.navButtonsRow}>
              {currentIndex > 0 ? (
                <TouchableOpacity
                  style={styles.prevButton}
                  onPress={handlePrev}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-forward" size={18} color="#64748B" />
                  <Text style={styles.prevButtonText}>السابق</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ width: 80 }} />
              )}

              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNext}
                activeOpacity={0.88}
              >
                <Text style={styles.nextButtonText}>التالي</Text>
                <Ionicons name="arrow-back" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Login Link */}
          <TouchableOpacity
            style={styles.loginShortcut}
            onPress={handleFinish}
            activeOpacity={0.7}
          >
            <Text style={styles.loginShortcutText}>
              لديك حساب بالفعل؟ <Text style={styles.loginShortcutBold}>تسجيل الدخول</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FE',
  },
  logoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    width: 32,
    height: 32,
  },
  appName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2D1B4D',
  },
  skipButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    gap: 4,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  flatListContent: {
    alignItems: 'center',
  },
  slideContainer: {
    width: width,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualCard: {
    width: width - 64,
    height: height * 0.32,
    maxHeight: 280,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 10,
    marginBottom: 20,
    ...SHADOWS.card,
  },
  iconHaloOuter: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconHaloInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingBadge: {
    position: 'absolute',
    bottom: 18,
    right: 28,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  contentBox: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  badgePill: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: 10,
  },
  badgePillText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  slideTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2D1B4D',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 32,
  },
  slideDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 18,
  },
  chipsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  chip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 5,
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 8,
  },
  paginationRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 18,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 26,
    backgroundColor: '#E91E63',
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#E2E8F0',
  },
  actionsContainer: {
    width: '100%',
  },
  navButtonsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E91E63',
    paddingVertical: 14,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  prevButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    marginRight: 10,
    gap: 4,
  },
  prevButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  getStartedButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E91E63',
    paddingVertical: 16,
    borderRadius: 18,
    elevation: 6,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  getStartedText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  loginShortcut: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 4,
  },
  loginShortcutText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  loginShortcutBold: {
    fontWeight: '800',
    color: '#E91E63',
  },
});
