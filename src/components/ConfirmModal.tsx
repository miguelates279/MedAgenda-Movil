import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
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

const variantStyles: Record<
  ConfirmModalVariant,
  {
    iconBg: string;
    iconBorder: string;
    iconColor: string;
    defaultIcon: keyof typeof Ionicons.glyphMap;
    buttonVariant: 'danger' | 'primary' | 'secondary';
  }
> = {
  danger: {
    iconBg: 'bg-red-50',
    iconBorder: 'border-red-100',
    iconColor: '#991b1b',
    defaultIcon: 'log-out-outline',
    buttonVariant: 'danger',
  },
  primary: {
    iconBg: 'bg-teal-50',
    iconBorder: 'border-teal-100',
    iconColor: '#259487',
    defaultIcon: 'information-circle-outline',
    buttonVariant: 'primary',
  },
  warning: {
    iconBg: 'bg-amber-50',
    iconBorder: 'border-amber-100',
    iconColor: '#b45309',
    defaultIcon: 'warning-outline',
    buttonVariant: 'primary',
  },
};

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
}) => {
  const currentVariant = variantStyles[variant] || variantStyles.danger;
  const resolvedIcon = iconName || currentVariant.defaultIcon;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!loading) onClose();
      }}
    >
      <ModalViewport style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View
          className="flex-1 justify-center items-center px-5 py-4"
          style={{ minHeight: 0 }}
        >
          <Pressable
            className="absolute inset-0"
            onPress={loading ? undefined : onClose}
          />

          <View
            className="bg-white rounded-2xl w-full max-w-sm shadow-xl border border-gray-100 z-10"
            style={{ maxHeight: '100%', flexShrink: 1 }}
            accessibilityViewIsModal
          >
            <ScrollView
              style={{ flexGrow: 0 }}
              contentContainerStyle={{ padding: 24, alignItems: 'center' }}
              keyboardShouldPersistTaps="handled"
            >
              <View
                className={`w-14 h-14 rounded-full border items-center justify-center mb-4 ${currentVariant.iconBg} ${currentVariant.iconBorder}`}
              >
                <Ionicons
                  name={resolvedIcon}
                  size={28}
                  color={currentVariant.iconColor}
                />
              </View>

              <Text
                className="text-lg font-bold text-neutral-900 text-center mb-2"
                accessibilityRole="header"
              >
                {title}
              </Text>

              <Text className="text-sm text-gray-600 text-center mb-6 leading-5 px-1">
                {message}
              </Text>

              <View className="flex-row gap-3 w-full">
                <Pressable
                  onPress={onClose}
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-md items-center justify-center bg-gray-100 border border-gray-200 active:bg-gray-200"
                  accessibilityRole="button"
                  accessibilityLabel={cancelText}
                >
                  <Text className="text-sm font-semibold text-neutral-900">
                    {cancelText}
                  </Text>
                </Pressable>

                <View className="flex-1">
                  <Button
                    text={confirmText}
                    onPress={onConfirm}
                    variant={currentVariant.buttonVariant}
                    loading={loading}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </ModalViewport>
    </Modal>
  );
};

export default ConfirmModal;
