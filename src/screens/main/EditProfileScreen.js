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
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { APP_CONFIG } from '../../constants/config';
import { COLORS, SHADOWS } from '../../constants/theme';

const GOVERNORATES = APP_CONFIG.GOVERNORATES;

const MARITAL_STATUSES_MALE = [
  { label: 'أعزب', value: 'single' },
  { label: 'مطلق', value: 'divorced' },
  { label: 'أرمل', value: 'widowed' },
  { label: 'متزوج (تعدد)', value: 'married' },
];

const MARITAL_STATUSES_FEMALE = [
  { label: 'آنسة', value: 'single' },
  { label: 'مطلقة', value: 'divorced' },
  { label: 'أرملة', value: 'widowed' },
];

const PRAYER_OPTIONS = [
  { label: 'في وقتها في المسجد', value: 'always' },
  { label: 'أغلب الأوقات', value: 'mostly' },
  { label: 'أحياناً / متقطع', value: 'sometimes' },
];

const SMOKING_OPTIONS = [
  { label: 'غير مدخن تماماً', value: 'no' },
  { label: 'مدخن', value: 'yes' },
  { label: 'أحياناً / شيشة فقط', value: 'sometimes' },
];

const HIJAB_OPTIONS = [
  { label: 'خمار / إسدال', value: 'khimar' },
  { label: 'منتقبة', value: 'niqab' },
  { label: 'حجاب شرعي / طرحة', value: 'hijab' },
  { label: 'غير محجبة', value: 'none' },
];

const SKIN_TONE_OPTIONS = [
  { label: 'أبيض فاتح', value: 'white' },
  { label: 'قمحي فاتح', value: 'fair' },
  { label: 'قمحي', value: 'wheat' },
  { label: 'خمري / أسمر', value: 'brown' },
  { label: 'أسمر داكن', value: 'dark' },
];

const QAIMA_OPTIONS = [
  { label: 'بالقائمة', value: 'بالقائمة' },
  { label: 'بدون قائمة', value: 'بدون قائمة' },
  { label: 'حسب الاتفاق', value: 'حسب الاتفاق' },
];

const POLYGAMY_OPTIONS = [
  { label: 'نعم أقبل التعدد', value: 'yes' },
  { label: 'لا أقبل التعدد', value: 'no' },
  { label: 'حسب الاتفاق والشروط', value: 'conditional' },
];

const ACCOMMODATION_OPTIONS = [
  { label: 'شقة ملك مستقلة', value: 'own' },
  { label: 'شقة إيجار جديد', value: 'rent' },
  { label: 'سكن عائلي (بيت عيلة)', value: 'family' },
];

