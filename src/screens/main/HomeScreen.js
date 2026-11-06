import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/client';
import PartnerCard from '../../components/PartnerCard';
import { COLORS, SHADOWS } from '../../constants/theme';

const GOV_CHIPS = ['الكل', 'القاهرة', 'الجيزة', 'الإسكندرية', 'الشرقية', 'الدقهلية', 'الغربية'];

export default function HomeScreen({ navigation }) {
  const [matches, setMatches] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedGov, setSelectedGov] = useState('الكل');

  const fetchData = useCallback(async () => {
    try {
      const [matchesRes, favsRes] = await Promise.all([
        api.getMatches().catch(() => ({ matches: [] })),
        api.getFavorites().catch(() => ({ favorites: [] })),
      ]);

      setMatches(matchesRes.matches || matchesRes.data || []);
      const favIds = (favsRes.favorites || favsRes.data || []).map(f => f.id || f.favorite_user_id);
      setFavorites(favIds);
    } catch (e) {
      console.log('Error fetching matches', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const filteredMatches = matches.filter(item => {
    const profile = item.profile || {};
    const nameMatch =
      (profile.nickname || item.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (profile.job || '').toLowerCase().includes(search.toLowerCase());

    const govMatch =
      selectedGov === 'الكل' ||
      (profile.governorate || '').includes(selectedGov);

    return nameMatch && govMatch;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top App Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('FavoritesTab')}
          >
            <Ionicons name="bookmark-outline" size={22} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.brandTitleContainer}>
          <Text style={styles.brandTitle}>نصفي الآخر</Text>
          <Ionicons name="heart" size={16} color={COLORS.primary} style={{ marginLeft: 4 }} />
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={COLORS.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="بحث بالاسم أو الوظيفة..."
            placeholderTextColor={COLORS.textLight}
            value={search}
            onChangeText={setSearch}
            textAlign="right"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Governorate Filter Horizontal Scroll */}
      <View style={styles.chipsSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
        >
          {GOV_CHIPS.map(gov => (
            <TouchableOpacity
              key={gov}
              style={[
                styles.chip,
                selectedGov === gov && styles.chipActive,
              ]}
              onPress={() => setSelectedGov(gov)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedGov === gov && styles.chipTextActive,
                ]}
              >
                {gov}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Matches Feed */}
      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>جاري تحميل الترشيحات المتوافقة...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMatches}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <PartnerCard
              partner={item}
              isFavorite={favorites.includes(item.id)}
              onToggleFavorite={() => handleToggleFavorite(item.id)}
              onPress={() => navigation.navigate('MatchDetail', { partner: item })}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={56} color={COLORS.textLight} />
              <Text style={styles.emptyTitle}>لا توجد نتائج مطابقة</Text>
              <Text style={styles.emptySubtitle}>
                جرب تغيير خيارات البحث أو قم بتحديث القائمة
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  brandTitleContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.secondary,
    letterSpacing: 0.3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: COLORS.text,
    paddingHorizontal: 8,
  },
  chipsSection: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  chipsContent: {
    paddingHorizontal: 16,
    flexDirection: 'row-reverse',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});
