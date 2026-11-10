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
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال البريد الإلكتروني أو الهاتف وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      await login(identifier.trim(), password);
    } catch (err) {
      Alert.alert('تعذر تسجيل الدخول', err.message || 'بيانات الدخول غير صحيحة');
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
          <Text style={styles.appTitle}>نصفي الآخر</Text>
          <Text style={styles.appSubtitle}>منصة التوفيق الحلال والزواج الشرعي</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>تسجيل الدخول</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>البريد الإلكتروني أو رقم الهاتف</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="أدخل بريدك أو رقم هاتفك"
                placeholderTextColor={COLORS.textLight}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                keyboardType="email-address"
                textAlign="right"
              />
              <Ionicons name="person-outline" size={19} color="#8B94B7" style={styles.inputIcon} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>كلمة المرور</Text>
            <View style={styles.inputWrapper}>
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
              <TextInput
                style={[styles.input, { paddingLeft: 40 }]}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                textAlign="right"
              />
              <Ionicons name="lock-closed-outline" size={19} color="#8B94B7" style={styles.inputIcon} />
            </View>
          </View>

          {/* Login Submit Button with Pink Gradient */}
          <TouchableOpacity
            style={styles.submitBtnWrapper}
            onPress={handleLogin}
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
                  <Ionicons name="log-in-outline" size={20} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  <Text style={styles.submitBtnText}>دخول إلى حسابي</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Switch to Register */}
          <View style={styles.footerRow}>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>سجل حساب جديد الآن</Text>
            </TouchableOpacity>
            <Text style={styles.footerText}>ليس لديك حساب؟</Text>
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
    padding: 24,
    paddingTop: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoImage: {
    width: 68,
    height: 68,
    marginBottom: 12,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#2D1B4D',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#8B94B7',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F1F4F9',
    ...SHADOWS.card,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#2D1B4D',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#2D1B4D',
    textAlign: 'right',
    marginBottom: 6,
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
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#2D1B4D',
  },
  eyeBtn: {
    padding: 6,
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
    paddingVertical: 15,
  },
  submitBtnText: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  footerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
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
