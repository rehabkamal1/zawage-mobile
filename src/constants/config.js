export const APP_CONFIG = {
  NAME: 'نصفي الآخر',
  SLUG: 'nosfy-alakhar',
  API_BASE_URL: 'https://mynosfi.com/api',
  VODAFONE_CASH_NUMBER: '01017961150',
  WHATSAPP_SUPPORT: '201017961150',
  FREE_VIEWS_LIMIT: 3,
  PLANS: {
    DAILY: { type: 'daily', title: 'الباقة اليومية', price: 50, durationDays: 1, views: 10 },
    WEEKLY: { type: 'weekly', title: 'الباقة الأسبوعية', price: 100, durationDays: 7, views: 30 },
    MONTHLY: { type: 'monthly', title: 'الباقة الشهرية', price: 300, durationDays: 30, views: 100 },
  },
  GOVERNORATES: [
    'الكل', 'القاهرة', 'الجيزة', 'الإسكندرية', 'الشرقية', 'الدقهلية', 'القليوبية',
    'المنوفية', 'الغربية', 'كفر الشيخ', 'البحيرة', 'دمياط', 'بورسعيد', 'الإسماعيلية',
    'السويس', 'بني سويف', 'الفيوم', 'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان'
  ],
  MARITAL_STATUSES: ['الكل', 'آنسة', 'أعزب', 'مطلق', 'مطلقة', 'أرمل', 'أرملة'],
  AGE_RANGES: ['الكل', '18-25', '26-35', '36+'],
};
