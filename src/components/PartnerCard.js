import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';

export default function PartnerCard({ partner, onPress, onToggleFavorite, isFavorite }) {
  const profile = partner.profile || {};
  const isFemale = partner.gender === 'female';

  const calculateAge = (dob) => {
    if (!dob) return null;
    const diff = Date.now() - new Date(dob).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const age = calculateAge(profile.dob);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={styles.card}
      onPress={onPress}
    >
      {/* Card Header: Avatar + Name + Favorite Button */}
      <View style={styles.cardHeader}>
        <TouchableOpacity
          style={styles.favoriteBtn}
          onPress={onToggleFavorite}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={isFavorite ? COLORS.primary : COLORS.textLight}
          />
        </TouchableOpacity>

        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.nickname || partner.name}</Text>
            <View style={[styles.genderBadge, isFemale ? styles.femaleBadge : styles.maleBadge]}>
              <Text style={styles.genderBadgeText}>
                {isFemale ? 'عروسة' : 'عريس'}
              </Text>
            </View>
          </View>
          <Text style={styles.location}>
            <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />{' '}
            {profile.governorate || 'مصر'} {profile.area ? `، ${profile.area}` : ''}
          </Text>
        </View>

        <View style={[styles.avatar, isFemale ? styles.femaleAvatar : styles.maleAvatar]}>
          <Ionicons
            name={isFemale ? 'woman' : 'man'}
            size={26}
            color="#FFFFFF"
          />
        </View>
      </View>

      {/* Quick Specs Chips */}
      <View style={styles.tagsContainer}>
        {age && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{age} سنة</Text>
          </View>
        )}
        {profile.marital_status && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{profile.marital_status}</Text>
          </View>
        )}
        {profile.job && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{profile.job}</Text>
          </View>
        )}
        {profile.education && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{profile.education}</Text>
          </View>
        )}
      </View>

      {/* Bio / Summary Quote */}
      {profile.bio ? (
        <Text style={styles.bio} numberOfLines={2}>
          "{profile.bio}"
        </Text>
      ) : null}

      {/* Card Footer Button */}
      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.detailBtn} onPress={onPress}>
          <Ionicons name="eye-outline" size={16} color={COLORS.primary} />
          <Text style={styles.detailBtnText}>عرض المواصفات وطلب التواصل</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  maleAvatar: {
    backgroundColor: COLORS.male,
  },
  femaleAvatar: {
    backgroundColor: COLORS.female,
  },
  userInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  nameRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  genderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  maleBadge: {
    backgroundColor: '#E0F2FE',
  },
  femaleBadge: {
    backgroundColor: '#FCE4EC',
  },
  genderBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },
  location: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  favoriteBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagsContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 12,
  },
  tag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
  },
  bio: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    textAlign: 'right',
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 10,
  },
  detailBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
  },
  detailBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
});
