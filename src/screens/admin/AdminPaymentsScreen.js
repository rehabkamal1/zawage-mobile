import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  TextInput,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, API_BASE_URL } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function AdminPaymentsScreen({ navigation }) {
  const { isSuperAdmin } = useAuth();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending'); // 'all' | 'pending' | 'completed' | 'failed'

  // Image Preview Modal
  const [previewImage, setPreviewImage] = useState(null);

  // Reject Modal
  const [rejectingPayment, setRejectingPayment] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  const fetchPayments = useCallback(async () => {
    try {
      const data = await api.getAdminPayments();
      const list = data.payments || [];
      setPayments(list);
    } catch (e) {
      Alert.alert('خطأ', e.message || 'تعذر جلب إيصالات الدفع');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredPayments(payments);
    } else {
      setFilteredPayments(payments.filter(p => p.status === statusFilter));
    }
  }, [statusFilter, payments]);

  const handleApprove = (payment) => {
    Alert.alert(
      'تأكيد اعتماد الدفع',
      `هل تود تفعيل باقة (${payment.subscription?.type || 'المختارة'}) للمشترك [${payment.user?.name}]؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'اعتماد وتفعيل',
          style: 'default',
          onPress: async () => {
            try {
              const res = await api.approvePayment(payment.id);
              Alert.alert('تم بنجاح 🎉', res.message || 'تم اعتماد الدفع وتفعيل الباقة بنجاح!');
              setPayments(prev =>
                prev.map(p => (p.id === payment.id ? { ...p, status: 'completed' } : p))
              );
            } catch (err) {
              Alert.alert('خطأ', err.message || 'تعذر اعتماد الدفع.');
            }
          },
        },
      ]
    );
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة سبب رفض الإيصال للمشترك.');
      return;
    }

    setSubmittingReject(true);
    try {
      const res = await api.rejectPayment(rejectingPayment.id, rejectionReason.trim());
      Alert.alert('تم الرفض', res.message || 'تم رفض الإيصال بنجاح.');
      setPayments(prev =>
        prev.map(p =>
          p.id === rejectingPayment.id
            ? { ...p, status: 'failed', rejection_reason: rejectionReason.trim() }
            : p
        )
      );
      setRejectingPayment(null);
      setRejectionReason('');
    } catch (err) {
      Alert.alert('خطأ', err.message || 'تعذر رفض الإيصال.');
    } finally {
      setSubmittingReject(false);
    }
  };

  const renderPaymentItem = ({ item }) => {
    const isPending = item.status === 'pending';
    const isCompleted = item.status === 'completed';
    const isFailed = item.status === 'failed';

    const rawReceipt = item.receipt_image || item.receipt_url;
    let fullImageUrl = null;
    if (rawReceipt) {
      if (rawReceipt.startsWith('http')) {
        fullImageUrl = rawReceipt;
      } else {
        fullImageUrl = `https://mynosfi.com/storage/${rawReceipt.replace(/^\/+/, '')}`;
      }
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.statusBadge,
              isPending && styles.statusBadgePending,
              isCompleted && styles.statusBadgeCompleted,
              isFailed && styles.statusBadgeFailed,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isPending && styles.statusTextPending,
                isCompleted && styles.statusTextCompleted,
                isFailed && styles.statusTextFailed,
              ]}
            >
              {isPending ? 'قيد المراجعة' : isCompleted ? 'معتمد ومفعل' : 'مرفوض'}
            </Text>
          </View>
          <Text style={styles.userName}>{item.user?.name || 'مشترك'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoValue}>{item.amount} جنيه مصري</Text>
          <Text style={styles.infoLabel}>المبلغ:</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoValue}>{item.subscription?.type || 'باقة'}</Text>
          <Text style={styles.infoLabel}>نوع الباقة:</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoValue}>{item.sender_phone || 'غير مسجل'}</Text>
          <Text style={styles.infoLabel}>رقم المحفظة المحول منها:</Text>
        </View>

        {item.transaction_reference && (
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{item.transaction_reference}</Text>
            <Text style={styles.infoLabel}>رقم الحوالة/المرجع:</Text>
          </View>
        )}

        {/* Receipt Image Button */}
        {fullImageUrl ? (
          <TouchableOpacity
            style={styles.viewReceiptBtn}
            onPress={() => setPreviewImage(fullImageUrl)}
          >
            <Ionicons name="image-outline" size={18} color="#0284C7" />
            <Text style={styles.viewReceiptText}>معاينة صورة الإيصال المرفق</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.noReceiptText}>لم يتم إرفاق صورة إيصال</Text>
        )}

        {isFailed && item.rejection_reason && (
          <View style={styles.rejectionBox}>
            <Text style={styles.rejectionTitle}>سبب الرفض المسجل:</Text>
            <Text style={styles.rejectionText}>{item.rejection_reason}</Text>
          </View>
        )}

        {/* Action Buttons for Pending */}
        {isPending && isSuperAdmin && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.btnAction, styles.btnApprove]}
              onPress={() => handleApprove(item)}
            >
              <Ionicons name="checkmark-circle" size={17} color="#FFFFFF" />
              <Text style={styles.btnActionText}>اعتماد وتفعيل</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnAction, styles.btnReject]}
              onPress={() => setRejectingPayment(item)}
            >
              <Ionicons name="close-circle" size={17} color="#FFFFFF" />
              <Text style={styles.btnActionText}>رفض الإيصال</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>إيصالات وتحويلات فودافون كاش</Text>
      </View>

      {/* Status Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.tab, statusFilter === 'pending' && styles.tabActive]}
          onPress={() => setStatusFilter('pending')}
        >
          <Text style={[styles.tabText, statusFilter === 'pending' && styles.tabTextActive]}>
            قيد الانتظار ({payments.filter(p => p.status === 'pending').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, statusFilter === 'completed' && styles.tabActive]}
          onPress={() => setStatusFilter('completed')}
        >
          <Text style={[styles.tabText, statusFilter === 'completed' && styles.tabTextActive]}>المعتمدة</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, statusFilter === 'failed' && styles.tabActive]}
          onPress={() => setStatusFilter('failed')}
        >
          <Text style={[styles.tabText, statusFilter === 'failed' && styles.tabTextActive]}>المرفوضة</Text>
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
          data={filteredPayments}
          keyExtractor={item => String(item.id)}
          renderItem={renderPaymentItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="receipt-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>لا توجد أي إيصالات في هذه الحالة.</Text>
            </View>
          }
        />
      )}

      {/* Full Image Preview Modal */}
      <Modal visible={Boolean(previewImage)} transparent animationType="fade">
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity style={styles.closeImageBtn} onPress={() => setPreviewImage(null)}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          {previewImage && (
            <Image source={{ uri: previewImage }} style={styles.fullImage} resizeMode="contain" />
          )}
        </View>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal visible={Boolean(rejectingPayment)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>رفض إيصال التحويل</Text>
            <Text style={styles.modalSubtitle}>
              المشترك: {rejectingPayment?.user?.name} ({rejectingPayment?.amount} ج.م)
            </Text>

            <TextInput
              style={styles.reasonInput}
              placeholder="اكتب سبب الرفض (مثال: رقم الحوالة غير مطابق، أو لم يصل المبلغ على المحفظة)..."
              placeholderTextColor="#94A3B8"
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={4}
              textAlign="right"
            />

            <View style={styles.modalBtnsRow}>
              <TouchableOpacity
                style={[styles.btnAction, styles.btnReject, { flex: 1 }]}
                onPress={handleConfirmReject}
                disabled={submittingReject}
              >
                {submittingReject ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.btnActionText}>تأكيد الرفض</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRejectingPayment(null)}
              >
                <Text style={styles.modalCancelText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  userName: { fontSize: 16, fontWeight: '900', color: '#2D1B4D' },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  statusBadgePending: { backgroundColor: '#FEF3C7' },
  statusBadgeCompleted: { backgroundColor: '#DCFCE7' },
  statusBadgeFailed: { backgroundColor: '#FEE2E2' },
  statusBadgeText: { fontSize: 11.5, fontWeight: '800' },
  statusTextPending: { color: '#B45309' },
  statusTextCompleted: { color: '#15803D' },
  statusTextFailed: { color: '#B91C1C' },
  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FE',
  },
  infoLabel: { fontSize: 13, fontWeight: '600', color: '#8B94B7' },
  infoValue: { fontSize: 13, fontWeight: '800', color: '#2D1B4D' },
  viewReceiptBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    marginTop: 12,
    gap: 6,
  },
  viewReceiptText: { fontSize: 12.5, fontWeight: '800', color: '#0284C7' },
  noReceiptText: { fontSize: 12, fontWeight: '600', color: '#94A3B8', textAlign: 'center', marginTop: 10 },
  rejectionBox: {
    backgroundColor: '#FFF1F2',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },
  rejectionTitle: { fontSize: 12, fontWeight: '800', color: '#E11D48', textAlign: 'right' },
  rejectionText: { fontSize: 12, color: '#9F1239', textAlign: 'right', marginTop: 2 },
  actionsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F4F9',
  },
  btnAction: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  btnApprove: { backgroundColor: '#059669' },
  btnReject: { backgroundColor: '#E11D48' },
  btnActionText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { marginTop: 10, fontSize: 13.5, fontWeight: '700', color: '#94A3B8' },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeImageBtn: {
    position: 'absolute',
    top: 45,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: { width: '92%', height: '80%' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    ...SHADOWS.card,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#2D1B4D', textAlign: 'center' },
  modalSubtitle: { fontSize: 13, fontWeight: '600', color: '#64748B', textAlign: 'center', marginTop: 4, marginBottom: 16 },
  reasonInput: {
    backgroundColor: '#F8F9FE',
    borderWidth: 1.5,
    borderColor: '#E8ECF4',
    borderRadius: 14,
    padding: 12,
    fontSize: 13.5,
    color: '#2D1B4D',
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalBtnsRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  modalCancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  modalCancelText: { fontSize: 13.5, fontWeight: '800', color: '#64748B' },
});
