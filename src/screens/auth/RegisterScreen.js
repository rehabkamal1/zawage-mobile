import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('male'); // male | female
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('تنبيه', 'يرجى إكمال جميع الحقول المطلوبة');
      return;
    }

    if (password.length < 6) {
      Alert.alert('تنبيه', 'كلمة المرور يجب ألا تقل عن 6 أحرف أو أرقام');
      return;
    }

    setLoading(true);
    try {
      const res = await register(name.trim(), email.trim(), password, gender, phone.trim());
      Alert.alert(
        'تم إنشاء الحساب بنجاح! 🎉',
        res.message || 'يرجى إدخال رمز التحقق (OTP) المرسل إليك لتفعيل الحساب.',
        [
          {
            text: 'متابعة',
            onPress: () => navigation.navigate('Otp', { email: email.trim(), password }),
          },
        ]
      );
    } catch (err) {
      Alert.alert('تعذر التسجيل', err.message || 'حدث خطأ أثناء إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand Header */}
        <View style={styles.header}>
          <Image
            source={require('../../../assets/logo1.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.appTitle}>إنشاء حساب جديد</Text>
          <Text style={styles.appSubtitle}>انضم إلى منصة نصفي الآخر للتوفيق الحلال</Text>
        </View>

        {/* Register Card */}
        <View style={styles.card}>
          {/* Gender Selector */}
          <Text style={styles.label}>أنا أسجل بصفتي:</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[
                styles.genderBox,
                gender === 'male' && styles.genderBoxActiveMale,
              ]}
              onPress={() => setGender('male')}
            >
              <Ionicons
                name="man"
                size={24}
                color={gender === 'male' ? '#FFFFFF' : '#0284C7'}
              />
              <Text
                style={[
                  styles.genderText,
                  gender === 'male' && styles.genderTextActive,
                ]}
              >
                عريس (شاب)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.genderBox,
                gender === 'female' && styles.genderBoxActiveFemale,
              ]}
              onPress={() => setGender('female')}
            >
              <Ionicons
                name="woman"
                size={24}
                color={gender === 'female' ? '#FFFFFF' : '#E91E63'}
              />
              <Text
                style={[
                  styles.genderText,
                  gender === 'female' && styles.genderTextActive,
                ]}
              >
                عروسة (فتاة)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>الاسم بالكامل أو اللقب</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="أدخل اسمك الكريم"
                placeholderTextColor={COLORS.textLight}
                value={name}
                onChangeText={setName}
                textAlign="right"
              />
              <Ionicons name="person-outline" size={19} color="#8B94B7" style={styles.inputIcon} />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>البريد الإلكتروني</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor={COLORS.textLight}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                textAlign="right"
              />
              <Ionicons name="mail-outline" size={19} color="#8B94B7" style={styles.inputIcon} />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>رقم الهاتف / واتساب</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="010xxxxxxxx"
                placeholderTextColor={COLORS.textLight}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                textAlign="right"
              />
              <Ionicons name="call-outline" size={19} color="#8B94B7" style={styles.inputIcon} />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>كلمة المرور (6 خانات على الأقل)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textAlign="right"
              />
              <Ionicons name="lock-closed-outline" size={19} color="#8B94B7" style={styles.inputIcon} />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtnWrapper}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#E91E63', '#FF85A2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitBtn}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="arrow-back-outline" size={20} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  <Text style={styles.submitBtnText}>متابعة التسجيل</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Switch to Login */}
          <View style={styles.footerRow}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>تسجيل الدخول</Text>
            </TouchableOpacity>
            <Text style={styles.footerText}>لديك حساب بالفعل؟</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 45,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoImage: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#2D1B4D',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8B94B7',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: '#F1F4F9',
    ...SHADOWS.card,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#2D1B4D',
    textAlign: 'right',
    marginBottom: 6,
  },
  genderRow: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginBottom: 16,
  },
  genderBox: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E8ECF4',
    backgroundColor: '#F8F9FE',
    gap: 8,
  },
  genderBoxActiveMale: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  genderBoxActiveFemale: {
    backgroundColor: '#E91E63',
    borderColor: '#E91E63',
  },
  genderText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#2D1B4D',
  },
  genderTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#F8F9FE',
    borderWidth: 1.5,
    borderColor: '#E8ECF4',
    borderRadius: 16,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginLeft: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#2D1B4D',
  },
  submitBtnWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 8,
    ...SHADOWS.glow,
  },
  submitBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  footerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8B94B7',
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '900',
    color: '#E91E63',
  },
});
