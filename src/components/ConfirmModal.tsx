import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppModal } from './AppModal';
import { DialogCard, dialogBackdropColor } from './DialogCard';
import { ModalViewport } from './ModalViewport';

export type ConfirmModalVariant = 'danger' | 'primary' | 'warning';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmModalVariant;
  iconName?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  iconName,
  loading = false,
  onClose,
  onConfirm,
}) => (
  <AppModal
    visible={isOpen}
    transparent
    animationType="fade"
    onRequestClose={() => {
      if (!loading) onClose();
    }}
  >
    <ModalViewport style={{ backgroundColor: dialogBackdropColor }}>
      <View
        className="flex-1 min-h-0 justify-center items-center px-5 py-4"
      >
        <Pressable
          className="absolute inset-0"
          onPress={loading ? undefined : onClose}
          accessible={false}
        />
        <DialogCard
          title={title}
          message={message}
          variant={variant}
          iconName={iconName}
          actions={[
            {
              text: cancelText,
              onPress: onClose,
              variant: 'secondary',
              disabled: loading,
            },
            {
              text: confirmText,
              onPress: onConfirm,
              variant: variant === 'danger' ? 'danger' : 'primary',
              loading,
            },
          ]}
        />
      </View>
    </ModalViewport>
  </AppModal>
);

export default ConfirmModal;
