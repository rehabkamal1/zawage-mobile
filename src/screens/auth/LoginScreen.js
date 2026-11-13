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

export default function LoginScreen({ navigation }) {
  const [authMethod, setAuthMethod] = useState('phone'); // 'phone' | 'email'
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();

  const handleLogin = async () => {
    const newErrors = {};

    if (authMethod === 'phone') {
      const cleanPhone = phone.trim();
      if (!cleanPhone) {
        newErrors.phone = 'يرجى إدخال رقم الهاتف';
      } else if (!/^\d{11}$/.test(cleanPhone)) {
        newErrors.phone = 'رقم الهاتف يجب أن يتكون من 11 رقماً صحيحاً (مثال: 01012345678)';
      }
    } else {
      const cleanEmail = email.trim();
      if (!cleanEmail) {
        newErrors.email = 'يرجى إدخال البريد الإلكتروني';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
          newErrors.email = 'برجاء إدخال بريد إلكتروني صحيح';
        }
      }
    }

    if (!password) {
      newErrors.password = 'يرجى إدخال كلمة المرور';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const payload = {
        auth_method: authMethod,
        phone: authMethod === 'phone' ? phone.trim() : null,
        email: authMethod === 'email' ? email.trim() : null,
        password,
      };

      await login(payload);
      // Navigation is automatically handled when isAuthenticated turns true
    } catch (err) {
      Alert.alert('تعذر تسجيل الدخول', err.message || 'بيانات الدخول غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  const showInfoModal = (title, message) => {
    Alert.alert(title, message, [{ text: 'حسناً' }]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button (if can go back) */}
        {navigation.canGoBack() && (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-forward" size={22} color="#2D1B4D" />
          </TouchableOpacity>
        )}

        {/* Brand Header */}
        <View style={styles.header}>
          <Image
            source={require('../../../assets/logo1.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.appTitle}>تسجيل الدخول</Text>
          <Text style={styles.appSubtitle}>سجل الدخول برقم الهاتف أو بريدك وكلمة المرور</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          {/* Auth Method Selector (Tabs) */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, authMethod === 'phone' && styles.tabBtnActive]}
              onPress={() => {
                setAuthMethod('phone');
                setErrors({});
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="call"
                size={17}
                color={authMethod === 'phone' ? '#FFFFFF' : '#475569'}
                style={{ marginLeft: 6 }}
              />
              <Text
                style={[styles.tabBtnText, authMethod === 'phone' && styles.tabBtnTextActive]}
              >
                رقم الهاتف (واتساب)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, authMethod === 'email' && styles.tabBtnActive]}
              onPress={() => {
                setAuthMethod('email');
                setErrors({});
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="mail"
                size={17}
                color={authMethod === 'email' ? '#FFFFFF' : '#475569'}
                style={{ marginLeft: 6 }}
              />
              <Text
                style={[styles.tabBtnText, authMethod === 'email' && styles.tabBtnTextActive]}
              >
                البريد الإلكتروني
              </Text>
            </TouchableOpacity>
          </View>

          {/* Phone Field */}
          {authMethod === 'phone' ? (
            <View style={styles.inputGroup}>
              <View style={[styles.inputWrapper, errors.phone && styles.inputWrapperError]}>
                <Ionicons name="call-outline" size={20} color="#8B94B7" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="رقم الهاتف (مثال: 01012345678)"
                  placeholderTextColor="#94A3B8"
                  value={phone}
                  onChangeText={(val) => {
                    setPhone(val);
                    if (errors.phone) setErrors({ ...errors, phone: null });
                  }}
                  keyboardType="phone-pad"
                  textAlign="right"
                />
              </View>
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>
          ) : (
            <View style={styles.inputGroup}>
              <View style={[styles.inputWrapper, errors.email && styles.inputWrapperError]}>
                <Ionicons name="mail-outline" size={20} color="#8B94B7" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="البريد الإلكتروني"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errors.email) setErrors({ ...errors, email: null });
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  textAlign="right"
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>
          )}

          {/* Password Field */}
          <View style={styles.inputGroup}>
            <View style={[styles.inputWrapper, errors.password && styles.inputWrapperError]}>
              <Ionicons name="lock-closed-outline" size={20} color="#8B94B7" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { paddingLeft: 40 }]}
                placeholder="كلمة المرور"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (errors.password) setErrors({ ...errors, password: null });
                }}
                secureTextEntry={!showPassword}
                textAlign="right"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#8B94B7"
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtnWrapper}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#E91E63', '#FF6090']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitBtn}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={[styles.submitBtnText, { marginRight: 8 }]}>جاري التحقق...</Text>
                </View>
              ) : (
                <Text style={styles.submitBtnText}>دخول</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Switch to Register */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>ليس لديك حساب؟</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>سجل الآن</Text>
            </TouchableOpacity>
          </View>

          {/* Web Links Footer */}
          <View style={styles.linksRow}>
            <TouchableOpacity
              onPress={() =>
                showInfoModal(
                  'عن المنصة',
                  'نصفي الآخر هي منصة إسلامية رائدة تهدف للتوفيق الحلال والزواج الشرعي الميسر بخصوصية وأمان تام.'
                )
              }
            >
              <Text style={styles.linkText}>عن المنصة</Text>
            </TouchableOpacity>
            <Text style={styles.dotSeparator}>•</Text>
            <TouchableOpacity
              onPress={() =>
                showInfoModal(
                  'شروط الاستخدام',
                  'المنصة مخصصة للزواج الشرعي فقط وبجدية تامة، وأي استخدام مخالف يعرض الحساب للحظر النهائي.'
                )
              }
            >
              <Text style={styles.linkText}>شروط الاستخدام</Text>
            </TouchableOpacity>
            <Text style={styles.dotSeparator}>•</Text>
            <TouchableOpacity
              onPress={() =>
                showInfoModal(
                  'سياسة الخصوصية',
                  'بياناتك الشخصية وأرقام التواصل مشفرة ومحفوظة بسرية تامة ولا تظهر إلا للمطابقين بطلب رسمي.'
                )
              }
            >
              <Text style={styles.linkText}>سياسة الخصوصية</Text>
            </TouchableOpacity>
            <Text style={styles.dotSeparator}>•</Text>
            <TouchableOpacity
              onPress={() =>
                showInfoModal(
                  'اتصل بنا',
                  'فريق الدعم الفني متاح دائماً عبر الواتساب على مدار الساعة لمساعدتك: 01017961150'
                )
              }
            >
              <Text style={styles.linkText}>اتصل بنا</Text>
            </TouchableOpacity>
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
    justifyContent: 'center',
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  backBtn: {
    position: 'absolute',
    top: 45,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...SHADOWS.card,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoImage: {
    width: 86,
    height: 86,
    marginBottom: 12,
  },
  appTitle: {
    fontSize: 25,
    fontWeight: '900',
    color: '#2D1B4D',
    letterSpacing: -0.3,
  },
  appSubtitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: '#F1F4F9',
    ...SHADOWS.card,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 5,
    borderRadius: 14,
    marginBottom: 20,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: '#E91E63',
    ...SHADOWS.glow,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#F8F9FE',
    borderWidth: 1.5,
    borderColor: '#E8ECF4',
    borderRadius: 15,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  inputWrapperError: {
    borderColor: '#E91E63',
    backgroundColor: '#FFF5F8',
  },
  inputIcon: {
    marginLeft: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#2D1B4D',
    textAlign: 'right',
  },
  eyeBtn: {
    position: 'absolute',
    left: 12,
    padding: 6,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E91E63',
    textAlign: 'right',
    marginTop: 5,
    marginRight: 4,
  },
  submitBtnWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 18,
    ...SHADOWS.glow,
  },
  submitBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  loadingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748B',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '900',
    color: '#E91E63',
  },
  linksRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F4F9',
  },
  linkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  dotSeparator: {
    fontSize: 11,
    color: '#CBD5E1',
  },
});
