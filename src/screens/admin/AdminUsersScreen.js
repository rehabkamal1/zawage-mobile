import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function AdminUsersScreen({ navigation }) {
  const { user: currentAdmin, isSuperAdmin } = useAuth();
  const { showConfirm, showSuccess, showError } = useAlert();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'male' | 'female' | 'admins'

  // Role Change Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [changingRole, setChangingRole] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await api.getAdminUsers();
      const list = data.users || [];
      setUsers(list);
      setFilteredUsers(list);
    } catch (e) {
      showError('خطأ', e.message || 'تعذر جلب قائمة المستخدمين');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Apply filters and search
  useEffect(() => {
    let result = users;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(u =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
      );
    }

    if (activeTab === 'members' || activeTab === 'all') {
      result = result.filter(u => u.role === 'user');
    } else if (activeTab === 'male') {
      result = result.filter(u => u.gender === 'male' && u.role === 'user');
    } else if (activeTab === 'female') {
      result = result.filter(u => u.gender === 'female' && u.role === 'user');
    } else if (activeTab === 'admins') {
      result = result.filter(u => u.role === 'admin' || u.role === 'super_admin');
    }

    setFilteredUsers(result);
  }, [search, activeTab, users]);

  const handleToggleBan = (targetUser) => {
    const isBanned = Boolean(targetUser.is_banned);
    showConfirm({
      type: isBanned ? 'question' : 'warning',
      title: isBanned ? 'تأكيد فك الحظر' : 'تأكيد حظر المستخدم',
      message: `هل أنت متأكد من ${isBanned ? 'فك حظر الحساب والسماح له بالدخول' : 'حظر هذا الحساب ومنعه من استخدام التطبيق'} [${targetUser.name}]؟`,
      confirmText: isBanned ? 'نعم، فك الحظر' : 'نعم، حظر الحساب',
      confirmButtonColor: isBanned ? '#10B981' : '#EF4444',
      cancelText: 'إلغاء',
      onConfirm: async () => {
        try {
          const res = await api.toggleBanUser(targetUser.id);
          showSuccess('تم بنجاح 🎉', res.message || 'تم تحديث حالة الحساب بنجاح.');
          setUsers(prev =>
            prev.map(u => (u.id === targetUser.id ? { ...u, is_banned: !isBanned } : u))
          );
        } catch (err) {
          showError('خطأ', err.message || 'تعذر تعديل حالة الحساب.');
        }
      },
    });
  };

  const handleDeleteUser = (targetUser) => {
    showConfirm({
      type: 'error',
      title: 'حذف المستخدم نهائياً ⚠️',
      message: `تحذير هام: سيتم حذف كافة بيانات [${targetUser.name}] واستمارته نهائياً ولا يمكن التراجع عن هذا الإجراء!`,
      confirmText: 'نعم، حذف نهائي',
      confirmButtonColor: '#EF4444',
      cancelText: 'إلغاء',
      onConfirm: async () => {
        try {
          await api.deleteAdminUser(targetUser.id);
          showSuccess('تم الحذف', 'تم حذف المستخدم وبياناته نهائياً.');
          setUsers(prev => prev.filter(u => u.id !== targetUser.id));
        } catch (err) {
          showError('خطأ', err.message || 'تعذر حذف المستخدم.');
        }
      },
    });
  };

  const handleApplyRoleChange = async (newRole) => {
    if (!selectedUser) return;
    setChangingRole(true);
    try {
      const res = await api.changeUserRole(selectedUser.id, newRole);
      showSuccess('تم بنجاح 🎉', res.message || 'تم تعديل صلاحية الحساب.');
      setUsers(prev =>
        prev.map(u => (u.id === selectedUser.id ? { ...u, role: newRole } : u))
      );
      setShowRoleModal(false);
    } catch (err) {
      showError('خطأ', err.message || 'تعذر تغيير الصلاحية.');
    } finally {
      setChangingRole(false);
    }
  };

  const handleChangeGender = (targetUser) => {
    const nextGender = targetUser.gender === 'male' ? 'female' : 'male';
    const nextLabel = nextGender === 'male' ? 'عريس 👔' : 'عروسة 🌸';
    const currentLabel = targetUser.gender === 'male' ? 'عريس' : 'عروسة';

    showConfirm({
      type: 'question',
      title: 'تحويل نوع الحساب / الاستمارة',
      message: `هل تود تحويل حساب [${targetUser.name}] من (${currentLabel}) إلى (${nextLabel})؟`,
      confirmText: `تحويل إلى ${nextLabel}`,
      confirmButtonColor: nextGender === 'male' ? '#0284C7' : '#E91E63',
      cancelText: 'إلغاء',
      onConfirm: async () => {
        try {
          const res = await api.updateAdminUser(targetUser.id, { gender: nextGender });
          showSuccess('تم بنجاح 🎉', res.message || `تم تحويل الحساب إلى (${nextLabel}) بنجاح.`);
          setUsers(prev =>
            prev.map(u => (u.id === targetUser.id ? { ...u, gender: nextGender } : u))
          );
        } catch (err) {
          showError('خطأ', err.message || 'تعذر تعديل نوع الحساب.');
        }
      },
    });
  };

  const renderUserItem = ({ item }) => {
    const isBanned = Boolean(item.is_banned);
    const roleBadge = item.role === 'super_admin' ? '👑 سوبر أدمن' : item.role === 'admin' ? '🛡️ مشرف' : 'عضو';
    const activeSub = item.active_subscription;

    return (
      <View style={[styles.userCard, isBanned && styles.userCardBanned]}>
        <View style={styles.userCardHeader}>
          <View style={styles.badgesRow}>
            <View style={[styles.badge, item.gender === 'male' ? styles.badgeMale : styles.badgeFemale]}>
              <Text style={styles.badgeText}>{item.gender === 'male' ? 'عريس' : 'عروسة'}</Text>
            </View>
            <View style={[styles.badge, styles.badgeRole]}>
              <Text style={styles.badgeRoleText}>{roleBadge}</Text>
            </View>
            {isBanned && (
              <View style={[styles.badge, styles.badgeBanned]}>
                <Text style={styles.badgeBannedText}>محظور</Text>
              </View>
            )}
          </View>
          <Text style={styles.userName}>{item.name}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={15} color="#8B94B7" />
          <Text style={styles.infoText}>{item.phone || 'بدون هاتف'}</Text>
        </View>
        {item.email && (
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={15} color="#8B94B7" />
            <Text style={styles.infoText}>{item.email}</Text>
          </View>
        )}

        {/* Subscription Info */}
        <View style={styles.subStatusRow}>
          <Text style={styles.subStatusText}>
            {activeSub
              ? `⭐ باقة ${activeSub.type} (متبقي ${activeSub.views_allowed - activeSub.views_used} استعراض)`
              : 'الخطة المجانية'}
          </Text>
        </View>

        {/* Action Buttons Grid (Clean 2-row layout without overflowing) */}
        <View style={styles.cardActionsGrid}>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, isBanned ? styles.actionBtnUnban : styles.actionBtnBan]}
              onPress={() => handleToggleBan(item)}
            >
              <Ionicons name={isBanned ? 'checkmark-circle-outline' : 'ban-outline'} size={15} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>{isBanned ? 'فك الحظر' : 'حظر الحساب'}</Text>
            </TouchableOpacity>

            {isSuperAdmin ? (
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: item.gender === 'male' ? '#FDF2F8' : '#EFF6FF',
                    borderColor: item.gender === 'male' ? '#FBCFE8' : '#BAE6FD',
                    borderWidth: 1,
                  },
                ]}
                onPress={() => handleChangeGender(item)}
              >
                <Ionicons
                  name={item.gender === 'male' ? 'woman-outline' : 'man-outline'}
                  size={15}
                  color={item.gender === 'male' ? '#DB2777' : '#0284C7'}
                />
                <Text
                  style={[
                    styles.actionBtnText,
                    { color: item.gender === 'male' ? '#DB2777' : '#0284C7' },
                  ]}
                >
                  {item.gender === 'male' ? 'تحويل لعروسة' : 'تحويل لعريس'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.actionRow}>
            {isSuperAdmin && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnRole]}
                onPress={() => {
                  setSelectedUser(item);
                  setShowRoleModal(true);
                }}
              >
                <Ionicons name="shield-outline" size={15} color="#2D1B4D" />
                <Text style={[styles.actionBtnText, { color: '#2D1B4D' }]}>تغيير الصلاحية</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnDelete]}
              onPress={() => handleDeleteUser(item)}
            >
              <Ionicons name="trash-outline" size={15} color="#E11D48" />
              <Text style={[styles.actionBtnText, { color: '#E11D48' }]}>حذف نهائي</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>إدارة الأعضاء ({filteredUsers.length})</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={20} color="#8B94B7" style={{ marginLeft: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="بحث بالاسم أو رقم الهاتف أو البريد..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            textAlign="right"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle-outline" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Tabs Scrollable */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsScroll}
        >
          <TouchableOpacity
            style={[styles.pill, activeTab === 'members' && styles.pillActive]}
            onPress={() => setActiveTab('members')}
          >
            <Text style={[styles.pillText, activeTab === 'members' && styles.pillTextActive]}>
              الأعضاء ({users.filter(u => u.role === 'user').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pill, activeTab === 'male' && styles.pillActive]}
            onPress={() => setActiveTab('male')}
          >
            <Text style={[styles.pillText, activeTab === 'male' && styles.pillTextActive]}>
              عرسان 👔 ({users.filter(u => u.gender === 'male' && u.role === 'user').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pill, activeTab === 'female' && styles.pillActive]}
            onPress={() => setActiveTab('female')}
          >
            <Text style={[styles.pillText, activeTab === 'female' && styles.pillTextActive]}>
              عرائس 🌸 ({users.filter(u => u.gender === 'female' && u.role === 'user').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pill, activeTab === 'admins' && styles.pillActive, { backgroundColor: activeTab === 'admins' ? '#7E22CE' : '#F3E8FF' }]}
            onPress={() => setActiveTab('admins')}
          >
            <Text style={[styles.pillText, activeTab === 'admins' ? styles.pillTextActive : { color: '#7E22CE', fontWeight: '800' }]}>
              المشرفين 🛡️ ({users.filter(u => u.role === 'admin' || u.role === 'super_admin').length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#E91E63" />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={item => String(item.id)}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>لم يتم العثور على أي أعضاء مطابقين للبحث.</Text>
            </View>
          }
        />
      )}

      {/* Role Change Modal (Super Admin) */}
      <Modal visible={showRoleModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>تعديل رتبة المشترك</Text>
            <Text style={styles.modalSubtitle}>المستخدم: {selectedUser?.name}</Text>

            <TouchableOpacity
              style={[styles.roleOption, selectedUser?.role === 'user' && styles.roleOptionActive]}
              onPress={() => handleApplyRoleChange('user')}
              disabled={changingRole}
            >
              <Text style={styles.roleOptionText}>👤 مستخدم عادي (User)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleOption, selectedUser?.role === 'admin' && styles.roleOptionActive]}
              onPress={() => handleApplyRoleChange('admin')}
              disabled={changingRole}
            >
              <Text style={styles.roleOptionText}>🛡️ مشرف منصة (Admin)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleOption, selectedUser?.role === 'super_admin' && styles.roleOptionActive]}
              onPress={() => handleApplyRoleChange('super_admin')}
              disabled={changingRole}
            >
              <Text style={styles.roleOptionText}>👑 مدير عام (Super Admin)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowRoleModal(false)}
            >
              <Text style={styles.modalCloseText}>إلغاء</Text>
            </TouchableOpacity>
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
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#2D1B4D' },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F4F9',
  },
  searchWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#F8F9FE',
    borderWidth: 1.5,
    borderColor: '#E8ECF4',
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#2D1B4D',
    textAlign: 'right',
  },
  filterPillsScroll: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 10,
    paddingBottom: 2,
  },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  pillActive: { backgroundColor: '#E91E63' },
  pillText: { fontSize: 12.5, fontWeight: '700', color: '#64748B' },
  pillTextActive: { color: '#FFFFFF', fontWeight: '800' },
  loadingBox: { padding: 50, alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 40 },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.card,
  },
  userCardBanned: {
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    backgroundColor: '#FFF1F2',
  },
  userCardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: { fontSize: 16, fontWeight: '900', color: '#2D1B4D' },
  badgesRow: { flexDirection: 'row-reverse', gap: 6 },
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
  badgeMale: { backgroundColor: '#E0F2FE' },
  badgeFemale: { backgroundColor: '#FCE7F3' },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#0369A1' },
  badgeRole: { backgroundColor: '#F3E8FF' },
  badgeRoleText: { fontSize: 11, fontWeight: '800', color: '#7E22CE' },
  badgeBanned: { backgroundColor: '#FFE4E6' },
  badgeBannedText: { fontSize: 11, fontWeight: '800', color: '#E11D48' },
  infoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  infoText: { fontSize: 12.5, fontWeight: '600', color: '#64748B' },
  subStatusRow: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F8F9FE',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  subStatusText: { fontSize: 11.5, fontWeight: '700', color: '#2563EB' },
  cardActionsGrid: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F4F9',
  },
  actionRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 6,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 5,
  },
  actionBtnBan: { backgroundColor: '#E11D48' },
  actionBtnUnban: { backgroundColor: '#059669' },
  actionBtnRole: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  actionBtnDelete: { backgroundColor: '#FFF1F2', borderWidth: 1, borderColor: '#FECDD3' },
  actionBtnText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { marginTop: 10, fontSize: 13.5, fontWeight: '700', color: '#94A3B8' },
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
  modalSubtitle: { fontSize: 13, fontWeight: '600', color: '#64748B', textAlign: 'center', marginTop: 4, marginBottom: 18 },
  roleOption: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8ECF4',
    marginBottom: 10,
    backgroundColor: '#F8F9FE',
  },
  roleOptionActive: {
    borderColor: '#E91E63',
    backgroundColor: '#FFF0F5',
  },
  roleOptionText: { fontSize: 14, fontWeight: '800', color: '#2D1B4D', textAlign: 'right' },
  modalCloseBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 8 },
  modalCloseText: { fontSize: 13.5, fontWeight: '800', color: '#64748B' },
});
