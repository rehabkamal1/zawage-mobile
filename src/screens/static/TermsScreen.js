import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function TermsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-forward" size={22} color="#2D1B4D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>شروط الاستخدام</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. الهدف والضوابط الشرعية</Text>
          <Text style={styles.paragraph}>
            منصة "نصفي الآخر" مخصصة حصراً للزواج الشرعي الحلال الجاد على كتاب الله وسنة رسوله ﷺ. يمنع منعاً باتاً استخدام المنصة للتعارف غير الشرعي، أو التسلية، أو الصداقة العابرة، أو أي غرض يخالف الآداب والتعاليم الإسلامية.
          </Text>

          <Text style={styles.sectionTitle}>2. دقة وصحة البيانات</Text>
          <Text style={styles.paragraph}>
            يتعهد المشترك بتقديم معلومات دقيقة وصحيحة بالكامل عن نفسه ومواصفاته، وأي تضليل أو انتحال شخصية أو تزوير في البيانات أو الحالة الاجتماعية يعرض صاحب الحساب للحظر النهائي والملاحقة القانونية.
          </Text>

          <Text style={styles.sectionTitle}>3. الخصوصية وحماية بيانات الطرف الآخر</Text>
          <Text style={styles.paragraph}>
            أرقام التواصل وبيانات الشركاء التي يتم فتح القفل لها هي أمانة خاصة، ويحظر قطعياً نشرها أو مشاركتها مع أطراف ثالثة أو استغلالها في غير غرض التقدم الرسمي للزواج.
          </Text>

          <Text style={styles.sectionTitle}>4. الباقات والاشتراكات</Text>
          <Text style={styles.paragraph}>
            الاشتراكات ورسوم فك القفل تساهم في تشغيل المنصة وتدقيق البيانات. يتم تفعيل التحويلات اليدوية (فودافون كاش) بعد مراجعة المشرفين للإيصال.
          </Text>

          <Text style={styles.sectionTitle}>5. الإبلاغ والإجراءات التأديبية</Text>
          <Text style={styles.paragraph}>
            تحتفظ إدارة المنصة بالحق الكامل في حظر أو إلغاء عضوية أي مستخدم يثبت عليه سوء سلوك أو ورود شكاوى أو بلاغات موثقة ضده دون سابق إنذار.
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
