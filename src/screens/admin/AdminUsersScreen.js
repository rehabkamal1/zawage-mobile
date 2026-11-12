import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function AdminUsersScreen({ navigation }) {
  const { user: currentAdmin, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all'); // 'all' | 'male' | 'female'

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
      Alert.alert('خطأ', e.message || 'تعذر جلب قائمة المستخدمين');
    } finally {
      setLoading(false);
    }
  }, []);

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

    if (genderFilter !== 'all') {
      result = result.filter(u => u.gender === genderFilter);
    }

    setFilteredUsers(result);
  }, [search, genderFilter, users]);

  const handleToggleBan = async (targetUser) => {
    const isBanned = Boolean(targetUser.is_banned);
    Alert.alert(
      isBanned ? 'تأكيد فك الحظر' : 'تأكيد حظر المستخدم',
      `هل أنت متأكد من ${isBanned ? 'فك حظر' : 'حظر'} الحساب [${targetUser.name}]؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد',
          style: isBanned ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const res = await api.toggleBanUser(targetUser.id);
              Alert.alert('تم بنجاح', res.message || 'تم تحديث حالة الحساب.');
              setUsers(prev =>
                prev.map(u => (u.id === targetUser.id ? { ...u, is_banned: !isBanned } : u))
              );
            } catch (err) {
              Alert.alert('خطأ', err.message || 'تعذر تعديل حالة الحساب.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = async (targetUser) => {
    Alert.alert(
      'حذف المستخدم نهائياً',
      `تحذير: سيتم حذف كافة بيانات [${targetUser.name}] واستمارته نهائياً من قاعدة البيانات!`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف نهائي',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteAdminUser(targetUser.id);
              Alert.alert('تم الحذف', 'تم حذف المستخدم بنجاح.');
              setUsers(prev => prev.filter(u => u.id !== targetUser.id));
            } catch (err) {
              Alert.alert('خطأ', err.message || 'تعذر حذف المستخدم.');
            }
          },
        },
      ]
    );
  };

  const handleApplyRoleChange = async (newRole) => {
    if (!selectedUser) return;
    setChangingRole(true);
    try {
      const res = await api.changeUserRole(selectedUser.id, newRole);
      Alert.alert('تم بنجاح', res.message || 'تم تعديل صلاحية الحساب.');
      setUsers(prev =>
        prev.map(u => (u.id === selectedUser.id ? { ...u, role: newRole } : u))
      );
      setShowRoleModal(false);
    } catch (err) {
      Alert.alert('خطأ', err.message || 'تعذر تغيير الصلاحية.');
    } finally {
      setChangingRole(false);
    }
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

        {/* Action Buttons */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, isBanned ? styles.actionBtnUnban : styles.actionBtnBan]}
            onPress={() => handleToggleBan(item)}
          >
            <Ionicons name={isBanned ? 'checkmark-circle-outline' : 'ban-outline'} size={16} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>{isBanned ? 'فك الحظر' : 'حظر الحساب'}</Text>
          </TouchableOpacity>

          {isSuperAdmin && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnRole]}
              onPress={() => {
                setSelectedUser(item);
                setShowRoleModal(true);
              }}
            >
              <Ionicons name="shield-outline" size={16} color="#2D1B4D" />
              <Text style={[styles.actionBtnText, { color: '#2D1B4D' }]}>الصلاحية</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnDelete]}
            onPress={() => handleDeleteUser(item)}
          >
            <Ionicons name="trash-outline" size={16} color="#E11D48" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>إدارة الأعضاء ({filteredUsers.length})</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={20} color="#8B94B7" style={{ marginLeft: 8 }} />
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
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Gender Filters */}
        <View style={styles.filterPills}>
          <TouchableOpacity
            style={[styles.pill, genderFilter === 'all' && styles.pillActive]}
            onPress={() => setGenderFilter('all')}
          >
            <Text style={[styles.pillText, genderFilter === 'all' && styles.pillTextActive]}>الكل</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pill, genderFilter === 'male' && styles.pillActive]}
            onPress={() => setGenderFilter('male')}
          >
            <Text style={[styles.pillText, genderFilter === 'male' && styles.pillTextActive]}>عرسان</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pill, genderFilter === 'female' && styles.pillActive]}
            onPress={() => setGenderFilter('female')}
          >
            <Text style={[styles.pillText, genderFilter === 'female' && styles.pillTextActive]}>عرائس</Text>
          </TouchableOpacity>
        </View>
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
  filterPills: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 10,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  pillActive: { backgroundColor: '#E91E63' },
  pillText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
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
  cardActions: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F4F9',
  },
  actionBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 5,
  },
  actionBtnBan: { backgroundColor: '#E11D48' },
  actionBtnUnban: { backgroundColor: '#059669' },
  actionBtnRole: { backgroundColor: '#E2E8F0' },
  actionBtnDelete: { backgroundColor: '#FFF1F2', width: 38, paddingHorizontal: 0 },
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
