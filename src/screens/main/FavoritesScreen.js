import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api, getStoredAuthData } from '../../api/client';
import PartnerCard from '../../components/PartnerCard';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function FavoritesScreen({ navigation }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const fetchFavorites = useCallback(async () => {
    try {
      const [favRes, meRes] = await Promise.all([
        api.getFavorites().catch(() => ({ favorites: [] })),
        api.getMe().catch(() => ({ user: null })),
      ]);

      setFavorites(favRes.favorites || favRes.data || []);
      if (meRes.user) setCurrentUser(meRes.user);
    } catch (e) {
      console.log('Error fetching favorites', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFavorites();
  };

  const handleToggleFavorite = async (partnerId) => {
    try {
      await api.toggleFavorite(partnerId);
      // Remove from local list immediately
      setFavorites(prev => prev.filter(item => (item.id || item.favorite_user_id) !== partnerId));
    } catch (e) {
      console.log('Toggle favorite error', e);
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
              Alert.alert('تهانينا 🎉', res.message || 'تم فك القفل بنجاح.');
              fetchFavorites();
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header (Matches Web) */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>قائمة المفضلات</Text>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={item => String(item.id || item.favorite_user_id)}
        renderItem={({ item }) => (
          <PartnerCard
            partner={item}
            isFavorite={true}
            onToggleFavorite={() => handleToggleFavorite(item.id || item.favorite_user_id)}
            onPress={() => navigation.navigate('MatchDetail', { partner: item, currentUser })}
            onUnlock={() => handleUnlockContact(item)}
            currentUser={currentUser}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#E91E63']}
            tintColor="#E91E63"
          />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#E91E63" />
              <Text style={styles.emptyText}>جاري تحميل قائمة المفضلات...</Text>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyHeartCircle}>
                <Ionicons name="heart-dislike-outline" size={44} color="#E91E63" />
              </View>
              <Text style={styles.emptyTitle}>لا توجد استمارات في المفضلة حالياً</Text>
              <Text style={styles.emptyDesc}>
                يمكنك الضغط على علامة القلب في أي استمارة بالصفحة الرئيسية لحفظها هنا والعودة إليها لاحقاً.
              </Text>
            </View>
          )
        }
      />
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
  listContent: {
    padding: 16,
    paddingBottom: 40,
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
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#F1F4F9',
    ...SHADOWS.card,
  },
  emptyHeartCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2D1B4D',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B94B7',
    textAlign: 'center',
    lineHeight: 20,
  },
});
