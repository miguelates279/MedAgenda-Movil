import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';

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
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-5">
        <Pressable
          className="absolute inset-0"
          onPress={loading ? undefined : onClose}
        />

        <View className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl border border-gray-100 items-center z-10">
          {/* Icono de Cabecera */}
          <View
            className={`w-14 h-14 rounded-full border items-center justify-center mb-4 ${currentVariant.iconBg} ${currentVariant.iconBorder}`}
          >
            <Ionicons
              name={resolvedIcon}
              size={28}
              color={currentVariant.iconColor}
            />
          </View>

          {/* Título */}
          <Text className="text-lg font-bold text-neutral-900 text-center mb-2">
            {title}
          </Text>

          {/* Mensaje descriptivo */}
          <Text className="text-sm text-gray-600 text-center mb-6 leading-5 px-1">
            {message}
          </Text>

          {/* Botones de Acción */}
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
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmModal;
