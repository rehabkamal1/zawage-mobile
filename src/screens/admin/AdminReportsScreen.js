import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/client';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function AdminReportsScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending'); // 'all' | 'pending' | 'resolved' | 'dismissed'

  const fetchReports = useCallback(async () => {
    try {
      const data = await api.getAdminReports();
      const list = data.reports || [];
      setReports(list);
    } catch (e) {
      Alert.alert('خطأ', e.message || 'تعذر جلب البلاغات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredReports(reports);
    } else {
      setFilteredReports(reports.filter(r => (r.status || 'pending') === statusFilter));
    }
  }, [statusFilter, reports]);

  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      await api.updateAdminReport(reportId, { status: newStatus });
      Alert.alert('تم بنجاح', 'تم تحديث حالة البلاغ.');
      setReports(prev =>
        prev.map(r => (r.id === reportId ? { ...r, status: newStatus } : r))
      );
    } catch (e) {
      Alert.alert('خطأ', e.message || 'تعذر تحديث البلاغ.');
    }
  };

  const handleBanReported = (report) => {
    const reportedId = report.reported_id || report.reported_user?.id;
    const reportedName = report.reported_user?.name || 'المستخدم';

    Alert.alert(
      'حظر المستخدم المبلغ عنه',
      `هل تود حظر [${reportedName}] نهائياً من المنصة بسبب هذا البلاغ؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد الحظر',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.toggleBanUser(reportedId);
              await api.updateAdminReport(report.id, { status: 'resolved' });
              Alert.alert('تم الحظر', `تم حظر [${reportedName}] وإغلاق البلاغ بنجاح.`);
              setReports(prev =>
                prev.map(r => (r.id === report.id ? { ...r, status: 'resolved' } : r))
              );
            } catch (err) {
              Alert.alert('خطأ', err.message || 'تعذر حظر الحساب.');
            }
          },
        },
      ]
    );
  };

  const renderReportItem = ({ item }) => {
    const isPending = (item.status || 'pending') === 'pending';
    const isResolved = item.status === 'resolved';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.statusBadge,
              isPending && styles.badgePending,
              isResolved && styles.badgeResolved,
              !isPending && !isResolved && styles.badgeDismissed,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isPending && styles.textPending,
                isResolved && styles.textResolved,
                !isPending && !isResolved && styles.textDismissed,
              ]}
            >
              {isPending ? 'قيد المتابعة' : isResolved ? 'تمت المعالجة' : 'تم التجاهل'}
            </Text>
          </View>
          <Text style={styles.dateText}>
            {item.created_at ? new Date(item.created_at).toLocaleDateString('ar-EG') : ''}
          </Text>
        </View>

        <View style={styles.partiesRow}>
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>المُبلّغ ضده:</Text>
            <Text style={styles.partyNameRed}>{item.reported_user?.name || 'حساب محذوف'}</Text>
            <Text style={styles.partyPhone}>{item.reported_user?.phone || ''}</Text>
          </View>
          <Ionicons name="arrow-back" size={16} color="#CBD5E1" />
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>المُشتكي:</Text>
            <Text style={styles.partyName}>{item.user?.name || 'عضو'}</Text>
            <Text style={styles.partyPhone}>{item.user?.phone || ''}</Text>
          </View>
        </View>

        <View style={styles.reasonBox}>
          <Text style={styles.reasonLabel}>محتوى وتفاصيل الشكوى:</Text>
          <Text style={styles.reasonText}>{item.reason || 'لا توجد تفاصيل إضافية'}</Text>
        </View>

        {/* Action Buttons */}
        {isPending && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.btnAction, styles.btnResolve]}
              onPress={() => handleUpdateStatus(item.id, 'resolved')}
            >
              <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
              <Text style={styles.btnActionText}>معالجة</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnAction, styles.btnBan]}
              onPress={() => handleBanReported(item)}
            >
              <Ionicons name="ban" size={16} color="#FFFFFF" />
              <Text style={styles.btnActionText}>حظر المبلغ ضده</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnAction, styles.btnDismiss]}
              onPress={() => handleUpdateStatus(item.id, 'dismissed')}
            >
              <Ionicons name="close" size={16} color="#64748B" />
              <Text style={[styles.btnActionText, { color: '#64748B' }]}>تجاهل</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>إدارة البلاغات والشكاوى</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.tab, statusFilter === 'pending' && styles.tabActive]}
          onPress={() => setStatusFilter('pending')}
        >
          <Text style={[styles.tabText, statusFilter === 'pending' && styles.tabTextActive]}>
            قيد الانتظار ({reports.filter(r => (r.status || 'pending') === 'pending').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, statusFilter === 'resolved' && styles.tabActive]}
          onPress={() => setStatusFilter('resolved')}
        >
          <Text style={[styles.tabText, statusFilter === 'resolved' && styles.tabTextActive]}>المعالجة</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, statusFilter === 'dismissed' && styles.tabActive]}
          onPress={() => setStatusFilter('dismissed')}
        >
          <Text style={[styles.tabText, statusFilter === 'dismissed' && styles.tabTextActive]}>المتجاهلة</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, statusFilter === 'all' && styles.tabActive]}
          onPress={() => setStatusFilter('all')}
        >
          <Text style={[styles.tabText, statusFilter === 'all' && styles.tabTextActive]}>الكل</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#E91E63" />
        </View>
      ) : (
        <FlatList
          data={filteredReports}
          keyExtractor={item => String(item.id)}
          renderItem={renderReportItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="shield-checkmark-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>لا توجد أي بلاغات في هذا القسم.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FE' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F4F9',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#2D1B4D' },
  filterTabs: {
    flexDirection: 'row-reverse',
    backgroundColor: '#F1F5F9',
    padding: 4,
    margin: 16,
    borderRadius: 14,
    gap: 6,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
  tabActive: { backgroundColor: '#E91E63' },
  tabText: { fontSize: 11.5, fontWeight: '700', color: '#64748B' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '800' },
  loadingBox: { padding: 50, alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  badgePending: { backgroundColor: '#FEF3C7' },
  badgeResolved: { backgroundColor: '#DCFCE7' },
  badgeDismissed: { backgroundColor: '#F1F5F9' },
  statusText: { fontSize: 11.5, fontWeight: '800' },
  textPending: { color: '#B45309' },
  textResolved: { color: '#15803D' },
  textDismissed: { color: '#64748B' },
  dateText: { fontSize: 11.5, fontWeight: '600', color: '#94A3B8' },
  partiesRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FE',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  partyBox: { flex: 1, alignItems: 'center' },
  partyLabel: { fontSize: 11, fontWeight: '700', color: '#8B94B7', marginBottom: 2 },
  partyName: { fontSize: 13, fontWeight: '800', color: '#2D1B4D' },
  partyNameRed: { fontSize: 13, fontWeight: '800', color: '#E11D48' },
  partyPhone: { fontSize: 11.5, fontWeight: '600', color: '#64748B', marginTop: 2 },
  reasonBox: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  reasonLabel: { fontSize: 12, fontWeight: '800', color: '#C2410C', textAlign: 'right', marginBottom: 4 },
  reasonText: { fontSize: 12.5, lineHeight: 19, color: '#7C2D12', textAlign: 'right' },
  actionsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F4F9',
  },
  btnAction: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 5,
  },
  btnResolve: { backgroundColor: '#059669', flex: 1 },
  btnBan: { backgroundColor: '#E11D48', flex: 1.2 },
  btnDismiss: { backgroundColor: '#F1F5F9' },
  btnActionText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { marginTop: 10, fontSize: 13.5, fontWeight: '700', color: '#94A3B8' },
});
