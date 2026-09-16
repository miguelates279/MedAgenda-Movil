import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';

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
    base: 'bg-primary border-0',
    pressed: 'bg-[#4682B4]',
    text: 'text-white',
  },
  secondary: {
    base: 'bg-gray-100 border border-gray-200',
    pressed: 'bg-gray-200',
    text: 'text-neutral-900',
  },
  danger: {
    base: 'bg-red-800 border-0',
    pressed: 'bg-red-900',
    text: 'text-white',
  },
  outline: {
    base: 'bg-white border border-gray-300',
    pressed: 'bg-gray-50 border-primary',
    text: 'text-primary',
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
            color={variant === 'outline' || variant === 'secondary' ? '#259487' : '#ffffff'}
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
