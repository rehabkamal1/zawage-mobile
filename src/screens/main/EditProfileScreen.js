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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function EditProfileScreen({ navigation }) {
  const { user, updateUserProfile } = useAuth();
  const profile = user?.profile || {};

  const [nickname, setNickname] = useState(profile.nickname || '');
  const [phone, setPhone] = useState(user?.phone || profile.phone || '');
  const [maritalStatus, setMaritalStatus] = useState(profile.marital_status || '');
  const [governorate, setGovernorate] = useState(profile.governorate || '');
  const [area, setArea] = useState(profile.area || '');
  const [education, setEducation] = useState(profile.education || '');
  const [job, setJob] = useState(profile.job || '');
  const [height, setHeight] = useState(profile.height ? String(profile.height) : '');
  const [weight, setWeight] = useState(profile.weight ? String(profile.weight) : '');
  const [skinTone, setSkinTone] = useState(profile.skin_tone || '');
  const [prayer, setPrayer] = useState(profile.prayer || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [partnerSpecs, setPartnerSpecs] = useState(profile.partner_specs || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        nickname: nickname.trim(),
        phone: phone.trim(),
        marital_status: maritalStatus.trim(),
        governorate: governorate.trim(),
        area: area.trim(),
        education: education.trim(),
        job: job.trim(),
        height: height.trim() ? parseInt(height.trim(), 10) : null,
        weight: weight.trim() ? parseInt(weight.trim(), 10) : null,
        skin_tone: skinTone.trim(),
        prayer: prayer.trim(),
        bio: bio.trim(),
        partner_specs: partnerSpecs.trim(),
      };

      const res = await api.updateProfile(payload);
      if (res.user) {
        updateUserProfile(res.user);
      }
      Alert.alert('تم الحفظ 🎉', 'تم تحديث بيانات استمارتك بنجاح!');
    } catch (e) {
      Alert.alert('خطأ', e.message || 'تعذر حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  const InputField = ({ label, value, onChangeText, placeholder, multiline, keyboardType }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8B94B7"
        textAlign="right"
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType || 'default'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.topBarTitle}>استمارة الزواج الشرعي</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Basic Info */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>البيانات العامة والشخصية</Text>
          <InputField
            label="الاسم أو اللقب المستعار"
            value={nickname}
            onChangeText={setNickname}
            placeholder="مثال: سارة أو أحمد"
          />
          <InputField
            label="الحالة الاجتماعية"
            value={maritalStatus}
            onChangeText={setMaritalStatus}
            placeholder="مثال: آنسة، أعزب، مطلق، مطلقة"
          />
          <InputField
            label="رقم الهاتف / واتساب للتواصل"
            value={phone}
            onChangeText={setPhone}
            placeholder="010XXXXXXXX"
            keyboardType="phone-pad"
          />
          <InputField
            label="المحافظة"
            value={governorate}
            onChangeText={setGovernorate}
            placeholder="مثال: القاهرة"
          />
          <InputField
            label="المدينة أو المنطقة"
            value={area}
            onChangeText={setArea}
            placeholder="مثال: مدينة نصر"
          />
        </View>

        {/* Education & Physical Specs */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>التعليم والمواصفات البدنية</Text>
          <InputField
            label="المؤهل الدراسي"
            value={education}
            onChangeText={setEducation}
            placeholder="مثال: مؤهل عالي - بكالوريوس تجارة"
          />
          <InputField
            label="الوظيفة أو مجال العمل"
            value={job}
            onChangeText={setJob}
            placeholder="مثال: مهندس أو معلمة"
          />
          <View style={styles.rowInputs}>
            <View style={{ flex: 1 }}>
              <InputField
                label="الوزن (كجم)"
                value={weight}
                onChangeText={setWeight}
                placeholder="مثال: 65"
                keyboardType="numeric"
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <InputField
                label="الطول (سم)"
                value={height}
                onChangeText={setHeight}
                placeholder="مثال: 165"
                keyboardType="numeric"
              />
            </View>
          </View>
          <InputField
            label="لون البشرة"
            value={skinTone}
            onChangeText={setSkinTone}
            placeholder="مثال: قمحية، بيضاء، خمرية"
          />
          <InputField
            label="الالتزام بالصلاة والفرائض"
            value={prayer}
            onChangeText={setPrayer}
            placeholder="مثال: ملتزم، الحمد لله في وقتها"
          />
        </View>

        {/* Bio & Partner Specs */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>نبذة ومواصفات الشريك المطلوب</Text>
          <InputField
            label="نبذة عن شخصيتك وطباعك"
            value={bio}
            onChangeText={setBio}
            placeholder="اكتب نبذة مختصرة عن نفسك واهتماماتك وقيمك..."
            multiline
          />
          <InputField
            label="المواصفات المطلوبة في شريك الحياة"
            value={partnerSpecs}
            onChangeText={setPartnerSpecs}
            placeholder="اكتب ما تتمنى وجوده في الشريك ديناً وخلقاً..."
            multiline
          />
        </View>

        {/* Big Save Button */}
        <TouchableOpacity
          style={styles.saveBtnWrapper}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#E91E63', '#FF85A2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveGradientBtn}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                <Text style={styles.saveGradientBtnText}>حفظ وتحديث الاستمارة</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  topHeader: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F4F9',
  },
  topBarTitle: {
    fontSize: 17.5,
    fontWeight: '900',
    color: '#2D1B4D',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F4F9',
    ...SHADOWS.card,
  },
  cardSectionTitle: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#2D1B4D',
    textAlign: 'right',
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#2D1B4D',
    textAlign: 'right',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8F9FE',
    borderWidth: 1.5,
    borderColor: '#E8ECF4',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#2D1B4D',
  },
  multilineInput: {
    height: 90,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row-reverse',
  },
  saveBtnWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 8,
    ...SHADOWS.glow,
  },
  saveGradientBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  saveGradientBtnText: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
