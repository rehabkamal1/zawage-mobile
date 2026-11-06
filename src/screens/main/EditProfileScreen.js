import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function EditProfileScreen({ navigation }) {
  const { user, updateUserProfile } = useAuth();
  const profile = user?.profile || {};

  const [nickname, setNickname] = useState(profile.nickname || '');
  const [phone, setPhone] = useState(user?.phone || profile.phone || '');
  const [governorate, setGovernorate] = useState(profile.governorate || '');
  const [area, setArea] = useState(profile.area || '');
  const [education, setEducation] = useState(profile.education || '');
  const [job, setJob] = useState(profile.job || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [partnerSpecs, setPartnerSpecs] = useState(profile.partner_specs || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        nickname: nickname.trim(),
        phone: phone.trim(),
        governorate: governorate.trim(),
        area: area.trim(),
        education: education.trim(),
        job: job.trim(),
        bio: bio.trim(),
        partner_specs: partnerSpecs.trim(),
      };

      const res = await api.updateProfile(payload);
      if (res.user) {
        updateUserProfile(res.user);
      }
      Alert.alert('تم الحفظ', 'تم تحديث بيانات الاستمارة بنجاح!', [
        { text: 'حسناً', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('خطأ', e.message || 'تعذر حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  const InputField = ({ label, value, onChangeText, placeholder, multiline }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textLight}
        textAlign="right"
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[styles.saveTopBtn, saving && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveTopBtnText}>حفظ</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.topBarTitle}>تعديل الاستمارة</Text>

        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-forward" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>البيانات العامة</Text>
          <InputField
            label="الاسم المستعار أو الشهرة"
            value={nickname}
            onChangeText={setNickname}
            placeholder="مثال: أم محمد أو أبو أحمد"
          />
          <InputField
            label="رقم الهاتف للتواصل"
            value={phone}
            onChangeText={setPhone}
            placeholder="010XXXXXXXX"
          />
          <InputField
            label="المحافظة"
            value={governorate}
            onChangeText={setGovernorate}
            placeholder="مثال: القاهرة"
          />
          <InputField
            label="المنطقة أو الحي"
            value={area}
            onChangeText={setArea}
            placeholder="مثال: مدينة نصر"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>التعليم والعمل</Text>
          <InputField
            label="المؤهل الدراسي"
            value={education}
            onChangeText={setEducation}
            placeholder="مثال: بكالوريوس تجارة"
          />
          <InputField
            label="الوظيفة الحالية"
            value={job}
            onChangeText={setJob}
            placeholder="مثال: محاسب قانوني"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>نبذة ومواصفات الشريك</Text>
          <InputField
            label="نبذة عن شخصيتك وطباعك"
            value={bio}
            onChangeText={setBio}
            placeholder="اكتب نبذة مختصرة عن نفسك واهتماماتك..."
            multiline
          />
          <InputField
            label="المواصفات المطلوبة في شريك الحياة"
            value={partnerSpecs}
            onChangeText={setPartnerSpecs}
            placeholder="اكتب مواصفاتك للشريك المطلوب..."
            multiline
          />
        </View>

        <TouchableOpacity
          style={[styles.bigSaveBtn, saving && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.bigSaveBtnText}>حفظ وتحديث الاستمارة</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveTopBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 12,
  },
  saveTopBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.secondary,
    textAlign: 'right',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    paddingBottom: 8,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  multilineInput: {
    height: 90,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  bigSaveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    ...SHADOWS.small,
  },
  bigSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
