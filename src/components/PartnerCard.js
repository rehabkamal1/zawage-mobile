import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';

export default function PartnerCard({
  partner,
  onPress,
  onToggleFavorite,
  isFavorite,
  onUnlock,
  currentUser,
}) {
  const profile = partner.profile || {};

  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(profile.dob);
  const score = partner.match_percentage ?? null;

  const handleWhatsApp = (e) => {
    e?.stopPropagation?.();
    const phone = partner.phone || profile.guardian_phone;
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone;
    const partnerName = profile.nickname || partner.name;
    const msg = encodeURIComponent(`السلام عليكم، بخصوص استمارة العروس (${partnerName}) في تطبيق نصفي الآخر وأريد التواصل معك.`);
    Linking.openURL(`https://wa.me/${fullPhone}?text=${msg}`).catch(() => {});
  };

  const handleUnlockClick = (e) => {
    e?.stopPropagation?.();
    if (onUnlock) onUnlock(partner);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      style={styles.card}
      onPress={onPress}
    >
      {/* Floating Status Badge (Top Right) */}
      <View style={styles.statusBadge}>
        <Text style={styles.statusBadgeText}>
          {partner.is_unlocked ? '🔓 مفكوك القفل' : '🔒 مقفول'} • {profile.marital_status || 'غير محدد'}
        </Text>
      </View>

      {/* Floating Favorite Button (Top Left) */}
      <TouchableOpacity
        style={styles.favoriteBtn}
        onPress={(e) => {
          e.stopPropagation?.();
          onToggleFavorite(partner.id);
        }}
        activeOpacity={0.8}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={20}
          color="#E91E63"
        />
      </TouchableOpacity>

      {/* Top Banner with Soft Pink Gradient & Compatibility Score */}
      <LinearGradient
        colors={['#FFF5F7', '#FFEEF2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.imagePlaceholder}
      >
        {score !== null && score !== undefined ? (
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreNumber}>{score}%</Text>
            <Text style={styles.scoreLabel}>نسبة التوافق</Text>
          </View>
        ) : (
          <Ionicons name="heart" size={54} color="#E91E63" style={{ opacity: 0.12 }} />
        )}
      </LinearGradient>

      {/* Card Info Section */}
      <View style={styles.infoSection}>
        {/* Name and Age */}
        <Text style={styles.nameText}>
          {profile.nickname || partner.name}
          {age ? `، ${age} سنة` : ''}
        </Text>

        {/* Location & Job Meta */}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{profile.governorate || 'الموقع غير محدد'}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>{profile.job || 'الوظيفة غير محددة'}</Text>
        </View>

        {/* Tags Row */}
        <View style={styles.tagsContainer}>
          {profile.education ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{profile.education}</Text>
            </View>
          ) : null}
          {profile.skin_tone ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{profile.skin_tone}</Text>
            </View>
          ) : null}
          {profile.height ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>الطول: {profile.height} سم</Text>
            </View>
          ) : null}
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionsRow}>
          {partner.is_unlocked ? (
            <TouchableOpacity
              style={styles.btnWhatsApp}
              activeOpacity={0.88}
              onPress={handleWhatsApp}
            >
              <Ionicons name="logo-whatsapp" size={17} color="#FFFFFF" style={{ marginLeft: 6 }} />
              <Text style={styles.btnWhatsAppText}>تواصل الآن</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleUnlockClick}
              style={styles.unlockBtnWrapper}
            >
              <LinearGradient
                colors={['#E91E63', '#FF85A2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnUnlock}
              >
                <Ionicons name="lock-closed" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                <Text style={styles.btnUnlockText}>فك القفل والتواصل</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.btnDetails}
            activeOpacity={0.88}
            onPress={onPress}
          >
            <Ionicons name="information-circle-outline" size={17} color="#2D1B4D" style={{ marginLeft: 6 }} />
            <Text style={styles.btnDetailsText}>التفاصيل</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F4F9',
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.card,
  },
  statusBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(233, 30, 99, 0.1)',
    ...SHADOWS.small,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2D1B4D',
    textAlign: 'right',
  },
  favoriteBtn: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: '#FFFFFF',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...SHADOWS.small,
  },
  imagePlaceholder: {
    height: 155,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 34,
    fontWeight: '900',
    color: '#E91E63',
    lineHeight: 38,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B94B7',
    marginTop: 2,
  },
  infoSection: {
    padding: 20,
    alignItems: 'center',
  },
  nameText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#2D1B4D',
    textAlign: 'center',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8B94B7',
  },
  metaDot: {
    marginHorizontal: 8,
    color: '#CBD5E1',
    fontWeight: '900',
  },
  tagsContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 18,
  },
  tag: {
    backgroundColor: '#FDFBFF',
    borderWidth: 1,
    borderColor: '#FFE6EE',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#E91E63',
  },
  actionsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  unlockBtnWrapper: {
    flex: 1.2,
  },
  btnUnlock: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    ...SHADOWS.glow,
  },
  btnUnlockText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  btnWhatsApp: {
    flex: 1.2,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    ...SHADOWS.small,
  },
  btnWhatsAppText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  btnDetails: {
    flex: 0.9,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FE',
    borderWidth: 1.5,
    borderColor: '#E8ECF4',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  btnDetailsText: {
    color: '#2D1B4D',
    fontSize: 13.5,
    fontWeight: '800',
  },
});
