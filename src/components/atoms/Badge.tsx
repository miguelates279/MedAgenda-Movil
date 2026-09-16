import React from 'react';
import { StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';

export type BadgeVariant =
  | 'primary'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'neutral';

export interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'primary',
  style,
}) => {
  const currentVariant = variantStyles[variant];

  return (
    <View style={[styles.badge, currentVariant.container, style]}>
      <Text style={[styles.text, currentVariant.text]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 1,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});

const variantStyles: Record<
  BadgeVariant,
  { container: ViewStyle; text: TextStyle }
> = {
  primary: {
    container: {
      backgroundColor: '#e6f4f2',
      borderColor: '#b2dfdb',
    },
    text: {
      color: '#259487',
    },
  },
  success: {
    container: {
      backgroundColor: '#ecfdf5',
      borderColor: '#a7f3d0',
    },
    text: {
      color: '#065f46',
    },
  },
  error: {
    container: {
      backgroundColor: '#fef2f2',
      borderColor: '#fecaca',
    },
    text: {
      color: '#991b1b',
    },
  },
  warning: {
    container: {
      backgroundColor: '#fffbeb',
      borderColor: '#fde68a',
    },
    text: {
      color: '#92400e',
    },
  },
  info: {
    container: {
      backgroundColor: '#eff6ff',
      borderColor: '#bfdbfe',
    },
    text: {
      color: '#1e40af',
    },
  },
  neutral: {
    container: {
      backgroundColor: '#f3f4f6',
      borderColor: '#e5e7eb',
    },
    text: {
      color: '#4b5563',
    },
  },
};

export default Badge;
