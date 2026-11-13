import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  Alert,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api, saveAuthData } from '../../api/client';
import PartnerCard from '../../components/PartnerCard';
import { APP_CONFIG } from '../../constants/config';
import { COLORS, SHADOWS } from '../../constants/theme';

const GOVERNORATES = APP_CONFIG.GOVERNORATES;
const MARITAL_STATUSES = ['الكل', 'آنسة', 'مطلق', 'مطلقة', 'أرمل', 'أرملة'];
const AGE_RANGES = ['الكل', '18-25', '26-35', '36+'];

export default function HomeScreen({ navigation }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [allMatches, setAllMatches] = useState([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [requiresForm, setRequiresForm] = useState(false);

  // Filter States
  const [governorate, setGovernorate] = useState('الكل');
  const [maritalStatus, setMaritalStatus] = useState('الكل');
  const [ageRange, setAgeRange] = useState('الكل');
  const [activePicker, setActivePicker] = useState(null); // 'gov' | 'status' | 'age' | null

  const isMale = currentUser?.gender === 'male';
  const isProfileFilled = Boolean(
    currentUser?.profile &&
    currentUser.profile.governorate &&
    String(currentUser.profile.governorate).trim() !== '' &&
    currentUser.profile.marital_status &&
    String(currentUser.profile.marital_status).trim() !== '' &&
    (!isMale ? (currentUser.profile.guardian_phone && String(currentUser.profile.guardian_phone).trim() !== '') : true)
  );

  // Fetch Current User & Matches
  const fetchData = useCallback(async (currentGov = governorate, currentStatus = maritalStatus, currentAge = ageRange) => {
    try {
      let query = '';
      if (currentGov !== 'الكل') query += `governorate=${encodeURIComponent(currentGov)}&`;
      if (currentStatus !== 'الكل') query += `marital_status=${encodeURIComponent(currentStatus)}&`;
      if (currentAge !== 'الكل') query += `age_range=${encodeURIComponent(currentAge)}&`;

      const [meRes, favsRes] = await Promise.all([
        api.getMe().catch(() => ({ user: null })),
        api.getFavorites().catch(() => ({ favorites: [] })),
      ]);

      if (meRes.user) {
        setCurrentUser(meRes.user);
        await saveAuthData(null, meRes.user);
      }

      const favIds = (favsRes.favorites || favsRes.data || []).map(f => f.id || f.favorite_user_id);
      setFavorites(favIds);

      // Only attempt to fetch matches if user is male
      if (meRes.user?.gender === 'male') {
        try {
          const matchesRes = await api.getMatches(query);
          const fetchedMatches = matchesRes.matches || matchesRes.data || [];
          setAllMatches(fetchedMatches);
          setRequiresForm(false);
          setVisibleCount(6);

          if (meRes.user) {
            setCurrentUser(prev => prev ? ({
              ...prev,
              free_views_used: matchesRes.free_views_used ?? prev.free_views_used,
              free_views_allowed: matchesRes.free_views_allowed ?? prev.free_views_allowed,
              free_views_remaining: matchesRes.free_views_remaining ?? prev.free_views_remaining,
            }) : prev);
          }
        } catch (matchErr) {
          if (matchErr.status === 403 || matchErr.data?.requires_form) {
            setRequiresForm(true);
            setAllMatches([]);
          } else {
            setAllMatches([]);
          }
        }
      } else {
        setAllMatches([]);
        setRequiresForm(false);
      }
    } catch (e) {
      console.log('Error fetching home data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [governorate, maritalStatus, ageRange]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(governorate, maritalStatus, ageRange);
  };

  const handleApplyFilter = (type, val) => {
    let nextGov = governorate;
    let nextStatus = maritalStatus;
    let nextAge = ageRange;

    if (type === 'gov') { setGovernorate(val); nextGov = val; }
    if (type === 'status') { setMaritalStatus(val); nextStatus = val; }
    if (type === 'age') { setAgeRange(val); nextAge = val; }

    setActivePicker(null);
    setLoading(true);
    fetchData(nextGov, nextStatus, nextAge);
  };

  const handleToggleFavorite = async (partnerId) => {
    try {
      await api.toggleFavorite(partnerId);
      setFavorites(prev =>
        prev.includes(partnerId)
          ? prev.filter(id => id !== partnerId)
          : [...prev, partnerId]
      );
    } catch (e) {
      console.log('Favorite toggle error', e);
    }
  };

  const handleLoadMore = () => {
    if (visibleCount < allMatches.length && !loadingMore) {
      setLoadingMore(true);
      setTimeout(() => {
        setVisibleCount(prev => Math.min(prev + 6, allMatches.length));
        setLoadingMore(false);
      }, 250);
    }
  };

  const handleUnlockContact = (partner) => {
    Alert.alert(
      'فك قفل بيانات التواصل',
      `هل تود فك قفل استمارة (${partner.profile?.nickname || partner.name}) للتواصل مع ولي الأمر عبر واتساب؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد وفك القفل',
          onPress: async () => {
            try {
              const res = await api.unlockContact(partner.id);
              Alert.alert('تهانينا 🎉', res.message || 'تم فك القفل بنجاح، يمكنك الآن التواصل عبر واتساب.');
              setAllMatches(prev => prev.map(m => m.id === partner.id ? { ...m, is_unlocked: true, phone: res.phone } : m));
              fetchData();
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
            }
          }
        }
      ]
    );
  };

  const displayedMatches = allMatches.slice(0, visibleCount);
  const userName = currentUser?.profile?.nickname || currentUser?.name || '';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Application Bar */}
      <View style={styles.topNavbar}>
        <View style={styles.topNavBrand}>
          <Image
            source={require('../../../assets/logo1.png')}
            style={styles.navLogo}
            resizeMode="contain"
          />
          <Text style={styles.navBrandText}>نصفي الآخر</Text>
          <Ionicons name="heart" size={17} color="#E91E63" style={{ marginRight: 4 }} />
        </View>

        <TouchableOpacity
          style={styles.navBookmarkBtn}
          onPress={() => navigation.navigate('FavoritesTab')}
        >
          <Ionicons name="bookmark-outline" size={22} color="#2D1B4D" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#E91E63" />
          <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
        </View>
      ) : !isMale && !isProfileFilled ? (
        // -------------------------------------------------------------------
        // STATE 1A: FEMALE USER (BRIDE) - Incomplete Form
        // -------------------------------------------------------------------
        <ScrollView
          contentContainerStyle={styles.centerCardContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E91E63']} />}
        >
          <View style={styles.lockNoticeCard}>
            <View style={styles.lockIconCircle}>
              <Ionicons name="document-text" size={44} color="#E91E63" />
            </View>

            <Text style={styles.lockTitle}>يرجى ملء استمارتك أولاً لنشر ملفك للعرسان 📋</Text>

            <Text style={styles.lockDescription}>
              أهلاً بكِ في منصة نصفي الآخر 🌸 لقد قمتِ بإنشاء حسابك بنجاح كعروسة، ولكن لكي يتم نشر مواصفاتك وتظهر للعرسان المشتركين الجادين وفقاً للضوابط الشرعية، يجب عليكِ ملء بيانات استمارتك (استمارة العروسة) وتحديد بيانات ولي الأمر أولاً.
            </Text>

            <TouchableOpacity
              style={styles.fillFormBtn}
              onPress={() => navigation.navigate('EditProfileTab')}
              activeOpacity={0.88}
            >
              <Ionicons name="create-outline" size={20} color="#FFFFFF" style={{ marginLeft: 6 }} />
              <Text style={styles.fillFormBtnText}>ملء استمارة العروسة الآن 📝</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.brideSecondaryBtn}
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.8}
            >
              <Ionicons name="settings-outline" size={18} color="#2D1B4D" style={{ marginLeft: 6 }} />
              <Text style={styles.brideSecondaryBtnText}>إعدادات الحساب وكلمة المرور ⚙️</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : !isMale && isProfileFilled ? (
        // -------------------------------------------------------------------
        // STATE 1B: FEMALE USER (BRIDE) - Complete Form (Published)
        // -------------------------------------------------------------------
        <ScrollView
          contentContainerStyle={styles.centerCardContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E91E63']} />}
        >
          <View style={styles.brideCard}>
            <View style={styles.brideIconCircle}>
              <Ionicons name="heart" size={46} color="#E91E63" />
            </View>
            <Text style={styles.brideTitle}>أهلاً بكِ في منصة نصفي الآخر 🌸</Text>
            <Text style={styles.brideSubtitle}>
              تم نشر استمارتك ومواصفاتك بنجاح وهي الآن متاحة للعرسان المشتركين الجادين المطابقين لمواصفاتك الشرعية.
            </Text>
            <Text style={styles.brideDetails}>
              عند وجود توافق، سيقوم العريس بفك قفل بيانات التواصل والتواصل مباشرة مع ولي أمرك عبر واتساب.
              نسأل الله تعالى أن يرزقك الزوج الصالح والذرية المباركة.
            </Text>

            <View style={styles.brideTipBox}>
              <Text style={styles.brideTipTitle}>💡 إدارة استمارتك وبياناتك:</Text>
              <Text style={styles.brideTipText}>
                يمكنك في أي وقت مراجعة أو تحديث مواصفاتك ومواصفات شريك الحياة المطلوب من تبويب (استمارتي).
              </Text>
            </View>

            <TouchableOpacity
              style={styles.brideActionBtn}
              onPress={() => navigation.navigate('EditProfileTab')}
              activeOpacity={0.88}
            >
              <Ionicons name="document-text-outline" size={20} color="#FFFFFF" style={{ marginLeft: 6 }} />
              <Text style={styles.brideActionBtnText}>استعراض وتعديل استمارتي 📝</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.brideSecondaryBtn}
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.8}
            >
              <Ionicons name="settings-outline" size={18} color="#2D1B4D" style={{ marginLeft: 6 }} />
              <Text style={styles.brideSecondaryBtnText}>إعدادات الحساب وكلمة المرور ⚙️</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : isMale && (!isProfileFilled || requiresForm) ? (
        // -------------------------------------------------------------------
        // STATE 2: MALE USER WITHOUT COMPLETED FORM - Locked Notice (Matches Web UserDashboard)
        // -------------------------------------------------------------------
        <ScrollView
          contentContainerStyle={styles.centerCardContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E91E63']} />}
        >
          <View style={styles.lockNoticeCard}>
            <View style={styles.lockIconCircle}>
              <Ionicons name="document-text" size={44} color="#E91E63" />
            </View>

            <Text style={styles.lockTitle}>يرجى ملء الاستمارة أولاً لتتمكن من تصفح العرايس 📋</Text>

            <Text style={styles.lockDescription}>
              أهلاً بك{userName ? ` يا ${userName}` : ''}! حرصاً على الجدية التامة ومراعاة الضوابط الشرعية، يشترط إكمال بيانات استمارتك الخاصة (استمارة العريس) أولاً قبل التمكن من رؤية ملفات العرايس ونسب التوافق والبحث.
            </Text>

            <View style={styles.lockStepsBox}>
              <Text style={styles.lockStepsTitle}>💡 خطوات بسيطة للبدء:</Text>
              <Text style={styles.lockStepItem}>1. اضغط على الزر أدناه واملأ بياناتك ومواصفات شريكة حياتك.</Text>
              <Text style={styles.lockStepItem}>2. بمجرد حفظ الاستمارة، ستظهر لك فوراً جميع ملفات العرايس المتوافقة معك.</Text>
            </View>

            <TouchableOpacity
              style={styles.fillFormBtn}
              onPress={() => navigation.navigate('EditProfileTab')}
              activeOpacity={0.88}
            >
              <Ionicons name="create-outline" size={20} color="#FFFFFF" style={{ marginLeft: 6 }} />
              <Text style={styles.fillFormBtnText}>ملء الاستمارة الآن 📝</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        // -------------------------------------------------------------------
        // STATE 3: MALE USER WITH COMPLETED FORM - Active Discovery & Matches List
        // -------------------------------------------------------------------
        <FlatList
          data={displayedMatches}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <PartnerCard
              partner={item}
              isFavorite={favorites.includes(item.id)}
              onToggleFavorite={() => handleToggleFavorite(item.id)}
              onPress={() => navigation.navigate('MatchDetail', { partner: item, currentUser })}
              onUnlock={() => handleUnlockContact(item)}
              currentUser={currentUser}
            />
          )}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#E91E63']}
              tintColor="#E91E63"
            />
          }
          ListHeaderComponent={
            <View style={styles.headerContainer}>
              <Text style={styles.greetingTitle}>
                أهلاً {userName}، اكتشف شريك حياتك 🌟
              </Text>

              {/* Unified Filter Bar (Matches Web) */}
              <View style={styles.unifiedFilterBar}>
                {/* Governorate Dropdown */}
                <TouchableOpacity
                  style={styles.filterPill}
                  activeOpacity={0.8}
                  onPress={() => setActivePicker('gov')}
                >
                  <Ionicons name="location-outline" size={17} color="#E91E63" />
                  <View style={styles.filterTextCol}>
                    <Text style={styles.filterMiniLabel}>المحافظة</Text>
                    <Text style={styles.filterValueText} numberOfLines={1}>{governorate}</Text>
                  </View>
                  <Ionicons name="chevron-down" size={14} color="#8B94B7" />
                </TouchableOpacity>

                <View style={styles.filterDivider} />

                {/* Marital Status Dropdown */}
                <TouchableOpacity
                  style={styles.filterPill}
                  activeOpacity={0.8}
                  onPress={() => setActivePicker('status')}
                >
                  <Ionicons name="people-outline" size={17} color="#E91E63" />
                  <View style={styles.filterTextCol}>
                    <Text style={styles.filterMiniLabel}>الحالة</Text>
                    <Text style={styles.filterValueText} numberOfLines={1}>{maritalStatus}</Text>
                  </View>
                  <Ionicons name="chevron-down" size={14} color="#8B94B7" />
                </TouchableOpacity>

                <View style={styles.filterDivider} />

                {/* Age Dropdown */}
                <TouchableOpacity
                  style={styles.filterPill}
                  activeOpacity={0.8}
                  onPress={() => setActivePicker('age')}
                >
                  <Ionicons name="calendar-outline" size={17} color="#E91E63" />
                  <View style={styles.filterTextCol}>
                    <Text style={styles.filterMiniLabel}>السن</Text>
                    <Text style={styles.filterValueText} numberOfLines={1}>{ageRange}</Text>
                  </View>
                  <Ionicons name="chevron-down" size={14} color="#8B94B7" />
                </TouchableOpacity>
              </View>

              {/* Active Filters Reset Pill */}
              {(governorate !== 'الكل' || maritalStatus !== 'الكل' || ageRange !== 'الكل') && (
                <TouchableOpacity
                  style={styles.resetFiltersBtn}
                  onPress={() => {
                    setGovernorate('الكل');
                    setMaritalStatus('الكل');
                    setAgeRange('الكل');
                    setLoading(true);
                    fetchData('الكل', 'الكل', 'الكل');
                  }}
                >
                  <Ionicons name="close-circle" size={15} color="#E11D48" />
                  <Text style={styles.resetFiltersText}>إعادة ضبط وتصفير الفلاتر</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="search" size={38} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>لا توجد نتائج مطابقة لبحثك حالياً</Text>
              <Text style={styles.emptySubtitle}>
                جرب تغيير خيارات الفلترة أو اختيار (الكل) في المحافظة والسن لعرض كافة العرايس المتاحة.
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#E91E63" />
                <Text style={styles.footerLoaderText}>جاري تحميل المزيد...</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Filter Bottom Sheet / Modal */}
      <Modal
        visible={activePicker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActivePicker(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setActivePicker(null)}>
                <Ionicons name="close-circle-outline" size={26} color="#8B94B7" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {activePicker === 'gov' ? 'اختر المحافظة' : activePicker === 'status' ? 'اختر الحالة الاجتماعية' : 'اختر الفئة العمرية'}
              </Text>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {(activePicker === 'gov' ? GOVERNORATES : activePicker === 'status' ? MARITAL_STATUSES : AGE_RANGES).map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.modalOption,
                    (activePicker === 'gov' ? governorate : activePicker === 'status' ? maritalStatus : ageRange) === item && styles.modalOptionActive,
                  ]}
                  onPress={() => handleApplyFilter(activePicker, item)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      (activePicker === 'gov' ? governorate : activePicker === 'status' ? maritalStatus : ageRange) === item && styles.modalOptionTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                  {(activePicker === 'gov' ? governorate : activePicker === 'status' ? maritalStatus : ageRange) === item && (
                    <Ionicons name="checkmark-circle" size={18} color="#E91E63" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FE' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 13.5, fontWeight: '700', color: '#64748B' },
  topNavbar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F4F9',
  },
  topNavBrand: { flexDirection: 'row-reverse', alignItems: 'center' },
  navLogo: { width: 34, height: 34, marginLeft: 8 },
  navBrandText: { fontSize: 17, fontWeight: '900', color: '#2D1B4D' },
  navBookmarkBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8F9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { padding: 16, paddingBottom: 40 },
  headerContainer: { marginBottom: 14 },
  greetingTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2D1B4D',
    textAlign: 'right',
    marginBottom: 12,
  },
  unifiedFilterBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#F1F4F9',
    paddingHorizontal: 8,
    paddingVertical: 6,
    ...SHADOWS.small,
  },
  filterPill: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  filterTextCol: { flex: 1, alignItems: 'flex-end', marginHorizontal: 4 },
  filterMiniLabel: { fontSize: 9.5, fontWeight: '700', color: '#8B94B7' },
  filterValueText: { fontSize: 11.5, fontWeight: '800', color: '#2D1B4D' },
  filterDivider: { width: 1, height: 26, backgroundColor: '#E2E8F0' },
  resetFiltersBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
  },
  resetFiltersText: { fontSize: 11.5, fontWeight: '800', color: '#E11D48' },

  // Center Notice Cards (Bride & Incomplete Groom)
  centerCardContainer: { padding: 20, flexGrow: 1, justifyContent: 'center' },
  brideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFE4E6',
    ...SHADOWS.card,
  },
  brideIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brideTitle: { fontSize: 20, fontWeight: '900', color: '#BE123C', textAlign: 'center', marginBottom: 10 },
  brideSubtitle: { fontSize: 13.5, lineHeight: 22, color: '#475569', textAlign: 'center', fontWeight: '700', marginBottom: 10 },
  brideDetails: { fontSize: 12.5, lineHeight: 20, color: '#64748B', textAlign: 'center', fontWeight: '600', marginBottom: 16 },
  brideTipBox: {
    backgroundColor: '#FFF5F8',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#F472B6',
    borderRadius: 16,
    padding: 14,
    width: '100%',
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  brideTipTitle: { fontSize: 12.5, fontWeight: '800', color: '#BE123C', marginBottom: 4, textAlign: 'right' },
  brideTipText: { fontSize: 12, lineHeight: 18, color: '#475569', textAlign: 'right', fontWeight: '600' },
  brideActionBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E91E63',
    borderRadius: 18,
    paddingVertical: 14,
    width: '100%',
    marginBottom: 10,
    ...SHADOWS.small,
  },
  brideActionBtnText: { fontSize: 14.5, fontWeight: '900', color: '#FFFFFF' },
  brideSecondaryBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FE',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    paddingVertical: 12,
    width: '100%',
  },
  brideSecondaryBtnText: { fontSize: 13, fontWeight: '800', color: '#2D1B4D' },

  // Lock Notice Card for Groom
  lockNoticeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFE4E6',
    ...SHADOWS.card,
  },
  lockIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  lockTitle: { fontSize: 19, fontWeight: '900', color: '#2D1B4D', textAlign: 'center', marginBottom: 12 },
  lockDescription: { fontSize: 13.5, lineHeight: 22, color: '#475569', textAlign: 'center', fontWeight: '600', marginBottom: 18 },
  lockStepsBox: {
    backgroundColor: '#FFF5F8',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#F472B6',
    borderRadius: 18,
    padding: 16,
    width: '100%',
    marginBottom: 22,
    alignItems: 'flex-end',
  },
  lockStepsTitle: { fontSize: 13, fontWeight: '900', color: '#BE123C', marginBottom: 8, textAlign: 'right' },
  lockStepItem: { fontSize: 12.5, lineHeight: 20, color: '#475569', textAlign: 'right', fontWeight: '700', marginBottom: 4 },
  fillFormBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E91E63',
    borderRadius: 18,
    paddingVertical: 15,
    width: '100%',
    ...SHADOWS.small,
  },
  fillFormBtnText: { fontSize: 15, fontWeight: '900', color: '#FFFFFF' },

  emptyContainer: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: '#2D1B4D', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20 },
  footerLoader: { flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, gap: 8 },
  footerLoaderText: { fontSize: 12.5, color: '#8B94B7', fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '65%' },
  modalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#2D1B4D' },
  modalScroll: { maxHeight: 350 },
  modalOption: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8F9FE' },
  modalOptionActive: { backgroundColor: '#FFF0F5', borderRadius: 10, paddingHorizontal: 10 },
  modalOptionText: { fontSize: 14, fontWeight: '700', color: '#2D1B4D' },
  modalOptionTextActive: { color: '#E91E63', fontWeight: '900' },
});
