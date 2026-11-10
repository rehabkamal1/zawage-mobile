import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, getStoredAuthData, clearAuthData } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function MoreScreen({ navigation }) {
  const { logout } = useAuth();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    getStoredAuthData().then(({ user }) => {
      if (user) setCurrentUser(user);
    });
  }, []);

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
      title: 'ملفي الشخصي وبيانات الحساب',
      icon: 'person-outline',
      color: '#E91E63',
      bgColor: '#FFF0F5',
      onPress: () => navigation.navigate('ProfileScreen'),
    },
    {
      id: 'subscriptions',
      title: 'باقات الاشتراك والتجديد',
      icon: 'card-outline',
      color: '#8B5CF6',
      bgColor: '#F5F3FF',
      onPress: () => navigation.navigate('SubscriptionsTab'),
    },
    {
      id: 'form',
      title: 'تعديل استمارة الزواج',
      icon: 'document-text-outline',
      color: '#0284C7',
      bgColor: '#F0F9FF',
      onPress: () => navigation.navigate('EditProfileTab'),
    },
    {
      id: 'favorites',
      title: 'قائمة الشركاء المفضلة',
      icon: 'heart-outline',
      color: '#E11D48',
      bgColor: '#FFF1F2',
      onPress: () => navigation.navigate('FavoritesTab'),
    },
    {
      id: 'terms',
      title: 'الشروط والأحكام والضوابط الشرعية',
      icon: 'shield-checkmark-outline',
      color: '#10B981',
      bgColor: '#ECFDF5',
      onPress: () => {
        Alert.alert(
          'الضوابط الشرعية والشروط',
          'المنصة مخصصة فقط للتوفيق الشرعي للزواج على كتاب الله وسنة رسوله. يمنع منعاً باتاً التعارف غير الشرعي أو استخدام أرقام الهواتف في أي غرض آخر. في حال حدوث أي مخالفة يتم حظر الحساب نهائياً واتخاذ الإجراءات اللازمة.'
        );
      },
    },
    {
      id: 'privacy',
      title: 'سياسة الخصوصية وحماية البيانات',
      icon: 'lock-closed-outline',
      color: '#F59E0B',
      bgColor: '#FFFBEB',
      onPress: () => {
        Alert.alert(
          'سياسة الخصوصية',
          'بيانات التواصل لا تظهر علناً في التطبيق وتكون مشفرة ومحمية، ولا يتم فك قفلها إلا برغبة العريس واستهلاك رصيده الشرعي وبإشراف ولي الأمر.'
        );
      },
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>المزيد والإعدادات</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>
              {(currentUser?.name || 'م')[0]}
            </Text>
          </View>
          <View style={styles.userTextCol}>
            <Text style={styles.userName}>
              {currentUser?.profile?.nickname || currentUser?.name || 'المستخدم'}
            </Text>
            <Text style={styles.userPhone}>
              {currentUser?.phone || currentUser?.email || ''}
            </Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={item.onPress}
            >
              <View style={styles.menuLeft}>
                <Ionicons name="chevron-back" size={18} color="#CBD5E1" />
              </View>

              <View style={styles.menuRight}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <View style={[styles.menuIconCircle, { backgroundColor: item.bgColor }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutRow}
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="log-out-outline" size={20} color="#E11D48" />
            </View>
            <Text style={styles.logoutText}>تسجيل الخروج من الحساب</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerNote}>
          <Text style={styles.footerBrand}>تطبيق نصفي الآخر 💖</Text>
          <Text style={styles.footerVersion}>الإصدار 1.0.0 — مرخص رسمياً</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  topHeader: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F4F9',
  },
  headerTitle: {
    fontSize: 17.5,
    fontWeight: '900',
    color: '#2D1B4D',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F4F9',
    ...SHADOWS.card,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFF0F5',
    borderWidth: 2,
    borderColor: '#FBCFE8',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: '900',
    color: '#E91E63',
  },
  userTextCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#2D1B4D',
  },
  userPhone: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B94B7',
    marginTop: 3,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#F1F4F9',
    ...SHADOWS.card,
  },
  menuRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  menuRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  menuIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2D1B4D',
  },
  menuLeft: {
    paddingLeft: 4,
  },
  logoutRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: '#FFF1F2',
    marginHorizontal: 12,
    marginVertical: 10,
    borderRadius: 16,
  },
  logoutText: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#E11D48',
  },
  footerNote: {
    alignItems: 'center',
    marginTop: 26,
  },
  footerBrand: {
    fontSize: 13,
    fontWeight: '800',
    color: '#8B94B7',
  },
  footerVersion: {
    fontSize: 11,
    fontWeight: '600',
    color: '#CBD5E1',
    marginTop: 4,
  },
});
