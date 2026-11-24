import React from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button, { ButtonVariant } from './Button';
import { tokens } from '../theme/tokens';
import type { AppAlertVariant } from '../utils/appAlerts';

export const dialogBackdropColor = 'rgba(0,0,0,0.5)';

export interface DialogAction {
  text: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
}

interface DialogCardProps {
  title: string;
  message: string;
  variant: AppAlertVariant;
  iconName?: keyof typeof Ionicons.glyphMap;
  actions: readonly DialogAction[];
}

const appearances = {
  primary: {
    bg: tokens.colors.primaryLight,
    border: tokens.colors.borderLight,
    color: tokens.colors.primary,
    icon: 'information-circle-outline',
  },
  success: {
    bg: tokens.colors.success.bg,
    border: tokens.colors.success.border,
    color: tokens.colors.success.text,
    icon: 'checkmark-circle-outline',
  },
  error: {
    bg: tokens.colors.error.bg,
    border: tokens.colors.error.border,
    color: tokens.colors.error.text,
    icon: 'alert-circle-outline',
  },
  warning: {
    bg: tokens.colors.warning.bg,
    border: tokens.colors.warning.border,
    color: tokens.colors.warning.text,
    icon: 'warning-outline',
  },
  danger: {
    bg: tokens.colors.error.bg,
    border: tokens.colors.error.border,
    color: tokens.colors.error.text,
    icon: 'trash-outline',
  },
} as const;

export function DialogCard({
  title,
  message,
  variant,
  iconName,
  actions,
}: DialogCardProps) {
  const { width, fontScale } = useWindowDimensions();
  const stacked = fontScale > 1.3 || width < 360 || actions.length > 2;
  const appearance = appearances[variant];
  return (
    <View
      className="bg-white rounded-2xl w-full max-w-sm shadow-xl border border-gray-100"
      style={{ maxHeight: '100%', flexShrink: 1 }}
      accessibilityViewIsModal
    >
      <ScrollView
        style={{ flexGrow: 0 }}
        contentContainerStyle={{
          padding: tokens.spacing.lg,
          alignItems: 'center',
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          className="w-14 h-14 rounded-full border items-center justify-center mb-4"
          style={{
            backgroundColor: appearance.bg,
            borderColor: appearance.border,
          }}
        >
          <Ionicons
            name={iconName ?? appearance.icon}
            size={28}
            color={appearance.color}
          />
        </View>
        <Text
          className="text-lg font-bold text-neutral-900 text-center mb-2"
          accessibilityRole="header"
        >
          {title}
        </Text>
        {!!message && (
          <Text className="text-sm text-gray-600 text-center mb-6 leading-5 px-1">
            {message}
          </Text>
        )}
        <View
          className="gap-3 w-full"
          style={{ flexDirection: stacked ? 'column' : 'row' }}
        >
          {actions.map((action, index) => (
            <Button
              key={index}
              text={action.text}
              onPress={action.onPress}
              variant={action.variant ?? 'primary'}
              disabled={action.disabled}
              loading={action.loading}
              style={stacked ? undefined : { flex: 1 }}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
