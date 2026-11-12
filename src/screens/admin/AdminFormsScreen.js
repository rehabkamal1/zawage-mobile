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
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/client';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function AdminFormsScreen({ navigation }) {
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
      Alert.alert('خطأ', e.message || 'تعذر جلب الاستمارات');
    } finally {
      setLoading(false);
    }
  }, []);

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
          {p.governorate || 'المحافظة غير محددة'} • {p.job || 'الوظيفة غير محددة'} • {p.marital_status || 'الحالة'}
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
          <Ionicons name="eye-outline" size={17} color="#E91E63" />
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
                <Ionicons name="close-circle" size={26} color="#8B94B7" />
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
                <SpecItem label="المحافظة والمنطقة" value={`${selectedProfile.profile?.governorate || ''} - ${selectedProfile.profile?.area || ''}`} />
                <SpecItem label="الحالة الاجتماعية" value={selectedProfile.profile?.marital_status} />
                <SpecItem label="تاريخ الميلاد" value={selectedProfile.profile?.dob} />
                <SpecItem label="المؤهل الدراسي" value={selectedProfile.profile?.education} />
                <SpecItem label="الوظيفة / العمل" value={selectedProfile.profile?.job} />
                <SpecItem label="مستوى الدخل" value={selectedProfile.profile?.income} />
                <SpecItem label="السكن" value={selectedProfile.profile?.accommodation} />
                <SpecItem label="الطول والوزن" value={`${selectedProfile.profile?.height || '—'} سم / ${selectedProfile.profile?.weight || '—'} كجم`} />
                <SpecItem label="لون البشرة" value={selectedProfile.profile?.skin_tone} />

                <Text style={styles.sectionHeading}>الالتزام الديني والشرعي</Text>
                <SpecItem label="المحافظة على الصلاة" value={selectedProfile.profile?.prayer} />
                <SpecItem label="الحجاب / النقاب" value={selectedProfile.profile?.hijab} />
                <SpecItem label="التدخين" value={selectedProfile.profile?.smoking} />
                <SpecItem label="موقف القائمة" value={selectedProfile.profile?.qaima_status} />

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
  doneBtn: {
    backgroundColor: '#E91E63',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  doneBtnText: { fontSize: 15, fontWeight: '900', color: '#FFFFFF' },
});
