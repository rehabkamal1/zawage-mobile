import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
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
import { formatProfileValue, formatLocation } from '../../utils/formatProfileValue';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function AdminFormsScreen({ navigation }) {
  const { isSuperAdmin } = useAuth();
  const { showConfirm, showSuccess, showError } = useAlert();
  const [users, setUsers] = useState([]);
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genderFilter, setGenderFilter] = useState('all'); // 'all' | 'female' | 'male'
  const [selectedProfile, setSelectedProfile] = useState(null);

  const fetchProfiles = useCallback(async () => {
    try {
      const data = await api.getAdminUsers();
      const list = (data.users || []).filter(u => u.profile && (u.profile.governorate || u.profile.job || u.profile.bio));
      setUsers(list);
      setFilteredProfiles(list);
    } catch (e) {
      showError('خطأ', e.message || 'تعذر جلب الاستمارات');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  useEffect(() => {
    if (genderFilter === 'all') {
      setFilteredProfiles(users);
    } else {
      setFilteredProfiles(users.filter(u => u.gender === genderFilter));
    }
  }, [genderFilter, users]);

  const handleConvertGender = (profileItem) => {
    const targetId = profileItem.id;
    const nextGender = profileItem.gender === 'male' ? 'female' : 'male';
    const nextLabel = nextGender === 'male' ? 'عريس 👔' : 'عروسة 🌸';
    const currentLabel = profileItem.gender === 'male' ? 'عريس' : 'عروسة';
    const displayName = profileItem.profile?.nickname || profileItem.name;

    showConfirm({
      type: 'question',
      title: 'تحويل نوع الاستمارة',
      message: `هل تود بالتأكيد تحويل استمارة (${displayName}) من (${currentLabel}) إلى (${nextLabel})؟`,
      confirmText: `نعم، تحويل إلى ${nextLabel}`,
      cancelText: 'إلغاء',
      confirmButtonColor: nextGender === 'male' ? '#0284C7' : '#E91E63',
      onConfirm: async () => {
        try {
          const res = await api.updateAdminUser(targetId, { gender: nextGender });
          showSuccess('تم بنجاح 🎉', res.message || `تم تحويل الاستمارة إلى (${nextLabel}) بنجاح.`);
          setUsers(prev => prev.map(u => (u.id === targetId ? { ...u, gender: nextGender } : u)));
          setFilteredProfiles(prev => prev.map(u => (u.id === targetId ? { ...u, gender: nextGender } : u)));
          if (selectedProfile?.id === targetId) {
            setSelectedProfile(prev => ({ ...prev, gender: nextGender }));
          }
        } catch (err) {
          showError('خطأ', err.message || 'تعذر تحويل نوع الاستمارة.');
        }
      },
    });
  };

  const renderProfileItem = ({ item }) => {
    const p = item.profile || {};
    const isMale = item.gender === 'male';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.genderBadge, isMale ? styles.maleBadge : styles.femaleBadge]}>
            <Text style={[styles.genderBadgeText, isMale ? styles.maleText : styles.femaleText]}>
              {isMale ? 'استمارة عريس' : 'استمارة عروسة'}
            </Text>
          </View>
          <Text style={styles.name}>{p.nickname || item.name}</Text>
        </View>

        <Text style={styles.metaText}>
          {formatLocation(p.governorate, p.area)} • {formatProfileValue(p.job, 'الوظيفة غير محددة')} • {formatProfileValue(p.marital_status, 'الحالة')}
        </Text>

        {p.bio ? (
          <Text style={styles.bioSnippet} numberOfLines={2}>
            "{p.bio}"
          </Text>
        ) : null}

        <TouchableOpacity
          style={styles.reviewBtn}
          onPress={() => setSelectedProfile(item)}
        >
          <Ionicons name="eye-outline" size={17} color="#E91E63" style={{ marginLeft: 6 }} />
          <Text style={styles.reviewBtnText}>فحص الاستمارة بالكامل</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const SpecItem = ({ label, value }) => (
    <View style={styles.modalSpecRow}>
      <Text style={styles.specVal}>{value || '—'}</Text>
      <Text style={styles.specLabel}>{label}:</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>مراجعة وتدقيق الاستمارات ({filteredProfiles.length})</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.tab, genderFilter === 'all' && styles.tabActive]}
          onPress={() => setGenderFilter('all')}
        >
          <Text style={[styles.tabText, genderFilter === 'all' && styles.tabTextActive]}>الكل</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, genderFilter === 'female' && styles.tabActive]}
          onPress={() => setGenderFilter('female')}
        >
          <Text style={[styles.tabText, genderFilter === 'female' && styles.tabTextActive]}>عرائس (إناث)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, genderFilter === 'male' && styles.tabActive]}
          onPress={() => setGenderFilter('male')}
        >
          <Text style={[styles.tabText, genderFilter === 'male' && styles.tabTextActive]}>عرسان (ذكور)</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#E91E63" />
        </View>
      ) : (
        <FlatList
          data={filteredProfiles}
          keyExtractor={item => String(item.id)}
          renderItem={renderProfileItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="document-text-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>لا توجد استمارات مكتملة حالياً.</Text>
            </View>
          }
        />
      )}

      {/* Details Modal */}
      <Modal visible={Boolean(selectedProfile)} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelectedProfile(null)}>
                <Ionicons name="close-circle-outline" size={26} color="#8B94B7" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>تفاصيل استمارة الزواج الشرعي</Text>
            </View>

            {selectedProfile && (
              <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
                <View style={styles.userBanner}>
                  <Text style={styles.bannerName}>{selectedProfile.profile?.nickname || selectedProfile.name}</Text>
                  <Text style={styles.bannerPhone}>رقم الهاتف المسجل: {selectedProfile.phone || 'غير مسجل'}</Text>
                </View>

                <Text style={styles.sectionHeading}>البيانات العامة والمواصفات</Text>
                <SpecItem label="المحافظة والمنطقة" value={formatLocation(selectedProfile.profile?.governorate, selectedProfile.profile?.area)} />
                <SpecItem label="الحالة الاجتماعية" value={formatProfileValue(selectedProfile.profile?.marital_status, '—', selectedProfile.gender)} />
                <SpecItem label="تاريخ الميلاد" value={selectedProfile.profile?.dob || '—'} />
                <SpecItem label="المؤهل الدراسي" value={formatProfileValue(selectedProfile.profile?.education, '—', selectedProfile.gender)} />
                <SpecItem label="الوظيفة / العمل" value={formatProfileValue(selectedProfile.profile?.job, '—', selectedProfile.gender)} />
                <SpecItem label="مستوى الدخل" value={formatProfileValue(selectedProfile.profile?.income, '—', selectedProfile.gender)} />
                <SpecItem label="السكن" value={formatProfileValue(selectedProfile.profile?.accommodation, '—', selectedProfile.gender)} />
                <SpecItem label="الطول والوزن" value={`${selectedProfile.profile?.height || '—'} سم / ${selectedProfile.profile?.weight || '—'} كجم`} />
                <SpecItem label="لون البشرة" value={formatProfileValue(selectedProfile.profile?.skin_tone, '—', selectedProfile.gender)} />

                <Text style={styles.sectionHeading}>الالتزام الديني والشرعي</Text>
                <SpecItem label="المحافظة على الصلاة" value={formatProfileValue(selectedProfile.profile?.prayer, '—', selectedProfile.gender)} />
                {selectedProfile.gender === 'female' ? (
                  <SpecItem label="الحجاب / النقاب" value={formatProfileValue(selectedProfile.profile?.hijab, '—', 'female')} />
                ) : null}
                <SpecItem label="التدخين" value={formatProfileValue(selectedProfile.profile?.smoking, '—', selectedProfile.gender)} />
                <SpecItem label="موقف القائمة" value={formatProfileValue(selectedProfile.profile?.qaima_status, '—', selectedProfile.gender)} />

                {selectedProfile.profile?.bio ? (
                  <>
                    <Text style={styles.sectionHeading}>نبذة عن النفس والطباع</Text>
                    <View style={styles.quoteBox}>
                      <Text style={styles.quoteText}>{selectedProfile.profile.bio}</Text>
                    </View>
                  </>
                ) : null}

                {selectedProfile.profile?.partner_specs ? (
                  <>
                    <Text style={styles.sectionHeading}>مواصفات الشريك المطلوب</Text>
                    <View style={styles.quoteBox}>
                      <Text style={styles.quoteText}>{selectedProfile.profile.partner_specs}</Text>
                    </View>
                  </>
                ) : null}

                {isSuperAdmin && (
                  <TouchableOpacity
                    style={[
                      styles.convertBtn,
                      {
                        backgroundColor: selectedProfile.gender === 'male' ? '#FDF2F8' : '#EFF6FF',
                        borderColor: selectedProfile.gender === 'male' ? '#FBCFE8' : '#BAE6FD',
                      },
                    ]}
                    onPress={() => handleConvertGender(selectedProfile)}
                  >
                    <Ionicons
                      name="swap-horizontal-outline"
                      size={18}
                      color={selectedProfile.gender === 'male' ? '#DB2777' : '#0284C7'}
                      style={{ marginLeft: 6 }}
                    />
                    <Text
                      style={[
                        styles.convertBtnText,
                        { color: selectedProfile.gender === 'male' ? '#DB2777' : '#0284C7' },
                      ]}
                    >
                      {selectedProfile.gender === 'male'
                        ? 'تحويل الاستمارة إلى عروسة'
                        : 'تحويل الاستمارة إلى عريس'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.doneBtn}
                  onPress={() => setSelectedProfile(null)}
                >
                  <Text style={styles.doneBtnText}>تم الفحص</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
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
  tabText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '800' },
  loadingBox: { padding: 50, alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: { fontSize: 16, fontWeight: '900', color: '#2D1B4D' },
  genderBadge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 8 },
  maleBadge: { backgroundColor: '#E0F2FE' },
  femaleBadge: { backgroundColor: '#FCE7F3' },
  genderBadgeText: { fontSize: 11, fontWeight: '800' },
  maleText: { color: '#0369A1' },
  femaleText: { color: '#BE185D' },
  metaText: { fontSize: 12.5, fontWeight: '700', color: '#64748B', textAlign: 'right', marginBottom: 8 },
  bioSnippet: {
    fontSize: 12,
    lineHeight: 18,
    color: '#8B94B7',
    textAlign: 'right',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  reviewBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    backgroundColor: '#FFF0F5',
    borderRadius: 12,
    gap: 6,
    marginTop: 4,
  },
  reviewBtnText: { fontSize: 12.5, fontWeight: '800', color: '#E91E63' },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { marginTop: 10, fontSize: 13.5, fontWeight: '700', color: '#94A3B8' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F4F9',
  },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#2D1B4D' },
  modalContent: { paddingBottom: 30 },
  userBanner: {
    backgroundColor: '#F8F9FE',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  bannerName: { fontSize: 18, fontWeight: '900', color: '#2D1B4D' },
  bannerPhone: { fontSize: 13, fontWeight: '700', color: '#E91E63', marginTop: 4 },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '900',
    color: '#E91E63',
    textAlign: 'right',
    marginTop: 14,
    marginBottom: 8,
  },
  modalSpecRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FE',
  },
  specLabel: { fontSize: 12.5, fontWeight: '700', color: '#8B94B7' },
  specVal: { fontSize: 12.5, fontWeight: '800', color: '#2D1B4D' },
  quoteBox: {
    backgroundColor: '#F8F9FE',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8ECF4',
    marginBottom: 10,
  },
  quoteText: { fontSize: 12.5, lineHeight: 20, color: '#475569', textAlign: 'right' },
  convertBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 18,
    gap: 8,
  },
  convertBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  doneBtn: {
    backgroundColor: '#E91E63',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  doneBtnText: { fontSize: 15, fontWeight: '900', color: '#FFFFFF' },
});
