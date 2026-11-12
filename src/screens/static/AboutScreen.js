import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { APP_CONFIG } from '../../constants/config';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function AboutScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-forward" size={22} color="#2D1B4D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>عن المنصة</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.logoSection}>
          <Image
            source={require('../../../assets/logo1.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>{APP_CONFIG.NAME}</Text>
          <Text style={styles.subtitle}>منصة التوفيق الحلال والزواج الشرعي الميسر</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>رؤيتنا ورسالتنا</Text>
          <Text style={styles.paragraph}>
            تأسست منصة "نصفي الآخر" لتكون بيئة آمنة، راقية، ومحافظة تجمع بين الراغبين والراغبات في الزواج الشرعي الجاد في مصر ومختلف الدول، بأسلوب عصري يحفظ الكرامة والخصوصية ويتبع الضوابط والآداب الإسلامية.
          </Text>

          <Text style={styles.sectionTitle}>لماذا نصفي الآخر؟</Text>
          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={20} color="#E91E63" />
            <Text style={styles.featureText}>التزام تام بالضوابط الشرعية والأمانة الأخلاقية.</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={20} color="#E91E63" />
            <Text style={styles.featureText}>حساب نسبة التوافق الفعلي بين الطرفين بنظام ذكي.</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={20} color="#E91E63" />
            <Text style={styles.featureText}>حجب أرقام الهواتف لحين طلب التعارف الرسمي.</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={20} color="#E91E63" />
            <Text style={styles.featureText}>فريق إشراف ومتابعة للتحقق من الاستمارات وحظر غير الجادين.</Text>
          </View>
        </View>
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
  logoSection: { alignItems: 'center', marginBottom: 24 },
  logo: { width: 80, height: 80, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: '900', color: '#2D1B4D' },
  subtitle: { fontSize: 13, fontWeight: '600', color: '#64748B', marginTop: 4 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 22, ...SHADOWS.card },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: '#E91E63', textAlign: 'right', marginTop: 10, marginBottom: 8 },
  paragraph: { fontSize: 13.5, lineHeight: 22, color: '#475569', textAlign: 'right', fontWeight: '600', marginBottom: 14 },
  featureRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 10 },
  featureText: { flex: 1, fontSize: 13, fontWeight: '700', color: '#2D1B4D', textAlign: 'right' },
});
