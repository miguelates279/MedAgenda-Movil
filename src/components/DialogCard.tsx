import React from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button, { ButtonVariant } from './Button';
import { tokens } from '../theme/tokens';
import type { AppAlertVariant } from '../utils/appAlerts';
import { ClaySurface } from './ClaySurface';

export const dialogBackdropColor = tokens.colors.overlay;

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
    className: 'bg-med-primary-light border-med-border-light',
    color: tokens.colors.primary,
    icon: 'information-circle-outline',
  },
  success: {
    className: 'bg-med-success-bg border-med-success-border',
    color: tokens.colors.success.text,
    icon: 'checkmark-circle-outline',
  },
  error: {
    className: 'bg-med-error-bg border-med-error-border',
    color: tokens.colors.error.text,
    icon: 'alert-circle-outline',
  },
  warning: {
    className: 'bg-med-warning-bg border-med-warning-border',
    color: tokens.colors.warning.text,
    icon: 'warning-outline',
  },
  danger: {
    className: 'bg-med-error-bg border-med-error-border',
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
  const stacked =
    fontScale > tokens.layout.dialogFontScale ||
    width < tokens.layout.dialogBreakpoint ||
    actions.length > 2;
  const appearance = appearances[variant];
  return (
    <ClaySurface
      depth="dialog"
      className="bg-med-bg rounded-dialog w-full max-w-dialog max-h-full shrink border border-med-border-light"
      accessibilityViewIsModal
    >
      <ScrollView
        className="grow-0"
        contentContainerClassName="p-6 items-center"
        keyboardShouldPersistTaps="handled"
      >
        <ClaySurface
          depth="badge"
          className={`w-14 h-14 rounded-full border items-center justify-center mb-4 ${appearance.className}`}
        >
          <Ionicons
            name={iconName ?? appearance.icon}
            size={tokens.iconSize[28]}
            color={appearance.color}
          />
        </ClaySurface>
        <Text
          className="text-lg font-bold text-med-text-main text-center mb-2"
          accessibilityRole="header"
        >
          {title}
        </Text>
        {!!message && (
          <Text className="text-sm text-med-text-muted text-center mb-6 leading-5 px-1">
            {message}
          </Text>
        )}
        <View
          className={`gap-3 w-full ${stacked ? 'flex-col' : 'flex-row'}`}
        >
          {actions.map((action, index) => (
            <Button
              key={index}
              text={action.text}
              onPress={action.onPress}
              variant={action.variant ?? 'primary'}
              disabled={action.disabled}
              loading={action.loading}
              className={stacked ? undefined : 'flex-1'}
            />
          ))}
        </View>
      </ScrollView>
    </ClaySurface>
  );
}
