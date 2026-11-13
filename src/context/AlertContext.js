import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import SweetAlertModal from '../components/SweetAlertModal';

const AlertContext = createContext({
  showAlert: () => {},
  showConfirm: () => {},
  showSuccess: () => {},
  showError: () => {},
  showWarning: () => {},
  closeAlert: () => {},
});

// Singleton ref for calls outside React components
let globalAlertHandler = null;

export function AlertProvider({ children }) {
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'حسناً',
    cancelText: 'إلغاء',
    showCancelButton: false,
    confirmButtonColor: undefined,
    onConfirm: () => {},
    onCancel: () => {},
  });

  const closeAlert = useCallback(() => {
    setModalConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  const showAlert = useCallback(
    ({
      type = 'info',
      title = '',
      message = '',
      confirmText = 'حسناً',
      confirmButtonColor,
      onConfirm,
    }) => {
      setModalConfig({
        visible: true,
        type,
        title,
        message,
        confirmText,
        showCancelButton: false,
        confirmButtonColor,
        onConfirm: () => {
          closeAlert();
          if (onConfirm) onConfirm();
        },
        onCancel: closeAlert,
      });
    },
    [closeAlert]
  );

  const showConfirm = useCallback(
    ({
      type = 'warning',
      title = '',
      message = '',
      confirmText = 'تأكيد',
      cancelText = 'إلغاء',
      confirmButtonColor,
      onConfirm,
      onCancel,
    }) => {
      setModalConfig({
        visible: true,
        type,
        title,
        message,
        confirmText,
        cancelText,
        showCancelButton: true,
        confirmButtonColor,
        onConfirm: () => {
          closeAlert();
          if (onConfirm) onConfirm();
        },
        onCancel: () => {
          closeAlert();
          if (onCancel) onCancel();
        },
      });
    },
    [closeAlert]
  );

  const showSuccess = useCallback(
    (title, message, onConfirm) => {
      showAlert({ type: 'success', title, message, onConfirm });
    },
    [showAlert]
  );

  const showError = useCallback(
    (title, message, onConfirm) => {
      showAlert({ type: 'error', title, message, onConfirm });
    },
    [showAlert]
  );

  const showWarning = useCallback(
    (title, message, onConfirm) => {
      showAlert({ type: 'warning', title, message, onConfirm });
    },
    [showAlert]
  );

  // Register global handler
  globalAlertHandler = {
    showAlert,
    showConfirm,
    showSuccess,
    showError,
    showWarning,
    closeAlert,
  };

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        showConfirm,
        showSuccess,
        showError,
        showWarning,
        closeAlert,
      }}
    >
      {children}
      <SweetAlertModal {...modalConfig} />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

export const GlobalAlert = {
  alert: (title, message, onConfirm) => {
    if (globalAlertHandler) {
      globalAlertHandler.showAlert({ title, message, onConfirm });
    }
  },
  success: (title, message, onConfirm) => {
    if (globalAlertHandler) {
      globalAlertHandler.showSuccess(title, message, onConfirm);
    }
  },
  error: (title, message, onConfirm) => {
    if (globalAlertHandler) {
      globalAlertHandler.showError(title, message, onConfirm);
    }
  },
  warning: (title, message, onConfirm) => {
    if (globalAlertHandler) {
      globalAlertHandler.showWarning(title, message, onConfirm);
    }
  },
  confirm: (title, message, onConfirm, onCancel, options = {}) => {
    if (globalAlertHandler) {
      globalAlertHandler.showConfirm({
        title,
        message,
        onConfirm,
        onCancel,
        ...options,
      });
    }
  },
};
