import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useAlert } from '../../context/AlertContext';
import PartnerCard from '../../components/PartnerCard';
import { APP_CONFIG } from '../../constants/config';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function HomeScreen({ navigation }) {
  const { showConfirm, showSuccess, showError, showWarning } = useAlert();
  const [currentUser, setCurrentUser] = useState(null);
  const [allMatches, setAllMatches] = useState([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [matchTab, setMatchTab] = useState('new'); // 'new' | 'unlocked' | 'all'
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [requiresForm, setRequiresForm] = useState(false);

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
  const fetchData = useCallback(async () => {
    try {
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
          const matchesRes = await api.getMatches();
          const fetchedMatches = matchesRes.matches || matchesRes.data || [];
          setAllMatches(fetchedMatches);
          setRequiresForm(false);
          setVisibleCount(10);

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
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
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

  const uncontactedMatches = useMemo(() => allMatches.filter(m => !m.is_unlocked), [allMatches]);
  const unlockedMatches = useMemo(() => allMatches.filter(m => m.is_unlocked), [allMatches]);
  const activeTabMatches = matchTab === 'new' ? uncontactedMatches : (matchTab === 'unlocked' ? unlockedMatches : allMatches);
  const displayedMatches = activeTabMatches.slice(0, visibleCount);

  const handleLoadMore = () => {
    if (visibleCount < activeTabMatches.length && !loadingMore) {
      setLoadingMore(true);
      setTimeout(() => {
        setVisibleCount(prev => Math.min(prev + 10, activeTabMatches.length));
        setLoadingMore(false);
      }, 250);
    }
  };

  const handleUnlockContact = (partner) => {
    showConfirm({
      type: 'question',
      title: 'فك قفل بيانات التواصل',
      message: `هل تود فك قفل استمارة (${partner.profile?.nickname || partner.name}) للتواصل مع ولي الأمر عبر واتساب؟\nسيتم استهلاك 1 استمارة من رصيدك.`,
      confirmText: 'نعم، فك القفل الآن',
      cancelText: 'إلغاء',
      confirmButtonColor: '#E91E63',
      onConfirm: async () => {
        try {
          const res = await api.unlockContact(partner.id);
          const msg = res.is_free_attempt
            ? `تم فك قفل هذه الاستمارة بنجاح من رصيدك المجاني 🎁\nالمتبقي لديك: ${res.remaining ?? 0} من أصل ${res.views_allowed ?? 3} استمارات مجانية.`
            : `تم خصم محاولة واحدة من رصيد باقتك 💳\nالمتبقي: ${res.remaining ?? 0} من أصل ${res.views_allowed ?? 0} محاولات.`;

          showSuccess('تم فك القفل بنجاح! 🔓', msg);
          setAllMatches(prev => prev.map(m => m.id === partner.id ? { ...m, is_unlocked: true, phone: res.phone } : m));
          fetchData();
        } catch (err) {
          const msg = err.message || 'تعذر فك القفل';
          if (err.data?.requires_subscription || err.data?.limit_reached) {
            showConfirm({
              type: 'warning',
              title: err.data?.requires_subscription ? 'انتهت المحاولات المجانية (3 استمارات) ⚠️' : 'انتهى رصيد الباقة ⚠️',
              message: msg,
              confirmText: 'الاشتراك في باقة الآن 🚀',
              cancelText: 'إلغاء',
              confirmButtonColor: '#8B5CF6',
              onConfirm: () => navigation.navigate('SubscriptionsTab'),
            });
          } else if (err.data?.requires_form) {
            showConfirm({
              type: 'warning',
              title: 'يجب ملء الاستمارة أولاً',
              message: msg || 'يجب ملء استمارتك أولاً لتتمكن من التواصل مع العروس.',
              confirmText: 'ملء الاستمارة الآن',
              cancelText: 'إلغاء',
              confirmButtonColor: '#E91E63',
              onConfirm: () => navigation.navigate('EditProfileTab'),
            });
          } else {
            showError('تنبيه', msg);
          }
        }
      },
    });
  };

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

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            style={[styles.navBookmarkBtn, { marginLeft: 8 }]}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={22} color="#2D1B4D" />
          </TouchableOpacity>
          {isMale && (
            <TouchableOpacity
              style={styles.navBookmarkBtn}
              onPress={() => navigation.navigate('FavoritesTab')}
            >
              <Ionicons name="bookmark-outline" size={22} color="#2D1B4D" />
            </TouchableOpacity>
          )}
        </View>
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

              {/* Discovery Tabs: New vs Unlocked vs All */}
              <View style={styles.tabBarContainer}>
                <TouchableOpacity
                  style={[styles.tabBtn, matchTab === 'new' && styles.tabBtnActiveNew]}
                  onPress={() => { setMatchTab('new'); setVisibleCount(10); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabBtnText, matchTab === 'new' && styles.tabBtnTextActive]}>
                    استمارات جديدة ✨
                  </Text>
                  <View style={[styles.tabBadge, matchTab === 'new' && styles.tabBadgeActive]}>
                    <Text style={[styles.tabBadgeText, matchTab === 'new' && styles.tabBadgeTextActive]}>
                      {uncontactedMatches.length}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabBtn, matchTab === 'unlocked' && styles.tabBtnActiveUnlocked]}
                  onPress={() => { setMatchTab('unlocked'); setVisibleCount(10); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabBtnText, matchTab === 'unlocked' && styles.tabBtnTextActive]}>
                    تم فك قفلها 🔓
                  </Text>
                  <View style={[styles.tabBadge, matchTab === 'unlocked' && styles.tabBadgeActive]}>
                    <Text style={[styles.tabBadgeText, matchTab === 'unlocked' && styles.tabBadgeTextActive]}>
                      {unlockedMatches.length}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabBtn, matchTab === 'all' && styles.tabBtnActiveAll]}
                  onPress={() => { setMatchTab('all'); setVisibleCount(10); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabBtnText, matchTab === 'all' && styles.tabBtnTextActive]}>
                    الكل
                  </Text>
                  <View style={[styles.tabBadge, matchTab === 'all' && styles.tabBadgeActive]}>
                    <Text style={[styles.tabBadgeText, matchTab === 'all' && styles.tabBadgeTextActive]}>
                      {allMatches.length}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Progress Count Summary */}
              {activeTabMatches.length > 0 && (
                <View style={styles.countSummaryRow}>
                  <Text style={styles.countSummaryText}>
                    عرض {Math.min(visibleCount, activeTabMatches.length)} من إجمالي {activeTabMatches.length} استمارة
                  </Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>
                      {visibleCount < activeTabMatches.length ? '10 استمارات بالدفعة ⬇️' : 'تم استعراض الكل'}
                    </Text>
                  </View>
                </View>
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
            <View style={{ paddingVertical: 12, alignItems: 'center' }}>
              {loadingMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color="#E91E63" />
                  <Text style={styles.footerLoaderText}>جاري تحميل المزيد من الاستمارات...</Text>
                </View>
              ) : visibleCount < activeTabMatches.length ? (
                <TouchableOpacity
                  style={styles.loadMoreBtn}
                  onPress={handleLoadMore}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-down-circle-outline" size={18} color="#E91E63" />
                  <Text style={styles.loadMoreBtnText}>
                    عرض 10 استمارات إضافية ({activeTabMatches.length - visibleCount} متبقية) ⬇️
                  </Text>
                </TouchableOpacity>
              ) : activeTabMatches.length > 0 ? (
                <Text style={styles.allLoadedText}>
                  ✨ تم استعراض كافة الاستمارات المتاحة ({activeTabMatches.length} استمارة)
                </Text>
              ) : null}
            </View>
          }
        />
      )}
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
  headerContainer: { marginBottom: 12 },
  greetingTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2D1B4D',
    textAlign: 'right',
    marginBottom: 6,
  },

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

  tabBarContainer: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 14,
    marginBottom: 10,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F1F4F9',
    gap: 5,
    ...SHADOWS.small,
  },
  tabBtnActiveNew: {
    backgroundColor: '#E91E63',
    borderColor: '#E91E63',
  },
  tabBtnActiveUnlocked: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  tabBtnActiveAll: {
    backgroundColor: '#2D1B4D',
    borderColor: '#2D1B4D',
  },
  tabBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#475569',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  tabBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },
  countSummaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  countSummaryText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  countBadge: {
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E91E63',
  },
  loadMoreBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F5',
    borderWidth: 1.5,
    borderColor: '#E91E63',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 22,
    gap: 8,
    marginVertical: 10,
    ...SHADOWS.small,
  },
  loadMoreBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E91E63',
  },
  allLoadedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 12,
  },
});
