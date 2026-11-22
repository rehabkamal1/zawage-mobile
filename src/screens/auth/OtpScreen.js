import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { api } from '../../api/client';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function OtpScreen({ route, navigation }) {
  const { showSuccess, showError, showWarning } = useAlert();
  const { email, phone, password, auth_method } = route.params || {};
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { login } = useAuth();

  const handleVerify = async () => {
    if (!code.trim() || code.trim().length < 4) {
      showWarning('تنبيه', 'يرجى إدخال رمز التحقق بشكل صحيح');
      return;
    }

    setLoading(true);
    try {
      await login({
        auth_method: auth_method || (phone ? 'phone' : 'email'),
        email: email || null,
        phone: phone || null,
        password,
        code: code.trim(),
      });
    } catch (err) {
      showError('خطأ في التحقق', err.message || 'رمز التحقق غير صحيح أو انتهت صلاحيته');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await api.sendOtp({
        auth_method: auth_method || (phone ? 'phone' : 'email'),
        email: email || null,
        phone: phone || null,
      });
      showSuccess('تم الإرسال 🎉', res.message || 'تم إرسال رمز تحقق جديد');
    } catch (err) {
      showError('تعذر الإرسال', err.message || 'حدث خطأ أثناء إعادة إرسال الرمز');
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name="mail-unread-outline" size={40} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>تأكيد الحساب (OTP)</Text>
        <Text style={styles.subtitle}>
          أدخل رمز التحقق المرسل إلى: {'\n'}
          <Text style={styles.emailText}>{email}</Text>
        </Text>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.otpInput}
            placeholder="• • • • • •"
            placeholderTextColor={COLORS.textLight}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
          />
        </View>

        <TouchableOpacity
          style={[styles.verifyBtn, loading && styles.btnDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.verifyBtnText}>تأكيد وتفعيل الحساب</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendBtn}
          onPress={handleResend}
          disabled={resending}
        >
          {resending ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={styles.resendText}>لم يصلك الرمز؟ <Text style={styles.resendBold}>إعادة إرسال</Text></Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 26,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emailText: {
    color: COLORS.text,
    fontWeight: '700',
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 20,
  },
  otpInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 16,
    height: 56,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 8,
    color: COLORS.text,
  },
  verifyBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 52,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  resendBtn: {
    marginTop: 18,
    padding: 6,
  },
  resendText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  resendBold: {
    color: COLORS.primary,
    fontWeight: '800',
  },
});
