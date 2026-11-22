import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function NotificationsScreen({ navigation }) {
  // Parity with React/src/pages/user/Messages.jsx
  const [notifications] = useState([
    {
      id: 1,
      text: 'لقد أعجب شخص ما بملفك الشخصي!',
      time: 'منذ ساعتين',
      type: 'like',
    },
    {
      id: 2,
      text: 'تمت مراجعة استمارتك بنجاح وهي الآن مفعلة.',
      time: 'منذ يوم',
      type: 'system',
    },
    {
      id: 3,
      text: 'لديك ترشيح وتوافق جديد يتطابق مع مواصفات شريك حياتك.',
      time: 'منذ يومين',
      type: 'match',
    },
  ]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-forward" size={22} color="#2D1B4D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>التنبيهات والرسائل</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.cardHeader}>
          <Text style={styles.sectionTitle}>آخر التنبيهات</Text>
          <Text style={styles.countBadge}>{notifications.length} جديدة</Text>
        </View>

        {notifications.map((note) => {
          const isLike = note.type === 'like';
          const isMatch = note.type === 'match';

          return (
            <View
              key={note.id}
              style={[
                styles.notificationItem,
                isLike ? styles.likeBackground : styles.normalBackground,
              ]}
            >
              <View
                style={[
                  styles.iconBox,
                  isLike
                    ? styles.likeIconBox
                    : isMatch
                    ? styles.matchIconBox
                    : styles.systemIconBox,
                ]}
              >
                <Ionicons
                  name={
                    isLike
                      ? 'heart'
                      : isMatch
                      ? 'sparkles'
                      : 'notifications'
                  }
                  size={22}
                  color={
                    isLike
                      ? '#E91E63'
                      : isMatch
                      ? '#8B5CF6'
                      : '#0284C7'
                  }
                />
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.noteText}>{note.text}</Text>
                <View style={styles.timeRow}>
                  <Ionicons name="time-outline" size={13} color="#8B94B7" />
                  <Text style={styles.timeText}>{note.time}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFD',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#F1F4F9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#2D1B4D',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2D1B4D',
  },
  countBadge: {
    backgroundColor: '#FFE4E6',
    color: '#E11D48',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  notificationItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F4F9',
    ...SHADOWS.small,
  },
  likeBackground: {
    backgroundColor: '#FFF9FB',
    borderColor: '#FFE4E6',
  },
  normalBackground: {
    backgroundColor: '#FFFFFF',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
  },
  likeIconBox: {
    backgroundColor: '#FFF0F5',
  },
  matchIconBox: {
    backgroundColor: '#F5F3FF',
  },
  systemIconBox: {
    backgroundColor: '#F0F9FF',
  },
  textContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  noteText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2D1B4D',
    textAlign: 'right',
    lineHeight: 20,
    marginBottom: 6,
  },
  timeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#8B94B7',
    fontWeight: '600',
    marginRight: 4,
  },
});
