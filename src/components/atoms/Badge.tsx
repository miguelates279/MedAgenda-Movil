import React from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';

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
  className?: string;
  style?: StyleProp<ViewStyle>;
}

const variantClassNames: Record<
  BadgeVariant,
  { container: string; text: string }
> = {
  primary: {
    container: 'bg-[#e6f4f2] border-[#b2dfdb]',
    text: 'text-primary',
  },
  success: {
    container: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-800',
  },
  error: {
    container: 'bg-red-50 border-red-200',
    text: 'text-red-800',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200',
    text: 'text-amber-800',
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    text: 'text-blue-800',
  },
  neutral: {
    container: 'bg-gray-100 border-gray-200',
    text: 'text-gray-600',
  },
};

export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'primary',
  className = '',
  style,
}) => {
  const currentVariant = variantClassNames[variant] || variantClassNames.primary;

  return (
    <View
      className={`px-2 py-0.5 rounded-full border self-start flex-row items-center ${currentVariant.container} ${className}`}
      style={style}
    >
      <Text className={`text-[11px] font-semibold ${currentVariant.text}`}>{text}</Text>
    </View>
  );
};

export default Badge;
