import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_CONFIG } from '../../constants/config';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function ContactScreen({ navigation }) {
  const openWhatsApp = () => {
    const text = encodeURIComponent('السلام عليكم، أحتاج مساعدة أو استفسار بخصوص منصة نصفي الآخر.');
    Linking.openURL(`whatsapp://send?phone=${APP_CONFIG.WHATSAPP_SUPPORT}&text=${text}`).catch(() => {
      Alert.alert('تنبيه', 'يرجى التأكد من تثبيت تطبيق واتساب على هاتفك.');
    });
  };

  const callPhone = () => {
    Linking.openURL(`tel:${APP_CONFIG.VODAFONE_CASH_NUMBER}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-forward" size={22} color="#2D1B4D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>اتصل بنا والدعم الفني</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topInfo}>
          <View style={styles.iconCircle}>
            <Ionicons name="headset-outline" size={36} color="#E91E63" />
          </View>
          <Text style={styles.mainTitle}>نحن هنا دائماً لخدمتك</Text>
          <Text style={styles.mainSubtitle}>
            يسعدنا استقبال استفساراتكم واقتراحاتكم والمساعدة في تفعيل الباقات طوال أيام الأسبوع.
          </Text>
        </View>

        {/* WhatsApp Card */}
        <TouchableOpacity style={styles.contactCard} onPress={openWhatsApp} activeOpacity={0.88}>
          <View style={[styles.cardIconBox, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
          </View>
          <View style={styles.cardDetails}>
            <Text style={styles.cardTitle}>المحادثة المباشرة عبر واتساب</Text>
            <Text style={styles.cardDesc}>رد فوري وسريع على كافة التساؤلات</Text>
            <Text style={styles.cardContact}>{APP_CONFIG.VODAFONE_CASH_NUMBER}</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color="#8B94B7" />
        </TouchableOpacity>

        {/* Phone Card */}
        <TouchableOpacity style={styles.contactCard} onPress={callPhone} activeOpacity={0.88}>
          <View style={[styles.cardIconBox, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="call-outline" size={26} color="#0284C7" />
          </View>
          <View style={styles.cardDetails}>
            <Text style={styles.cardTitle}>الاتصال الهاتفي المباشر</Text>
            <Text style={styles.cardDesc}>متاح من 10 صباحاً وحتى 10 مساءً</Text>
            <Text style={styles.cardContact}>{APP_CONFIG.VODAFONE_CASH_NUMBER}</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color="#8B94B7" />
        </TouchableOpacity>
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8F9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#2D1B4D' },
  content: { padding: 20 },
  topInfo: { alignItems: 'center', marginBottom: 28 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF0F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  mainTitle: { fontSize: 22, fontWeight: '900', color: '#2D1B4D' },
  mainSubtitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  contactCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  cardIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
  },
  cardDetails: { flex: 1, alignItems: 'flex-end' },
  cardTitle: { fontSize: 15, fontWeight: '900', color: '#2D1B4D' },
  cardDesc: { fontSize: 12.5, fontWeight: '600', color: '#8B94B7', marginTop: 3 },
  cardContact: { fontSize: 13.5, fontWeight: '800', color: '#E91E63', marginTop: 4 },
});
