import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function AdminDashboardScreen({ navigation }) {
  const { user, isSuperAdmin, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('all'); // 'all' | 'year' | 'month'

  const fetchStats = useCallback(async (currentPeriod = period) => {
    try {
      const data = await api.getAdminStats(currentPeriod);
      setStats(data);
    } catch (e) {
      console.log('Error fetching admin stats', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats(period);
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setLoading(true);
    fetchStats(newPeriod);
  };

  const StatBox = ({ title, value, icon, color, bg }) => (
    <View style={styles.statBox}>
      <View style={[styles.statIconBox, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value ?? 0}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={22} color="#E11D48" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>لوحة تحكم الإدارة</Text>
          <Text style={styles.adminRoleBadge}>
            {isSuperAdmin ? '👑 مدير عام (Super Admin)' : '🛡️ مشرف منصة (Admin)'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E91E63']} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector Tabs */}
        <View style={styles.periodTabs}>
          <TouchableOpacity
            style={[styles.periodTab, period === 'all' && styles.periodTabActive]}
            onPress={() => handlePeriodChange('all')}
          >
            <Text style={[styles.periodTabText, period === 'all' && styles.periodTabTextActive]}>الكل</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodTab, period === 'year' && styles.periodTabActive]}
            onPress={() => handlePeriodChange('year')}
          >
            <Text style={[styles.periodTabText, period === 'year' && styles.periodTabTextActive]}>هذا العام</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodTab, period === 'month' && styles.periodTabActive]}
            onPress={() => handlePeriodChange('month')}
          >
            <Text style={[styles.periodTabText, period === 'month' && styles.periodTabTextActive]}>هذا الشهر</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#E91E63" />
            <Text style={styles.loadingText}>جاري تحميل الإحصائيات...</Text>
          </View>
        ) : (
          <>
            {/* Overview Stats Grid */}
            <View style={styles.statsGrid}>
              <StatBox
                title="إجمالي الأعضاء"
                value={stats?.total_users}
                icon="people"
                color="#E91E63"
                bg="#FFF0F5"
              />
              <StatBox
                title="العرسان (ذكور)"
                value={stats?.males}
                icon="man"
                color="#0284C7"
                bg="#EFF6FF"
              />
              <StatBox
                title="العرائس (إناث)"
                value={stats?.females}
                icon="woman"
                color="#EC4899"
                bg="#FDF2F8"
              />
              <StatBox
                title="الحسابات المحظورة"
                value={stats?.banned_users}
                icon="ban"
                color="#E11D48"
                bg="#FFF1F2"
              />
            </View>

            {/* Pending Reports Card */}
            <TouchableOpacity
              style={styles.alertCard}
              onPress={() => navigation.navigate('AdminReportsTab')}
              activeOpacity={0.88}
            >
              <View style={styles.alertIconBox}>
                <Ionicons name="warning" size={26} color="#D97706" />
              </View>
              <View style={styles.alertDetails}>
                <Text style={styles.alertTitle}>البلاغات والشكاوى المعلقة</Text>
                <Text style={styles.alertDesc}>
                  يوجد حالياً {stats?.pending_reports ?? 0} بلاغ قيد الانتظار يتطلب مراجعتك.
                </Text>
              </View>
              <Ionicons name="chevron-back" size={20} color="#D97706" />
            </TouchableOpacity>

            {/* Subscriptions Overview (Super Admin) */}
            {isSuperAdmin && stats?.subscriptions && (
              <View style={styles.subscriptionsCard}>
                <Text style={styles.cardSectionTitle}>إحصائيات الاشتراكات المفعلة</Text>
                <View style={styles.subGrid}>
                  <View style={styles.subBox}>
                    <Text style={styles.subVal}>{stats.subscriptions.daily ?? 0}</Text>
                    <Text style={styles.subLabel}>الباقة اليومية</Text>
                  </View>
                  <View style={styles.subBox}>
                    <Text style={styles.subVal}>{stats.subscriptions.weekly ?? 0}</Text>
                    <Text style={styles.subLabel}>الباقة الأسبوعية</Text>
                  </View>
                  <View style={styles.subBox}>
                    <Text style={styles.subVal}>{stats.subscriptions.monthly ?? 0}</Text>
                    <Text style={styles.subLabel}>الباقة الشهرية</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Quick Actions Shortcuts */}
            <View style={styles.quickActionsCard}>
              <Text style={styles.cardSectionTitle}>الوصول السريع لمهام الإشراف</Text>

              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => navigation.navigate('AdminUsersTab')}
              >
                <Ionicons name="chevron-back" size={18} color="#8B94B7" />
                <Text style={styles.actionRowText}>إدارة الأعضاء والبحث والحظر</Text>
                <View style={[styles.actionIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="people-outline" size={20} color="#0284C7" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => navigation.navigate('AdminFormsTab')}
              >
                <Ionicons name="chevron-back" size={18} color="#8B94B7" />
                <Text style={styles.actionRowText}>مراجعة الاستمارات والبيانات</Text>
                <View style={[styles.actionIconBox, { backgroundColor: '#FDF2F8' }]}>
                  <Ionicons name="document-text-outline" size={20} color="#E91E63" />
                </View>
              </TouchableOpacity>

              {isSuperAdmin && (
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => navigation.navigate('AdminPaymentsTab')}
                >
                  <Ionicons name="chevron-back" size={18} color="#8B94B7" />
                  <Text style={styles.actionRowText}>إيصالات التحويل وفودافون كاش</Text>
                  <View style={[styles.actionIconBox, { backgroundColor: '#ECFDF5' }]}>
                    <Ionicons name="receipt-outline" size={20} color="#059669" />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FE' },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F4F9',
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#2D1B4D' },
  adminRoleBadge: { fontSize: 11.5, fontWeight: '700', color: '#64748B', marginTop: 2 },
  content: { padding: 18, paddingBottom: 40 },
  periodTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 4,
    borderRadius: 14,
    marginBottom: 18,
    gap: 6,
  },
  periodTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  periodTabActive: { backgroundColor: '#E91E63' },
  periodTabText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  periodTabTextActive: { color: '#FFFFFF', fontWeight: '800' },
  loadingBox: { padding: 50, alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, fontWeight: '700', color: '#8B94B7' },
  statsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  statIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: { fontSize: 24, fontWeight: '900', color: '#2D1B4D' },
  statTitle: { fontSize: 12.5, fontWeight: '700', color: '#8B94B7', marginTop: 4 },
  alertCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
  },
  alertIconBox: { marginLeft: 12 },
  alertDetails: { flex: 1, alignItems: 'flex-end' },
  alertTitle: { fontSize: 14.5, fontWeight: '900', color: '#B45309' },
  alertDesc: { fontSize: 12.5, fontWeight: '600', color: '#92400E', marginTop: 3 },
  subscriptionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
    ...SHADOWS.card,
  },
  cardSectionTitle: { fontSize: 15, fontWeight: '900', color: '#2D1B4D', textAlign: 'right', marginBottom: 14 },
  subGrid: { flexDirection: 'row-reverse', gap: 10 },
  subBox: {
    flex: 1,
    backgroundColor: '#F8F9FE',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  subVal: { fontSize: 18, fontWeight: '900', color: '#E91E63' },
  subLabel: { fontSize: 11.5, fontWeight: '700', color: '#64748B', marginTop: 4 },
  quickActionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    ...SHADOWS.card,
  },
  actionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FE',
  },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  actionRowText: { flex: 1, fontSize: 13.5, fontWeight: '700', color: '#2D1B4D', textAlign: 'right' },
});
