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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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
      Alert.alert('تنبيه', 'كلمة المرور يجب أن لا تقل عن 6 أحرف أو أرقام');
      return;
    }

    setLoading(true);
    try {
      const res = await register(name.trim(), email.trim(), password, gender);
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-forward" size={24} color={COLORS.secondary} />
          </TouchableOpacity>
          <Text style={styles.title}>إنشاء حساب جديد</Text>
          <Text style={styles.subtitle}>انضم إلى منصة نصفي الآخر للتوفيق الحلال</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          {/* Gender Selector */}
          <Text style={styles.label}>أنا أبحث بصفتي:</Text>
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
                size={28}
                color={gender === 'male' ? '#FFFFFF' : COLORS.male}
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
                size={28}
                color={gender === 'female' ? '#FFFFFF' : COLORS.female}
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

          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>الاسم بالكامل أو المستعار</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={COLORS.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="مثال: أحمد محمود"
                placeholderTextColor={COLORS.textLight}
                value={name}
                onChangeText={setName}
                textAlign="right"
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>البريد الإلكتروني</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="yourname@example.com"
                placeholderTextColor={COLORS.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                textAlign="right"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>كلمة المرور</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="لا تقل عن 6 أحرف أو أرقام"
                placeholderTextColor={COLORS.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textAlign="right"
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>إنشاء الحساب ومتابعة</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginLinkText}>
              لديك حساب بالفعل؟ <Text style={styles.loginLinkBold}>تسجيل الدخول</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 50 : 36,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    right: 0,
    top: 4,
    padding: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 22,
    ...SHADOWS.medium,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'right',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  genderBox: {
    flex: 1,
    height: 76,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  genderBoxActiveMale: {
    backgroundColor: COLORS.male,
    borderColor: COLORS.male,
  },
  genderBoxActiveFemale: {
    backgroundColor: COLORS.female,
    borderColor: COLORS.female,
  },
  genderText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  genderTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: COLORS.text,
    paddingRight: 8,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    ...SHADOWS.small,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 6,
  },
  loginLinkText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  loginLinkBold: {
    color: COLORS.primary,
    fontWeight: '800',
  },
});
