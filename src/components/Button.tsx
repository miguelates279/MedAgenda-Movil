import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';

import { tokens } from '../theme/tokens';
import { ClayPressable } from './ClaySurface';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline';

export interface ButtonProps {
  text: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  className?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const variantClassNames: Record<
  ButtonVariant,
  { base: string; pressed: string; text: string }
> = {
  primary: {
    base: 'bg-med-primary border-0',
    pressed: 'bg-med-secondary',
    text: 'text-med-on-primary',
  },
  secondary: {
    base: 'bg-med-surface-muted border border-med-border-light',
    pressed: 'bg-med-border-light',
    text: 'text-med-text-main',
  },
  danger: {
    base: 'bg-med-error-text border-0',
    pressed: 'bg-med-error-pressed',
    text: 'text-med-on-primary',
  },
  outline: {
    base: 'bg-med-bg border border-med-border',
    pressed: 'bg-med-surface border-med-primary',
    text: 'text-med-primary',
  },
};

export const Button: React.FC<ButtonProps> = ({
  text,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  className = '',
  style,
  textStyle,
}) => {
  const isInteractive = !disabled && !loading;
  const currentVariant =
    variantClassNames[variant] || variantClassNames.primary;

  return (
    <ClayPressable
      onPress={isInteractive ? onPress : undefined}
      disabled={!isInteractive}
      className={`min-h-touch min-w-0 max-w-full py-2.5 px-4 rounded-control items-center justify-center flex-row gap-2 ${currentVariant.base} ${
        disabled ? 'opacity-50' : ''
      } ${className}`}
      style={style}
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
    >
      {({ pressed }) =>
        loading ? (
          <ActivityIndicator
            size={tokens.indicator.sm}
            color={
              variant === 'outline' || variant === 'secondary'
                ? tokens.colors.primary
                : tokens.colors.bg
            }
          />
        ) : (
          <Text
            className={`text-sm font-semibold shrink text-center ${currentVariant.text} ${
              pressed && isInteractive ? 'opacity-90' : ''
            }`}
            style={textStyle}
          >
            {text}
          </Text>
        )
      }
    </ClayPressable>
  );
};

export default Button;
