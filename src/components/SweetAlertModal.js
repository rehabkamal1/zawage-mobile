import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const ICONS = {
  success: {
    name: 'checkmark-circle',
    color: '#10B981',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  error: {
    name: 'close-circle',
    color: '#EF4444',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  warning: {
    name: 'warning',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  info: {
    name: 'information-circle',
    color: '#6366F1',
    bgColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  question: {
    name: 'help-circle',
    color: '#0284C7',
    bgColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
};

export default function SweetAlertModal({
  visible,
  type = 'info', // 'success' | 'error' | 'warning' | 'info' | 'question'
  title = '',
  message = '',
  confirmText = 'حسناً',
  cancelText = 'إلغاء',
  showCancelButton = false,
  confirmButtonColor,
  onConfirm,
  onCancel,
}) {
  if (!visible) return null;

  const currentIcon = ICONS[type] || ICONS.info;
  const resolvedConfirmColor =
    confirmButtonColor ||
    (type === 'error' ? '#EF4444' : type === 'success' ? '#10B981' : '#E91E63');

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialogCard}>
          {/* Animated/Colored Icon Circle */}
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: currentIcon.bgColor,
                borderColor: currentIcon.borderColor,
              },
            ]}
          >
            <Ionicons name={currentIcon.name} size={48} color={currentIcon.color} />
          </View>

          {/* Title */}
          {Boolean(title) && <Text style={styles.title}>{title}</Text>}

          {/* Message */}
          {Boolean(message) && <Text style={styles.message}>{message}</Text>}

          {/* Buttons Row */}
          <View style={[styles.buttonsContainer, showCancelButton && styles.twoButtonsRow]}>
            {showCancelButton && (
              <TouchableOpacity
                style={styles.cancelButton}
                activeOpacity={0.8}
                onPress={onCancel}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.confirmButton,
                showCancelButton && styles.confirmButtonHalf,
                { backgroundColor: resolvedConfirmColor },
              ]}
              activeOpacity={0.85}
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
    width: Math.min(width - 48, 380),
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 13.5,
    lineHeight: 22,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 22,
    paddingHorizontal: 6,
  },
  buttonsContainer: {
    width: '100%',
    flexDirection: 'row-reverse',
    gap: 10,
  },
  twoButtonsRow: {
    justifyContent: 'space-between',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  confirmButtonHalf: {
    flex: 1,
  },
  confirmButtonText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
  },
});
