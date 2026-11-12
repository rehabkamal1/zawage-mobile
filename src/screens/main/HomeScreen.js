import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api, getStoredAuthData, saveAuthData } from '../../api/client';
import PartnerCard from '../../components/PartnerCard';
import { COLORS, SHADOWS } from '../../constants/theme';

const GOVERNORATES = [
  'الكل', 'القاهرة', 'الجيزة', 'الإسكندرية', 'الشرقية', 'الدقهلية', 'القليوبية',
  'المنوفية', 'الغربية', 'كفر الشيخ', 'البحيرة', 'دمياط', 'بورسعيد', 'الإسماعيلية',
  'السويس', 'بني سويف', 'الفيوم', 'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان'
];

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

  // Filter States
  const [governorate, setGovernorate] = useState('الكل');
  const [maritalStatus, setMaritalStatus] = useState('الكل');
  const [ageRange, setAgeRange] = useState('الكل');

  // Filter Pickers Modals
  const [activePicker, setActivePicker] = useState(null); // 'gov' | 'status' | 'age' | null

  // Fetch Current User & Matches
  const fetchData = useCallback(async (currentGov = governorate, currentStatus = maritalStatus, currentAge = ageRange) => {
    try {
      let query = '';
      if (currentGov !== 'الكل') query += `governorate=${encodeURIComponent(currentGov)}&`;
      if (currentStatus !== 'الكل') query += `marital_status=${encodeURIComponent(currentStatus)}&`;
      if (currentAge !== 'الكل') query += `age_range=${encodeURIComponent(currentAge)}&`;

      const [matchesRes, meRes, favsRes] = await Promise.all([
        api.getMatches(query).catch(() => ({ matches: [] })),
        api.getMe().catch(() => ({ user: null })),
        api.getFavorites().catch(() => ({ favorites: [] })),
      ]);

      const fetchedMatches = matchesRes.matches || matchesRes.data || [];
      setAllMatches(fetchedMatches);
      setVisibleCount(6);

      if (meRes.user) {
        const updatedUser = {
          ...meRes.user,
          free_views_used: matchesRes.free_views_used ?? meRes.user.free_views_used,
          free_views_allowed: matchesRes.free_views_allowed ?? meRes.user.free_views_allowed,
          free_views_remaining: matchesRes.free_views_remaining ?? meRes.user.free_views_remaining,
        };
        setCurrentUser(updatedUser);
        await saveAuthData(null, updatedUser);
      }

      const favIds = (favsRes.favorites || favsRes.data || []).map(f => f.id || f.favorite_user_id);
      setFavorites(favIds);
    } catch (e) {
      console.log('Error fetching home data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [governorate, maritalStatus, ageRange]);

  useEffect(() => {
    fetchData();
  }, []);

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
      const res = await api.toggleFavorite(partnerId);
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

  // Unlock Partner Contact
  const handleUnlockContact = (partner) => {
    const isMale = currentUser?.gender === 'male';
    const partnerName = partner.profile?.nickname || partner.name;

    Alert.alert(
      'فك قفل بيانات التواصل',
      `هل تود فك قفل استمارة (${partnerName}) للتواصل مع ولي الأمر عبر واتساب؟\nسيتم خصم استمارة واحدة من رصيدك.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد وفك القفل',
          style: 'default',
          onPress: async () => {
            try {
              const res = await api.unlockContact(partner.id);
              Alert.alert('تهانينا 🎉', res.message || 'تم فك القفل بنجاح، يمكنك الآن التواصل عبر واتساب.');

              // Update partner in local state
              setAllMatches(prev => prev.map(p => p.id === partner.id ? { ...p, is_unlocked: true, phone: res.phone || p.phone } : p));

              // Update user quota
              fetchData(governorate, maritalStatus, ageRange);
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

  const isMale = currentUser?.gender === 'male';
  const freeViewsRemaining = currentUser?.free_views_remaining ?? 3;
  const activeSub = currentUser?.active_subscription;
  const displayedMatches = allMatches.slice(0, visibleCount);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Application Bar with Logo & Branding */}
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
            {/* User Greeting Title (Matches Web) */}
            <Text style={styles.greetingTitle}>
              {isMale
                ? `أهلاً ${currentUser?.profile?.nickname || currentUser?.name || 'بك'}، اكتشف شريك حياتك`
                : `أهلاً ${currentUser?.profile?.nickname || currentUser?.name || 'بك'}، ملفك متاح للبحث`}
            </Text>

            {/* Unified Filter Bar (Matches Web .unified-filter-bar) */}
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

              {/* Age Range Dropdown */}
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

            {/* Quota Banner 1: Free Attempts Available */}
            {isMale && !activeSub && freeViewsRemaining > 0 && (
              <View style={styles.freeQuotaBanner}>
                <View style={styles.bannerRow}>
                  <View style={styles.giftIconCircle}>
                    <Text style={{ fontSize: 20 }}>🎁</Text>
                  </View>
                  <View style={styles.bannerTextCol}>
                    <Text style={styles.bannerTitle}>
                      هدية التسجيل: 3 استمارات مجانية 🌸
                    </Text>
                    <Text style={styles.bannerSubtitle}>
                      يظهر لك حالياً أفضل 10 استمارات توافقاً، ومعك 3 محاولات مجانية لفك القفل والتواصل عبر واتساب.
                    </Text>
                  </View>
                </View>
                <View style={styles.quotaPillBadge}>
                  <Text style={styles.quotaPillText}>
                    رصيد فك القفل المجاني:{' '}
                    <Text style={{ color: '#BE123C', fontWeight: '900' }}>
                      {freeViewsRemaining} من 3 استمارات
                    </Text>
                  </Text>
                </View>
              </View>
            )}

            {/* Quota Banner 2: Free Attempts Exhausted */}
            {isMale && !activeSub && freeViewsRemaining <= 0 && (
              <View style={styles.exhaustedQuotaBanner}>
                <View style={styles.bannerRow}>
                  <View style={styles.warningIconCircle}>
                    <Text style={{ fontSize: 20 }}>⚠️</Text>
                  </View>
                  <View style={styles.bannerTextCol}>
                    <Text style={[styles.bannerTitle, { color: '#9F1239' }]}>
                      انتهت محاولاتك المجانية (3 من 3 استمارات)
                    </Text>
                    <Text style={[styles.bannerSubtitle, { color: '#881337' }]}>
                      لقد استهلكت رصيدك المجاني بالكامل. للاستمرار في فك قفل استمارات جديدة والتواصل، يمكنك الاشتراك في إحدى باقاتنا.
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.subscribeNowBtn}
                  onPress={() => navigation.navigate('SubscriptionsTab')}
                >
                  <Ionicons name="card-outline" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  <Text style={styles.subscribeNowText}>اشترك في باقة الآن 🚀</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Quota Banner 3: Active Subscription */}
            {isMale && activeSub && (
              <View style={styles.activeSubBanner}>
                <View style={styles.bannerRow}>
                  <View style={styles.crownIconCircle}>
                    <Text style={{ fontSize: 20 }}>👑</Text>
                  </View>
                  <View style={styles.bannerTextCol}>
                    <Text style={[styles.bannerTitle, { color: '#2D1B4D' }]}>
                      باقتك مفعلة بنجاح ✨ (
                      {activeSub.type === 'daily'
                        ? 'باقة يومية - 10 استمارات'
                        : activeSub.type === 'weekly'
                        ? 'باقة أسبوعية - 20 استمارة'
                        : 'باقة شهرية - 50 استمارة'}
                      )
                    </Text>
                    <Text style={styles.bannerSubtitle}>
                      يظهر لك استمارات الشركاء وفقاً لباقاتك، ويمكنك فك قفل استمارات العرايس والتواصل عبر واتساب.
                    </Text>
                  </View>
                </View>
                <View style={styles.quotaPillBadge}>
                  <Text style={styles.quotaPillText}>
                    رصيد التواصل المتبقي:{' '}
                    <Text style={{ color: '#BE123C', fontWeight: '900' }}>
                      {Math.max(0, (activeSub.views_allowed || 0) - (activeSub.views_used || 0))} استمارة
                    </Text>
                  </Text>
                </View>
              </View>
            )}

            {/* Matches Count & Infinite Scroll Indicator (Matches Web) */}
            {!loading && allMatches.length > 0 && (
              <View style={styles.countSummaryRow}>
                <Text style={styles.countSummaryText}>
                  عرض {Math.min(visibleCount, allMatches.length)} من إجمالي {allMatches.length} استمارة شريك
                </Text>
                <View style={styles.infiniteScrollTag}>
                  <Text style={styles.infiniteScrollTagText}>
                    {visibleCount < allMatches.length ? 'تمرير تلقائي (Infinite Scroll)' : 'تم تحميل جميع الاستمارات'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        }
        ListFooterComponent={
          allMatches.length > 0 ? (
            <View style={styles.footerContainer}>
              {visibleCount < allMatches.length ? (
                loadingMore ? (
                  <View style={styles.loadingMoreRow}>
                    <ActivityIndicator size="small" color="#E91E63" />
                    <Text style={styles.loadingMoreText}>جاري تحميل المزيد من الاستمارات...</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.btnLoadMore}
                    onPress={() => setVisibleCount(prev => Math.min(prev + 6, allMatches.length))}
                  >
                    <Text style={styles.btnLoadMoreText}>
                      عرض المزيد من الاستمارات ({allMatches.length - visibleCount} متبقية) ⬇️
                    </Text>
                  </TouchableOpacity>
                )
              ) : (
                <Text style={styles.allLoadedText}>
                  ✨ تم استعراض كافة الاستمارات المتاحة ({allMatches.length} استمارة)
                </Text>
              )}
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#E91E63" />
              <Text style={styles.emptyText}>جاري تحميل الشركاء المتوافقين...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={44} color="#CBD5E1" />
              <Text style={styles.emptyText}>لا يوجد شركاء متاحين حالياً يطابقون بحثك.</Text>
            </View>
          )
        }
      />

      {/* Filter Selection Modal Sheet */}
      <Modal
        visible={activePicker !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setActivePicker(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setActivePicker(null)}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {activePicker === 'gov' ? 'اختر المحافظة' : activePicker === 'status' ? 'اختر الحالة الاجتماعية' : 'اختر السن'}
            </Text>

            <ScrollView style={{ maxHeight: 340 }}>
              {(activePicker === 'gov'
                ? GOVERNORATES
                : activePicker === 'status'
                ? MARITAL_STATUSES
                : AGE_RANGES
              ).map(item => {
                const isSelected =
                  activePicker === 'gov'
                    ? governorate === item
                    : activePicker === 'status'
                    ? maritalStatus === item
                    : ageRange === item;

                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.modalOption, isSelected && styles.modalOptionActive]}
                    onPress={() => handleApplyFilter(activePicker, item)}
                  >
                    <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextActive]}>
                      {item}
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={18} color="#E91E63" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  topNavbar: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F4F9',
  },
  topNavBrand: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  navLogo: {
    width: 32,
    height: 32,
    marginLeft: 8,
  },
  navBrandText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2D1B4D',
    letterSpacing: -0.3,
  },
  navBookmarkBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FE',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 8,
  },
  greetingTitle: {
    fontSize: 18.5,
    fontWeight: '900',
    color: '#2D1B4D',
    textAlign: 'right',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  unifiedFilterBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E8ECF4',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    ...SHADOWS.small,
  },
  filterPill: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  filterTextCol: {
    alignItems: 'flex-end',
  },
  filterMiniLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8B94B7',
  },
  filterValueText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#2D1B4D',
    maxWidth: 68,
  },
  filterDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E8ECF4',
    marginHorizontal: 4,
  },
  freeQuotaBanner: {
    backgroundColor: '#FFF0F5',
    borderWidth: 1.5,
    borderColor: '#FBCFE8',
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  exhaustedQuotaBanner: {
    backgroundColor: '#FFF1F2',
    borderWidth: 2,
    borderColor: '#F43F5E',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  activeSubBanner: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
    borderColor: '#F3C4D8',
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  bannerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  giftIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  warningIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDF2F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  bannerTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#2D1B4D',
    textAlign: 'right',
    marginBottom: 3,
  },
  bannerSubtitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'right',
    lineHeight: 17,
  },
  quotaPillBadge: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FBCFE8',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  quotaPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E91E63',
  },
  subscribeNowBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E11D48',
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 6,
  },
  subscribeNowText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  countSummaryRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  countSummaryText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  infiniteScrollTag: {
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  infiniteScrollTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E91E63',
  },
  footerContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMoreRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E91E63',
  },
  btnLoadMore: {
    backgroundColor: '#FFF0F5',
    borderWidth: 1.5,
    borderColor: '#E91E63',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 22,
  },
  btnLoadMoreText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#E91E63',
  },
  allLoadedText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#94A3B8',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B94B7',
    marginTop: 12,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 44,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2D1B4D',
    textAlign: 'center',
    marginBottom: 14,
  },
  modalOption: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 4,
  },
  modalOptionActive: {
    backgroundColor: '#FFF0F5',
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D1B4D',
  },
  modalOptionTextActive: {
    color: '#E91E63',
    fontWeight: '900',
  },
});
