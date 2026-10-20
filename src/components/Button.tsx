import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';

import { tokens } from '../theme/tokens';

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
    text: 'text-white',
  },
  secondary: {
    base: 'bg-med-surface-muted border border-med-border-light',
    pressed: 'bg-gray-200',
    text: 'text-med-text-main',
  },
  danger: {
    base: 'bg-med-error-text border-0',
    pressed: 'bg-red-900',
    text: 'text-white',
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
  const currentVariant = variantClassNames[variant] || variantClassNames.primary;

  return (
    <Pressable
      onPress={isInteractive ? onPress : undefined}
      disabled={!isInteractive}
      className={`py-2.5 px-4 rounded-md items-center justify-center flex-row gap-2 ${currentVariant.base} ${
        disabled ? 'opacity-50' : ''
      } ${className}`}
      style={style}
    >
      {({ pressed }) =>
        loading ? (
          <ActivityIndicator
            size="small"
            color={
              variant === 'outline' || variant === 'secondary'
                ? tokens.colors.primary
                : tokens.colors.bg
            }
          />
        ) : (
          <Text
            className={`text-sm font-semibold ${currentVariant.text} ${
              pressed && isInteractive ? 'opacity-90' : ''
            }`}
            style={textStyle}
          >
            {text}
          </Text>
        )
      }
    </Pressable>
  );
};

export default Button;
