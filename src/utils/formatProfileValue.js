const GOVERNORATE_MAP = {
  cairo: 'القاهرة',
  giza: 'الجيزة',
  alexandria: 'الإسكندرية',
  alex: 'الإسكندرية',
  dakahlia: 'الدقهلية',
  mansoura: 'المنصورة (الدقهلية)',
  sharqia: 'الشرقية',
  zagazig: 'الزقازيق (الشرقية)',
  gharbia: 'الغربية',
  tanta: 'طنطا (الغربية)',
  monufia: 'المنوفية',
  menofia: 'المنوفية',
  qalyubia: 'القليوبية',
  banha: 'بنها (القليوبية)',
  beheira: 'البحيرة',
  damanhur: 'دمنهور (البحيرة)',
  'kafr el sheikh': 'كفر الشيخ',
  'kafr el-sheikh': 'كفر الشيخ',
  kafreldheikh: 'كفر الشيخ',
  damietta: 'دمياط',
  'port said': 'بورسعيد',
  ismailia: 'الإسماعيلية',
  suez: 'السويس',
  fayoum: 'الفيوم',
  faiyum: 'الفيوم',
  'beni suef': 'بني سويف',
  'beni-suef': 'بني سويف',
  minya: 'المنيا',
  alminya: 'المنيا',
  elminya: 'المنيا',
  assiut: 'أسيوط',
  asyut: 'أسيوط',
  sohag: 'سوهاج',
  qena: 'قنا',
  luxor: 'الأقصر',
  aswan: 'أسوان',
  'red sea': 'البحر الأحمر',
  hurghada: 'الغردقة',
  'new valley': 'الوادي الجديد',
  matrouh: 'مطروح',
  'marsa matrouh': 'مرسى مطروح',
  'north sinai': 'شمال سيناء',
  'south sinai': 'جنوب سيناء',
  'sharm el sheikh': 'شرم الشيخ',
};

const ARABIC_DICTIONARY = {
  // الصلاة
  always: 'أحافظ عليها دائماً',
  mostly: 'أغلب الأوقات',
  sometimes: 'أحياناً / متقطع',
  rarely: 'نادراً',
  never: 'لا أصلي',
  any: 'لا يهم / غير محدد',

  // التدخين
  no: 'غير مدخن',
  yes: 'مدخن',
  socially: 'في المناسبات فقط',
  false: 'لا',
  true: 'نعم',
  '0': 'لا',
  '1': 'نعم',

  // الحالة الاجتماعية
  single: 'أعزب / عزباء',
  divorced: 'مطلق / مطلقة',
  widowed: 'أرمل / أرملة',
  married: 'متزوج',

  // الحجاب
  niqab: 'نقاب شرعي',
  khimar: 'خمار / إسدال',
  hijab: 'حجاب شرعي',
  none: 'بدون حجاب',

  // لون البشرة
  white: 'أبيض فاتح',
  fair: 'قمحي فاتح',
  wheat: 'قمحي',
  wheatish: 'قمحي',
  tan: 'خمري',
  brown: 'أسمر',
  dark: 'أسمر داكن',

  // البنية والجسد
  slim: 'نحيف',
  average: 'متوسط',
  medium: 'متوسط',
  athletic: 'رياضي / رشيق',
  curvy: 'ممتلئ قليلاً',
  heavy: 'ممتلئ',

  // السكن
  private: 'سكن خاص مستقل',
  family: 'بيت عائلة',
  rent: 'إيجار',
  own: 'تمليك',
  independent: 'شقة مستقلة',

  // المستوى المادي
  low: 'متوسط / مقبول',
  medium: 'متوسط',
  good: 'جيد',
  high: 'ممتاز / مرتفع',
  unspecified: 'غير محدد',

  // القائمة
  agreement: 'حسب الاتفاق الشرعي',
  according_to_agreement: 'حسب الاتفاق الشرعي',
  with_qaima: 'بوجود قائمة منقولات',
  without_qaima: 'بدون قائمة منقولات',

  // الوظيفة والعمل
  unemployed: 'لا أعمل حالياً',
  student: 'طالب / طالبة',
  employee: 'موظف / موظفة',
  business_owner: 'أعمال حرة / صاحب عمل',
  freelancer: 'عمل حر / مستقل',
  teacher: 'معلم / تدريس',
  doctor: 'طبيب / صيدلي',
  engineer: 'مهندس',
  none: 'لا أعمل حالياً',

  // المؤهل الدراسي
  high_school: 'ثانوية عامة / دبلوم',
  bachelor: 'مؤهل عالي (جامعي)',
  higher: 'مؤهل عالي',
  university: 'مؤهل جامعي',
  diploma: 'دبلوم متوسط',
  master: 'ماجستير',
  phd: 'دكتوراه',
};

/**
 * Format any profile value to clean, readable Arabic.
 */
export function formatProfileValue(val, fallback = '—', gender = null) {
  if (val === null || val === undefined || val === '') return fallback;
  if (typeof val === 'boolean') return val ? 'نعم' : 'لا';

  const rawStr = String(val).trim();
  const lowerStr = rawStr.toLowerCase();

  // Gender specific overrides
  if (gender === 'female' || gender === 'bride') {
    if (lowerStr === 'single') return 'عزباء';
    if (lowerStr === 'divorced') return 'مطلقة';
    if (lowerStr === 'widowed') return 'أرملة';
    if (lowerStr === 'no' || lowerStr === '0' || lowerStr === 'false') return 'لا (غير مدخنة)';
    if (lowerStr === 'yes' || lowerStr === '1' || lowerStr === 'true') return 'نعم (مدخنة)';
  } else if (gender === 'male' || gender === 'groom') {
    if (lowerStr === 'single') return 'أعزب';
    if (lowerStr === 'divorced') return 'مطلق';
    if (lowerStr === 'widowed') return 'أرمل';
    if (lowerStr === 'no' || lowerStr === '0' || lowerStr === 'false') return 'غير مدخن';
    if (lowerStr === 'yes' || lowerStr === '1' || lowerStr === 'true') return 'مدخن';
  }

  // Check dictionary
  if (ARABIC_DICTIONARY[lowerStr]) {
    return ARABIC_DICTIONARY[lowerStr];
  }

  // Check governorates
  if (GOVERNORATE_MAP[lowerStr]) {
    return GOVERNORATE_MAP[lowerStr];
  }

  return rawStr;
}

/**
 * Format governorate and area to clean Arabic string.
 */
export function formatLocation(governorate, area) {
  const gov = governorate ? formatProfileValue(governorate, '') : '';
  const ar = area ? formatProfileValue(area, '') : '';

  if (gov && ar) {
    if (gov.toLowerCase() === ar.toLowerCase()) return gov;
    return `${gov} - ${ar}`;
  }
  return gov || ar || 'غير محدد';
}
