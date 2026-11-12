import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function PrivacyScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-forward" size={22} color="#2D1B4D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>سياسة الخصوصية</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>حماية وتشفير البيانات</Text>
          <Text style={styles.paragraph}>
            نحن في منصة "نصفي الآخر" نولي خصوصية مشتركينا أقصى درجات العناية والحرص. جميع البيانات الحساسة وأرقام الهواتف مشفرة ومحفوظة في بيئة خوادم آمنة بأحدث معايير الحماية.
          </Text>

          <Text style={styles.sectionTitle}>ظهور البيانات لشركاء الحياة</Text>
          <Text style={styles.paragraph}>
            - رقم هاتفك المحمول لا يظهر لأي مستخدم بشكل علني، بل يظل محجوباً (010********).
            {'\n'}- لا يتاح إظهار رقم الهاتف إلا بعد قيام الطرف الجاد بطلب فك القفل رسمياً واستيفاء ضوابط الباقة.
            {'\n'}- البيانات الظاهرة للعموم تشمل فقط المواصفات العامة (السن، المحافظة، المؤهل، الوظيفة، والمواصفات الشرعية).
          </Text>

          <Text style={styles.sectionTitle}>إلغاء وتعديل الحساب</Text>
          <Text style={styles.paragraph}>
            يحق لك في أي وقت تعديل استمارتك ومواصفاتك، أو طلب إيقاف الحساب أو حذفه نهائياً عبر التواصل مع إدارة المنصة.
          </Text>
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#2D1B4D',
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    ...SHADOWS.card,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#E91E63',
    textAlign: 'right',
    marginTop: 14,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 13.5,
    lineHeight: 22,
    color: '#475569',
    textAlign: 'right',
    fontWeight: '600',
  },
});
