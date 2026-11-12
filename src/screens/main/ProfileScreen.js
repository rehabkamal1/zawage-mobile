import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const profile = user?.profile || {};
  const isFemale = user?.gender === 'female';

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من رغبتك في تسجيل الخروج من التطبيق؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تسجيل الخروج',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const MenuItem = ({ icon, title, subtitle, onPress, isDanger }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Ionicons name="chevron-back" size={18} color={COLORS.textLight} />
      <View style={styles.menuItemTextContainer}>
        <Text style={[styles.menuItemTitle, isDanger && styles.dangerText]}>{title}</Text>
        {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
      </View>
      <View style={[styles.menuIconCircle, isDanger && styles.dangerIconCircle]}>
        <Ionicons name={icon} size={20} color={isDanger ? COLORS.danger : COLORS.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>حسابي الشخصي</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={[styles.avatar, isFemale ? styles.femaleAvatar : styles.maleAvatar]}>
            <Ionicons name={isFemale ? 'woman' : 'man'} size={40} color="#FFFFFF" />
          </View>

          <Text style={styles.userName}>{profile.nickname || user?.name || 'مستخدم نصفي الآخر'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          <View style={styles.badgeRow}>
            <View style={[styles.badge, isFemale ? styles.femaleBadge : styles.maleBadge]}>
              <Text style={styles.badgeText}>{isFemale ? 'عروسة' : 'عريس'}</Text>
            </View>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>
                {user?.is_banned ? 'حساب معلق' : 'حساب نشط'}
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>إدارة الاستمارة والحساب</Text>

          <View style={styles.menuCard}>
            <MenuItem
              icon="create-outline"
              title="تعديل بيانات الاستمارة"
              subtitle="تحديث المواصفات الشخصية ومواصفات الشريك"
              onPress={() => navigation.navigate('EditProfile')}
            />
            <MenuItem
              icon="key-outline"
              title="إعدادات الحساب وكلمة المرور"
              subtitle="تحديث كلمة السر وحماية حسابك"
              onPress={() => navigation.navigate('Settings')}
            />
            <MenuItem
              icon="shield-checkmark-outline"
              title="الضوابط الشرعية والأمان"
              subtitle="تعرف على معايير الخصوصية والتواصل الحلال"
              onPress={() => navigation.navigate('Terms')}
            />
            <MenuItem
              icon="lock-closed-outline"
              title="سياسة الخصوصية وحماية البيانات"
              subtitle="كيف نحافظ على سرية بياناتك وتشفيرها"
              onPress={() => navigation.navigate('Privacy')}
            />
            <MenuItem
              icon="headset-outline"
              title="اتصل بنا والدعم الفني"
              subtitle="تواصل مع إدارة المنصة مباشرة عبر واتساب"
              onPress={() => navigation.navigate('Contact')}
            />
          </View>
        </View>

        {/* Support & Logout */}
        <View style={styles.section}>
          <View style={styles.menuCard}>
            <MenuItem
              icon="log-out-outline"
              title="تسجيل الخروج"
              isDanger
              onPress={handleLogout}
            />
          </View>
        </View>

        {/* App Version Info */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>تطبيق نصفي الآخر v1.0.0</Text>
          <Text style={styles.copyrightText}>جميع الحقوق محفوظة © 2026</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topHeader: {
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  scrollContent: {
    padding: 16,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    marginBottom: 20,
    ...SHADOWS.small,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  maleAvatar: {
    backgroundColor: COLORS.male,
  },
  femaleAvatar: {
    backgroundColor: COLORS.female,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 3,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  maleBadge: {
    backgroundColor: '#E0F2FE',
  },
  femaleBadge: {
    backgroundColor: '#FCE4EC',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  activeBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 8,
    textAlign: 'right',
    paddingHorizontal: 4,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  menuIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  dangerIconCircle: {
    backgroundColor: '#FEE2E2',
  },
  menuItemTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  menuItemTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.text,
  },
  menuItemSubtitle: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  dangerText: {
    color: COLORS.danger,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  copyrightText: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
});