export default function EditProfileScreen({ navigation }) {
  const { user, updateUserProfile } = useAuth();
  const isFemale = user?.gender === 'female';

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    nickname: '',
    phone: '',
    dob: '1995-01-01',
    marital_status: '',
    has_children: 'no',
    custody: '',
    children_count: '',
    education: '',
    job: '',
    income: '',
    accommodation: '',
    governorate: '',
    area: '',
    address: '',
    prayer: '',
    hijab: '',
    smoking: '',
    skin_tone: '',
    weight: '',
    height: '',
    guardian_name: '',
    guardian_phone: '',
    relation: '',
    move_other_gov: 'no',
    family_house: 'no',
    accept_polygamy: 'no',
    qaima_status: 'حسب الاتفاق',
    bio: '',
    // Partner specs
    req_governorate: 'الكل',
    req_age_min: isFemale ? '24' : '18',
    req_age_max: isFemale ? '40' : '35',
    req_marital_status: 'any',
    req_job: '',
    req_education: '',
    req_prayer: '',
    req_hijab: '',
    req_smoking: '',
    partner_specs: '',
  });

  // Picker Modal State
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerConfig, setPickerConfig] = useState({ title: '', options: [], key: '' });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await api.getProfile().catch(() => null);
      const profile = res?.profile || user?.profile || {};

      setFormData((prev) => ({
        ...prev,
        ...profile,
        full_name: profile.full_name || user?.name || '',
        phone: user?.phone || profile.phone || '',
        marital_status: profile.marital_status || '',
        has_children: profile.has_children ? 'yes' : 'no',
        move_other_gov: profile.move_other_gov ? 'yes' : 'no',
        family_house: profile.family_house ? 'yes' : 'no',
        accept_polygamy: profile.accept_polygamy ? 'yes' : 'no',
        qaima_status: profile.qaima_status || 'حسب الاتفاق',
        req_governorate: profile.req_governorate || 'الكل',
        req_age_min: profile.req_age_min ? String(profile.req_age_min) : (isFemale ? '24' : '18'),
        req_age_max: profile.req_age_max ? String(profile.req_age_max) : (isFemale ? '40' : '35'),
        height: profile.height ? String(profile.height) : '',
        weight: profile.weight ? String(profile.weight) : '',
      }));

      // If profile is already registered (has governorate and marital_status) and not explicitly editing, show summary
      if (profile.governorate && profile.marital_status) {
        setIsEditing(false);
      } else {
        setIsEditing(true);
      }
    } catch (e) {
      console.log('Error loading profile', e);
    } finally {
      setLoading(false);
    }
  };

  const isAlreadyRegistered = Boolean(
    formData.governorate && formData.marital_status && formData.education
  );

  const updateField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const openPicker = (title, key, options) => {
    setPickerConfig({ title, key, options });
    setPickerVisible(true);
  };

  const handleSelectOption = (value) => {
    updateField(pickerConfig.key, value);
    setPickerVisible(false);
  };

  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      if (!formData.full_name.trim()) {
        Alert.alert('تنبيه', 'يرجى إدخال الاسم بالكامل.');
        return false;
      }
      if (!formData.phone.trim() || formData.phone.length < 10) {
        Alert.alert('تنبيه', 'يرجى إدخال رقم هاتف صحيح (11 رقم).');
        return false;
      }
      if (!formData.marital_status) {
        Alert.alert('تنبيه', 'يرجى تحديد الحالة الاجتماعية.');
        return false;
      }
      if (!formData.education.trim()) {
        Alert.alert('تنبيه', 'يرجى إدخال المؤهل الدراسي.');
        return false;
      }
      if (!formData.job.trim()) {
        Alert.alert('تنبيه', 'يرجى إدخال الوظيفة أو كتابة (لا أعمل).');
        return false;
      }
    }

    if (currentStep === 2) {
      if (!formData.governorate.trim()) {
        Alert.alert('تنبيه', 'يرجى اختيار المحافظة.');
        return false;
      }
      if (!formData.area.trim()) {
        Alert.alert('تنبيه', 'يرجى إدخال المدينة أو المركز.');
        return false;
      }
      if (!formData.prayer) {
        Alert.alert('تنبيه', 'يرجى تحديد درجة الالتزام بالصلاة.');
        return false;
      }
      if (isFemale) {
        if (!formData.hijab) {
          Alert.alert('تنبيه', 'يرجى تحديد نوع الحجاب.');
          return false;
        }
        if (!formData.guardian_phone.trim() || formData.guardian_phone.length < 10) {
          Alert.alert('تنبيه', 'يرجى إدخال رقم هاتف ولي الأمر (11 رقم).');
          return false;
        }
      } else {
        if (!formData.smoking) {
          Alert.alert('تنبيه', 'يرجى تحديد الموقف من التدخين.');
          return false;
        }
      }
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSave = async () => {
    if (!validateStep(1) || !validateStep(2)) return;

    setSaving(true);
    try {
      const payload = {
        ...formData,
        full_name: formData.full_name.trim(),
        nickname: formData.nickname.trim() || formData.full_name.trim(),
        phone: formData.phone.trim(),
        governorate: formData.governorate.trim(),
        area: formData.area.trim(),
        education: formData.education.trim(),
        job: formData.job.trim(),
        height: formData.height ? parseInt(formData.height, 10) : null,
        weight: formData.weight ? parseInt(formData.weight, 10) : null,
        req_age_min: formData.req_age_min ? parseInt(formData.req_age_min, 10) : 18,
        req_age_max: formData.req_age_max ? parseInt(formData.req_age_max, 10) : 60,
        has_children: formData.has_children === 'yes',
        move_other_gov: formData.move_other_gov === 'yes',
        family_house: formData.family_house === 'yes',
        accept_polygamy: formData.accept_polygamy === 'yes',
        qaima_status: formData.qaima_status || 'حسب الاتفاق',
      };

      if (!isFemale) {
        delete payload.hijab;
        delete payload.guardian_name;
        delete payload.guardian_phone;
        delete payload.relation;
      }

      const res = await api.updateProfile(payload);
      if (res.user || res.profile) {
        updateUserProfile({ ...(user || {}), profile: res.profile || payload });
      }

      Alert.alert(
        'تم الحفظ بنجاح 🎉',
        isAlreadyRegistered
          ? 'تم تحديث بيانات استمارتك بنجاح. استمارتك الآن محدثة ومتاحة للمطابقة.'
          : 'تهانينا! تم حفظ استمارة الزواج الشرعي بنجاح وأصبحت مرئية للشريك المناسب.',
        !isFemale
          ? [
              {
                text: 'تصفح العرايس الآن 🌸',
                onPress: () => {
                  setIsEditing(false);
                  navigation.navigate('HomeTab');
                },
              },
              { text: 'حسناً', onPress: () => setIsEditing(false) },
            ]
          : [{ text: 'حسناً', onPress: () => setIsEditing(false) }]
      );
    } catch (e) {
      Alert.alert('خطأ في الحفظ', e.message || 'يرجى مراجعة البيانات المدخلة والمحاولة مجدداً.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>جاري تحميل بيانات الاستمارة...</Text>
      </View>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW 1: Already Registered Summary View (Matches Web Profile Overview)
  // ----------------------------------------------------------------------
  if (isAlreadyRegistered && !isEditing) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        <View style={styles.topHeader}>
          <Text style={styles.topBarTitle}>استمارة الزواج الشرعي المسجلة</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Status Banner */}
          <View style={styles.statusBanner}>
            <View style={styles.statusIconCircle}>
              <Ionicons name="checkmark-done" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.statusTextCol}>
              <Text style={styles.statusTitle}>
                {isFemale ? 'أنتِ مسجلة استمارتك بالفعل في المنصة 🌸' : 'أنت مسجل استمارتك بالفعل في المنصة 🌟'}
              </Text>
              <Text style={styles.statusSubtitle}>استمارتك نشطة ومتاحة في نتائج البحث والتوافق الشرعي</Text>
            </View>
          </View>

          {/* Quick Edit CTA Button */}
          <TouchableOpacity
            style={styles.editCtaBtn}
            onPress={() => {
              setIsEditing(true);
              setStep(1);
            }}
            activeOpacity={0.88}
          >
            <Ionicons name="create-outline" size={20} color="#FFFFFF" style={{ marginLeft: 6 }} />
            <Text style={styles.editCtaText}>تعديل بيانات الاستمارة ✏️</Text>
          </TouchableOpacity>

          {/* Section 1: Basic Info */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="person-circle-outline" size={22} color="#E91E63" />
              <Text style={styles.cardSectionTitle}>البيانات الشخصية والأساسية</Text>
            </View>

            <SummaryRow label="الاسم بالكامل" value={formData.full_name} />
            <SummaryRow label="الاسم المستعار" value={formData.nickname || formData.full_name} />
            <SummaryRow label="رقم الهاتف" value={formData.phone} />
            <SummaryRow label="الحالة الاجتماعية" value={getMaritalLabel(formData.marital_status, isFemale)} />
            <SummaryRow label="المؤهل الدراسي" value={formData.education} />
            <SummaryRow label="الوظيفة / العمل" value={formData.job} />
            {!isFemale && <SummaryRow label="الدخل الشهري" value={formData.income || 'غير محدد'} />}
            {!isFemale && <SummaryRow label="نوع السكن" value={formData.accommodation || 'شقة مستقلة'} />}
            <SummaryRow label="الطول والوزن" value={formData.height ? `${formData.height} سم • ${formData.weight || ''} كجم` : 'غير محدد'} />
            <SummaryRow label="لون البشرة" value={getSkinToneLabel(formData.skin_tone)} />
          </View>

          {/* Section 2: Religious & Location */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="home-outline" size={22} color="#8B5CF6" />
              <Text style={styles.cardSectionTitle}>السكن والالتزام والأسرة</Text>
            </View>

            <SummaryRow label="المحافظة" value={formData.governorate} />
            <SummaryRow label="المدينة / المركز" value={formData.area} />
            <SummaryRow label="الالتزام بالصلاة" value={getPrayerLabel(formData.prayer)} />
            {isFemale ? (
              <>
                <SummaryRow label="نوع الحجاب" value={getHijabLabel(formData.hijab)} />
                <SummaryRow label="ولي الأمر" value={formData.guardian_name || 'الأب'} />
                <SummaryRow label="هاتف ولي الأمر" value={formData.guardian_phone} />
                <SummaryRow label="صلة القرابة" value={formData.relation || 'والد'} />
              </>
            ) : (
              <SummaryRow label="التدخين" value={getSmokingLabel(formData.smoking)} />
            )}
            <SummaryRow label="الموقف من القائمة" value={formData.qaima_status} />
            <SummaryRow label="قبول التعدد" value={formData.accept_polygamy === 'yes' ? 'نعم أقبل' : 'لا أقبل'} />
            <SummaryRow label="السكن في بيت عائلة" value={formData.family_house === 'yes' ? 'نعم' : 'لا'} />
            <SummaryRow label="الانتقال لمحافظة أخرى" value={formData.move_other_gov === 'yes' ? 'نعم' : 'لا'} />
          </View>

          {/* Section 3: Partner Specs */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="heart-circle-outline" size={22} color="#0284C7" />
              <Text style={styles.cardSectionTitle}>المواصفات المطلوبة في الشريك</Text>
            </View>

            <SummaryRow label="السن المطلوب" value={`من ${formData.req_age_min || 20} إلى ${formData.req_age_max || 50} سنة`} />
            <SummaryRow label="المحافظة المطلوبة" value={formData.req_governorate || 'الكل'} />
            <SummaryRow label="الحالة الاجتماعية المطلوبة" value={formData.req_marital_status === 'any' ? 'لا يهم' : getMaritalLabel(formData.req_marital_status, !isFemale)} />
            {formData.partner_specs ? <SummaryRow label="مواصفات إضافية" value={formData.partner_specs} /> : null}
            {formData.bio ? <SummaryRow label="نبذة تعريفية" value={formData.bio} /> : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW 2: Multi-step Form (Steps 1 to 4)
  // ----------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        {isAlreadyRegistered && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setIsEditing(false)}>
            <Ionicons name="close" size={22} color="#2D1B4D" />
          </TouchableOpacity>
        )}
        <Text style={styles.topBarTitle}>
          {isFemale ? 'استمارة طلب زواج (عروسة)' : 'استمارة طلب زواج (عريس)'}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Step Indicators */}
      <View style={styles.stepsBar}>
        {[1, 2, 3, 4].map((s) => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepCircle, step >= s && styles.stepCircleActive, step === s && styles.stepCircleCurrent]}>
              <Text style={[styles.stepNum, step >= s && styles.stepNumActive]}>{s}</Text>
            </View>
            <Text style={[styles.stepTitle, step === s && styles.stepTitleCurrent]}>
              {s === 1 ? 'البيانات' : s === 2 ? 'السكن' : s === 3 ? 'الشريك' : 'مراجعة'}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* STEP 1: Personal & Basic Info */}
        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>الخطوة 1: البيانات الشخصية والأساسية</Text>

            <InputField
              label="الاسم بالكامل *"
              value={formData.full_name}
              onChangeText={(v) => updateField('full_name', v)}
              placeholder="مثال: أحمد محمد علي"
            />

            <InputField
              label="الاسم المستعار (يظهر في نتائج البحث) *"
              value={formData.nickname}
              onChangeText={(v) => updateField('nickname', v)}
              placeholder="مثال: أبو عمر / أميرة"
            />

            <InputField
              label="رقم الهاتف (واتساب) *"
              value={formData.phone}
              onChangeText={(v) => updateField('phone', v)}
              keyboardType="phone-pad"
              placeholder="مثال: 01012345678"
            />

            <PickerField
              label="الحالة الاجتماعية *"
              value={getMaritalLabel(formData.marital_status, isFemale)}
              placeholder="اختر الحالة الاجتماعية..."
              onPress={() =>
                openPicker(
                  'اختر الحالة الاجتماعية',
                  'marital_status',
                  isFemale ? MARITAL_STATUSES_FEMALE : MARITAL_STATUSES_MALE
                )
              }
            />

            <InputField
              label="المؤهل الدراسي *"
              value={formData.education}
              onChangeText={(v) => updateField('education', v)}
              placeholder="مثال: بكالوريوس تجارة / ليسانس حقوق"
            />

            <InputField
              label="الوظيفة / العمل *"
              value={formData.job}
              onChangeText={(v) => updateField('job', v)}
              placeholder="مثال: مهندس برمجيات / معلمة / لا أعمل"
            />

            {!isFemale && (
              <>
                <InputField
                  label="الدخل الشهري التقريبي"
                  value={formData.income}
                  onChangeText={(v) => updateField('income', v)}
                  placeholder="مثال: 7000 - 10000 جنيه"
                />

                <PickerField
                  label="نوع السكن المتوفر"
                  value={getAccommodationLabel(formData.accommodation)}
                  placeholder="اختر نوع السكن..."
                  onPress={() =>
                    openPicker('اختر نوع السكن المتوفر', 'accommodation', ACCOMMODATION_OPTIONS)
                  }
                />
              </>
            )}

            <View style={styles.rowTwo}>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <InputField
                  label="الطول (سم)"
                  value={formData.height}
                  onChangeText={(v) => updateField('height', v)}
                  keyboardType="numeric"
                  placeholder="175"
                />
              </View>
              <View style={{ flex: 1, marginRight: 6 }}>
                <InputField
                  label="الوزن (كجم)"
                  value={formData.weight}
                  onChangeText={(v) => updateField('weight', v)}
                  keyboardType="numeric"
                  placeholder="70"
                />
              </View>
            </View>

            <PickerField
              label="لون البشرة"
              value={getSkinToneLabel(formData.skin_tone)}
              placeholder="اختر لون البشرة..."
              onPress={() => openPicker('اختر لون البشرة', 'skin_tone', SKIN_TONE_OPTIONS)}
            />
          </View>
        )}

        {/* STEP 2: Residence & Religious & Family */}
        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>الخطوة 2: السكن والالتزام والأسرة</Text>

            <PickerField
              label="المحافظة *"
              value={formData.governorate}
              placeholder="اختر المحافظة..."
              onPress={() =>
                openPicker(
                  'اختر المحافظة',
                  'governorate',
                  GOVERNORATES.filter((g) => g !== 'الكل').map((g) => ({ label: g, value: g }))
                )
              }
            />

            <InputField
              label="المدينة / المركز *"
              value={formData.area}
              onChangeText={(v) => updateField('area', v)}
              placeholder="مثال: مصر الجديدة / طنطا / المنصورة"
            />

            <InputField
              label="العنوان بالتفصيل (سري للإدارة فقط)"
              value={formData.address}
              onChangeText={(v) => updateField('address', v)}
              placeholder="الشارع / المنطقة"
            />

            <PickerField
              label="الالتزام بالصلاة *"
              value={getPrayerLabel(formData.prayer)}
              placeholder="اختر درجة الالتزام بالصلاة..."
              onPress={() => openPicker('الالتزام بالصلاة', 'prayer', PRAYER_OPTIONS)}
            />

            {isFemale ? (
              <>
                <PickerField
                  label="نوع الحجاب *"
                  value={getHijabLabel(formData.hijab)}
                  placeholder="اختر نوع الحجاب..."
                  onPress={() => openPicker('نوع الحجاب', 'hijab', HIJAB_OPTIONS)}
                />

                <InputField
                  label="اسم ولي الأمر"
                  value={formData.guardian_name}
                  onChangeText={(v) => updateField('guardian_name', v)}
                  placeholder="مثال: محمد علي (الوالد)"
                />

                <InputField
                  label="رقم هاتف ولي الأمر (للتواصل الشرعي) *"
                  value={formData.guardian_phone}
                  onChangeText={(v) => updateField('guardian_phone', v)}
                  keyboardType="phone-pad"
                  placeholder="مثال: 01012345678"
                />

                <InputField
                  label="صلة قرابة ولي الأمر"
                  value={formData.relation}
                  onChangeText={(v) => updateField('relation', v)}
                  placeholder="والد / أخ / عم"
                />
              </>
            ) : (
              <PickerField
                label="الموقف من التدخين *"
                value={getSmokingLabel(formData.smoking)}
                placeholder="اختر موقفك من التدخين..."
                onPress={() => openPicker('الموقف من التدخين', 'smoking', SMOKING_OPTIONS)}
              />
            )}

            <PickerField
              label="الموقف من القائمة *"
              value={formData.qaima_status}
              placeholder="اختر موقفك من القائمة..."
              onPress={() => openPicker('الموقف من قائمة المنقولات', 'qaima_status', QAIMA_OPTIONS)}
            />

            <PickerField
              label="قبول التعدد"
              value={formData.accept_polygamy === 'yes' ? 'نعم أقبل' : 'لا أقبل'}
              placeholder="اختر موقفك من التعدد..."
              onPress={() => openPicker('الموقف من التعدد', 'accept_polygamy', POLYGAMY_OPTIONS)}
            />

            <ToggleRow
              label="إمكانية السكن في بيت عائلة؟"
              active={formData.family_house === 'yes'}
              onToggle={() =>
                updateField('family_house', formData.family_house === 'yes' ? 'no' : 'yes')
              }
            />

            <ToggleRow
              label="إمكانية الانتقال لمحافظة أخرى بعد الزواج؟"
              active={formData.move_other_gov === 'yes'}
              onToggle={() =>
                updateField('move_other_gov', formData.move_other_gov === 'yes' ? 'no' : 'yes')
              }
            />
          </View>
        )}

        {/* STEP 3: Partner Specs */}
        {step === 3 && (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>الخطوة 3: مواصفات شريك الحياة المطلوب</Text>

            <View style={styles.rowTwo}>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <InputField
                  label="السن من"
                  value={formData.req_age_min}
                  onChangeText={(v) => updateField('req_age_min', v)}
                  keyboardType="numeric"
                  placeholder="20"
                />
              </View>
              <View style={{ flex: 1, marginRight: 6 }}>
                <InputField
                  label="السن إلى"
                  value={formData.req_age_max}
                  onChangeText={(v) => updateField('req_age_max', v)}
                  keyboardType="numeric"
                  placeholder="40"
                />
              </View>
            </View>

            <PickerField
              label="المحافظة المطلوبة"
              value={formData.req_governorate}
              placeholder="اختر المحافظة المطلوبة..."
              onPress={() =>
                openPicker(
                  'المحافظة المطلوبة في الشريك',
                  'req_governorate',
                  GOVERNORATES.map((g) => ({ label: g, value: g }))
                )
              }
            />

            <PickerField
              label="الحالة الاجتماعية المطلوبة"
              value={formData.req_marital_status === 'any' ? 'لا يهم / الكل' : getMaritalLabel(formData.req_marital_status, !isFemale)}
              placeholder="اختر الحالة الاجتماعية المطلوبة..."
              onPress={() =>
                openPicker(
                  'الحالة الاجتماعية المطلوبة',
                  'req_marital_status',
                  [{ label: 'لا يهم / الكل', value: 'any' }, ...(isFemale ? MARITAL_STATUSES_MALE : MARITAL_STATUSES_FEMALE)]
                )
              }
            />

            <InputField
              label="المواصفات المطلوبة في شريك الحياة"
              value={formData.partner_specs}
              onChangeText={(v) => updateField('partner_specs', v)}
              multiline
              placeholder="اكتب مواصفات الشريك المرغوبة (الأخلاق، الالتزام، التفاهم...)"
            />

            <InputField
              label="نبذة تعريفية عنك وعن طباعك"
              value={formData.bio}
              onChangeText={(v) => updateField('bio', v)}
              multiline
              placeholder="تحدث بإيجاز عن شخصيتك، هواياتك، وتطلعاتك للبيت المسلم..."
            />
          </View>
        )}

        {/* STEP 4: Review and Submit */}
        {step === 4 && (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>الخطوة 4: مراجعة البيانات والحفظ</Text>
            <Text style={styles.cardSubtitle}>
              يرجى مراجعة بياناتك بدقة قبل الحفظ. تذكر أن الصدق والأمانة هما أساس التوفيق والبركة في الزواج الشرعي.
            </Text>

            <View style={styles.reviewBox}>
              <SummaryRow label="الاسم" value={formData.full_name} />
              <SummaryRow label="الهاتف" value={formData.phone} />
              <SummaryRow label="الحالة الاجتماعية" value={getMaritalLabel(formData.marital_status, isFemale)} />
              <SummaryRow label="المحافظة والمدينة" value={`${formData.governorate} - ${formData.area}`} />
              <SummaryRow label="المؤهل والوظيفة" value={`${formData.education} - ${formData.job}`} />
              <SummaryRow label="الالتزام بالصلاة" value={getPrayerLabel(formData.prayer)} />
              {isFemale ? (
                <SummaryRow label="هاتف ولي الأمر" value={formData.guardian_phone} />
              ) : (
                <SummaryRow label="التدخين" value={getSmokingLabel(formData.smoking)} />
              )}
            </View>

            <TouchableOpacity
              style={styles.submitFinalBtn}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.88}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  <Text style={styles.submitFinalBtnText}>حفظ وتأكيد الاستمارة الآن ✅</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Wizard Controls */}
        <View style={styles.wizardControls}>
          {step < 4 ? (
            <TouchableOpacity style={styles.nextBtn} onPress={handleNextStep}>
              <Ionicons name="arrow-back-outline" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
              <Text style={styles.nextBtnText}>الخطوة التالية</Text>
            </TouchableOpacity>
          ) : null}

          {step > 1 ? (
            <TouchableOpacity style={styles.prevBtn} onPress={handlePrevStep}>
              <Text style={styles.prevBtnText}>السابق</Text>
              <Ionicons name="arrow-forward-outline" size={18} color="#64748B" style={{ marginRight: 6 }} />
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>

      {/* Select Picker Modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Ionicons name="close-circle-outline" size={26} color="#8B94B7" />
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>{pickerConfig.title}</Text>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {pickerConfig.options.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={styles.pickerOptionItem}
                  onPress={() => handleSelectOption(opt.value)}
                >
                  <Text style={styles.pickerOptionText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Helper Components
const InputField = ({ label, value, onChangeText, placeholder, multiline, keyboardType }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && styles.multilineInput]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#94A3B8"
      textAlign="right"
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
      keyboardType={keyboardType || 'default'}
    />
  </View>
);

const PickerField = ({ label, value, placeholder, onPress }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity style={styles.pickerTrigger} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name="chevron-down" size={18} color="#8B94B7" />
      <Text style={[styles.pickerValueText, !value && styles.placeholderText]}>
        {value || placeholder}
      </Text>
    </TouchableOpacity>
  </View>
);

const ToggleRow = ({ label, active, onToggle }) => (
  <TouchableOpacity style={styles.toggleRow} onPress={onToggle} activeOpacity={0.8}>
    <View style={[styles.toggleSwitch, active && styles.toggleSwitchActive]}>
      <View style={[styles.toggleThumb, active && styles.toggleThumbActive]} />
    </View>
    <Text style={styles.toggleLabel}>{label}</Text>
  </TouchableOpacity>
);

const SummaryRow = ({ label, value }) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryValue}>{value || '-'}</Text>
    <Text style={styles.summaryLabel}>{label}:</Text>
  </View>
);

// Label Translators
function getMaritalLabel(val, isFemale) {
  if (val === 'single') return isFemale ? 'آنسة' : 'أعزب';
  if (val === 'divorced') return isFemale ? 'مطلقة' : 'مطلق';
  if (val === 'widowed') return isFemale ? 'أرملة' : 'أرمل';
  if (val === 'married') return 'متزوج (تعدد)';
  return val || '-';
}

function getPrayerLabel(val) {
  if (val === 'always') return 'في وقتها في المسجد / بانتظام';
  if (val === 'mostly') return 'أغلب الأوقات';
  if (val === 'sometimes') return 'أحياناً / متقطع';
  return val || '-';
}

function getSmokingLabel(val) {
  if (val === 'no') return 'غير مدخن تماماً';
  if (val === 'yes') return 'مدخن';
  if (val === 'sometimes') return 'أحياناً / شيشة فقط';
  return val || '-';
}

function getHijabLabel(val) {
  if (val === 'khimar') return 'خمار / إسدال';
  if (val === 'niqab') return 'منتقبة';
  if (val === 'hijab') return 'حجاب شرعي / طرحة';
  if (val === 'none') return 'غير محجبة';
  return val || '-';
}

function getSkinToneLabel(val) {
  if (val === 'white') return 'أبيض فاتح';
  if (val === 'fair') return 'قمحي فاتح';
  if (val === 'wheat') return 'قمحي';
  if (val === 'brown') return 'خمري / أسمر';
  if (val === 'dark') return 'أسمر داكن';
  return val || '-';
}

function getAccommodationLabel(val) {
  if (val === 'own') return 'شقة ملك مستقلة';
  if (val === 'rent') return 'شقة إيجار جديد';
  if (val === 'family') return 'سكن عائلي (بيت عيلة)';
  return val || '-';
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FE' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  loadingText: { marginTop: 12, fontSize: 13.5, fontWeight: '700', color: '#64748B' },
  topHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F4F9',
  },
  topBarTitle: { fontSize: 16.5, fontWeight: '900', color: '#2D1B4D' },
  backBtn: { padding: 4 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Status Banner
  statusBanner: {
    backgroundColor: '#FFF0F5',
    borderWidth: 1.5,
    borderColor: '#FBCFE8',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 14,
    ...SHADOWS.small,
  },
  statusIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E91E63',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  statusTextCol: { flex: 1, alignItems: 'flex-end' },
  statusTitle: { fontSize: 14, fontWeight: '900', color: '#BE123C', textAlign: 'right' },
  statusSubtitle: { fontSize: 11.5, fontWeight: '600', color: '#64748B', marginTop: 3, textAlign: 'right' },

  editCtaBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E91E63',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  editCtaText: { fontSize: 14.5, fontWeight: '900', color: '#FFFFFF' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  cardHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FE',
  },
  cardSectionTitle: { fontSize: 15.5, fontWeight: '900', color: '#2D1B4D', textAlign: 'right' },
  cardSubtitle: { fontSize: 12.5, lineHeight: 18, color: '#64748B', textAlign: 'right', marginBottom: 14 },

  summaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FE',
  },
  summaryLabel: { fontSize: 12.5, fontWeight: '700', color: '#8B94B7' },
  summaryValue: { fontSize: 13, fontWeight: '800', color: '#2D1B4D', flex: 1, textAlign: 'left' },

  // Steps Bar
  stepsBar: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F4F9',
  },
  stepItem: { alignItems: 'center' },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleActive: { backgroundColor: '#FCE7F3' },
  stepCircleCurrent: { backgroundColor: '#E91E63' },
  stepNum: { fontSize: 12, fontWeight: '800', color: '#8B94B7' },
  stepNumActive: { color: '#BE123C' },
  stepTitle: { fontSize: 11, fontWeight: '700', color: '#8B94B7' },
  stepTitleCurrent: { color: '#E91E63', fontWeight: '900' },

  // Input Fields
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 12.5, fontWeight: '800', color: '#2D1B4D', marginBottom: 6, textAlign: 'right' },
  input: {
    backgroundColor: '#F8F9FE',
    borderWidth: 1.5,
    borderColor: '#E8ECF4',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13.5,
    color: '#2D1B4D',
  },
  multilineInput: { minHeight: 74, textAlignVertical: 'top' },
  rowTwo: { flexDirection: 'row-reverse' },

  pickerTrigger: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FE',
    borderWidth: 1.5,
    borderColor: '#E8ECF4',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerValueText: { fontSize: 13.5, fontWeight: '700', color: '#2D1B4D' },
  placeholderText: { color: '#94A3B8', fontWeight: '600' },

  toggleRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F8F9FE',
  },
  toggleLabel: { fontSize: 13, fontWeight: '800', color: '#2D1B4D' },
  toggleSwitch: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: { backgroundColor: '#E91E63' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF' },
  toggleThumbActive: { alignSelf: 'flex-end' },

  reviewBox: {
    backgroundColor: '#F8F9FE',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  submitFinalBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 16,
    paddingVertical: 14,
    ...SHADOWS.small,
  },
  submitFinalBtnText: { fontSize: 14.5, fontWeight: '900', color: '#FFFFFF' },

  wizardControls: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 6,
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E91E63',
    borderRadius: 16,
    paddingVertical: 13,
  },
  nextBtnText: { fontSize: 13.5, fontWeight: '900', color: '#FFFFFF' },
  prevBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingVertical: 13,
  },
  prevBtnText: { fontSize: 13.5, fontWeight: '800', color: '#64748B' },

  // Picker Modal
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  pickerCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '65%',
  },
  pickerHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerTitle: { fontSize: 16, fontWeight: '900', color: '#2D1B4D' },
  pickerOptionItem: {
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FE',
    alignItems: 'flex-end',
  },
  pickerOptionText: { fontSize: 14, fontWeight: '700', color: '#2D1B4D' },
});
