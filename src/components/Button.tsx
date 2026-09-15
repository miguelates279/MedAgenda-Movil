import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
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
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  text,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  style,
  textStyle,
}) => {
  const isInteractive = !disabled && !loading;

  return (
    <Pressable
      onPress={isInteractive ? onPress : undefined}
      disabled={!isInteractive}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant].base,
        pressed && isInteractive ? variantStyles[variant].pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'secondary' ? '#259487' : '#ffffff'}
        />
      ) : (
        <Text
          style={[
            styles.text,
            variantStyles[variant].text,
            textStyle,
          ]}
        >
          {text}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});

const variantStyles: Record<
  ButtonVariant,
  { base: ViewStyle; pressed: ViewStyle; text: TextStyle }
> = {
  primary: {
    base: {
      backgroundColor: '#259487',
      borderWidth: 0,
    },
    pressed: {
      backgroundColor: '#4682B4',
    },
    text: {
      color: '#ffffff',
    },
  },
  secondary: {
    base: {
      backgroundColor: '#f3f4f6',
      borderWidth: 1,
      borderColor: '#e5e7eb',
    },
    pressed: {
      backgroundColor: '#e5e7eb',
    },
    text: {
      color: '#171717',
    },
  },
  danger: {
    base: {
      backgroundColor: '#991b1b',
      borderWidth: 0,
    },
    pressed: {
      backgroundColor: '#7f1d1d',
    },
    text: {
      color: '#ffffff',
    },
  },
  outline: {
    base: {
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#d1d5db',
    },
    pressed: {
      backgroundColor: '#f9fafb',
      borderColor: '#259487',
    },
    text: {
      color: '#259487',
    },
  },
};

export default Button;