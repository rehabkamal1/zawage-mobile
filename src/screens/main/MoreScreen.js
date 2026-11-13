import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function MoreScreen({ navigation }) {
  const { user, isAdmin, isSuperAdmin, logout } = useAuth();
  const isMale = user?.gender === 'male';

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من رغبتك في تسجيل الخروج من التطبيق؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'نعم، تسجيل الخروج',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.logout().catch(() => {});
            } finally {
              logout();
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      id: 'profile',
      title: 'ملفي الشخصي وبياناتي',
      icon: 'person-outline',
      color: '#E91E63',
      bgColor: '#FFF0F5',
      onPress: () => navigation.navigate('ProfileScreen'),
    },
    {
      id: 'settings',
      title: 'إعدادات الحساب وكلمة المرور',
      icon: 'settings-outline',
      color: '#6366F1',
      bgColor: '#EEF2FF',
      onPress: () => navigation.navigate('Settings'),
    },
    // Subscriptions only apply to grooms (male) - brides are completely free
    ...(isMale
      ? [
          {
            id: 'subscriptions',
            title: 'باقات الاشتراك والتجديد (فودافون كاش)',
            icon: 'card-outline',
            color: '#8B5CF6',
            bgColor: '#F5F3FF',
            onPress: () => navigation.navigate('SubscriptionsTab'),
          },
        ]
      : []),
    {
      id: 'form',
      title: 'استمارة الزواج الشرعي (تعديل)',
      icon: 'document-text-outline',
      color: '#0284C7',
      bgColor: '#F0F9FF',
      onPress: () => navigation.navigate('EditProfileTab'),
    },
    // Favorites only apply to grooms browsing brides
    ...(isMale
      ? [
          {
            id: 'favorites',
            title: 'قائمة الشركاء المفضلة',
            icon: 'heart-outline',
            color: '#E11D48',
            bgColor: '#FFF1F2',
            onPress: () => navigation.navigate('FavoritesTab'),
          },
        ]
      : []),
    {
      id: 'contact',
      title: 'اتصل بنا والدعم الفني عبر واتساب',
      icon: 'headset-outline',
      color: '#059669',
      bgColor: '#ECFDF5',
      onPress: () => navigation.navigate('Contact'),
    },
    {
      id: 'terms',
      title: 'الشروط والأحكام والضوابط الشرعية',
      icon: 'shield-checkmark-outline',
      color: '#10B981',
      bgColor: '#ECFDF5',
      onPress: () => navigation.navigate('Terms'),
    },
    {
      id: 'privacy',
      title: 'سياسة الخصوصية وحماية البيانات',
      icon: 'lock-closed-outline',
      color: '#F59E0B',
      bgColor: '#FFFBEB',
      onPress: () => navigation.navigate('Privacy'),
    },
    {
      id: 'about',
      title: 'عن منصة نصفي الآخر',
      icon: 'information-circle-outline',
      color: '#0284C7',
      bgColor: '#EFF6FF',
      onPress: () => navigation.navigate('About'),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.topHeader}>
        <Text style={styles.topBarTitle}>المزيد</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Ionicons
              name={user?.gender === 'female' ? 'woman' : 'man'}
              size={34}
              color={user?.gender === 'female' ? '#E91E63' : '#0284C7'}
            />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.name || 'مشترك'}</Text>
            <Text style={styles.userMeta}>{user?.phone || user?.email || 'نصفي الآخر'}</Text>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>
                {isAdmin ? (isSuperAdmin ? '👑 مدير عام' : '🛡️ مشرف منصة') : user?.gender === 'female' ? 'عروسة مسجلة' : 'عريس مسجل'}
              </Text>
            </View>
          </View>
        </View>

        {/* Admin Switcher Shortcut */}
        {isAdmin && (
          <TouchableOpacity
            style={styles.adminSwitchCard}
            onPress={() => navigation.navigate('AdminTabs')}
            activeOpacity={0.88}
          >
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            <View style={styles.adminSwitchInfo}>
              <Text style={styles.adminSwitchTitle}>الانتقال إلى لوحة تحكم الإدارة</Text>
              <Text style={styles.adminSwitchSubtitle}>الإحصائيات، الأعضاء، الاستمارات، والمدفوعات</Text>
            </View>
            <View style={styles.adminBadgeIcon}>
              <Ionicons name="shield-checkmark" size={22} color="#E91E63" />
            </View>
          </TouchableOpacity>
        )}

        {/* Menu Items List */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && { borderBottomWidth: 0 },
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={18} color="#8B94B7" />
              <Text style={styles.menuItemTitle}>{item.title}</Text>
              <View style={[styles.iconWrapper, { backgroundColor: item.bgColor }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color="#E11D48" style={{ marginLeft: 8 }} />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>

        {/* Version info */}
        <Text style={styles.versionText}>تطبيق نصفي الآخر • الإصدار 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FE' },
  topHeader: {
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F4F9',
    alignItems: 'center',
  },
  topBarTitle: { fontSize: 17, fontWeight: '900', color: '#2D1B4D' },
  scrollContent: { padding: 18, paddingBottom: 40 },
  userCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  avatarCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FFF0F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
  },
  userDetails: { flex: 1, alignItems: 'flex-end' },
  userName: { fontSize: 17, fontWeight: '900', color: '#2D1B4D' },
  userMeta: { fontSize: 12.5, fontWeight: '600', color: '#64748B', marginTop: 3 },
  roleTag: {
    marginTop: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FE',
  },
  roleTagText: { fontSize: 11, fontWeight: '800', color: '#E91E63' },
  adminSwitchCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#2D1B4D',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.glow,
  },
  adminBadgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  adminSwitchInfo: { flex: 1, alignItems: 'flex-end' },
  adminSwitchTitle: { fontSize: 14, fontWeight: '900', color: '#FFFFFF' },
  adminSwitchSubtitle: { fontSize: 11.5, fontWeight: '600', color: '#CBD5E1', marginTop: 2 },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    marginBottom: 20,
    ...SHADOWS.card,
  },
  menuItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FE',
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  menuItemTitle: { flex: 1, fontSize: 13.5, fontWeight: '800', color: '#2D1B4D', textAlign: 'right' },
  logoutButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    borderRadius: 18,
    paddingVertical: 14,
    marginBottom: 20,
  },
  logoutText: { fontSize: 14.5, fontWeight: '900', color: '#E11D48' },
  versionText: { fontSize: 11.5, fontWeight: '600', color: '#94A3B8', textAlign: 'center' },
});
