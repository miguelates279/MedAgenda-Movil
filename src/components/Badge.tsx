import React from 'react';
import { StyleProp, Text, ViewStyle } from 'react-native';
import { ClaySurface } from './ClaySurface';

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
  textClassName?: string;
  style?: StyleProp<ViewStyle>;
}

const variantClassNames: Record<
  BadgeVariant,
  { container: string; text: string }
> = {
  primary: {
    container: 'bg-med-primary-light border-med-border-light',
    text: 'text-med-primary',
  },
  success: {
    container: 'bg-med-success-badge-bg border-med-success-border',
    text: 'text-med-success-badge-text',
  },
  error: {
    container: 'bg-med-error-badge-bg border-med-error-border',
    text: 'text-med-error-badge-text',
  },
  warning: {
    container: 'bg-med-warning-badge-bg border-med-warning-border',
    text: 'text-med-warning-badge-text',
  },
  info: {
    container: 'bg-med-info-badge-bg border-med-info-border',
    text: 'text-med-info-badge-text',
  },
  neutral: {
    container: 'bg-med-surface-muted border-med-border-light',
    text: 'text-med-text-muted',
  },
};

export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'primary',
  className = '',
  textClassName = '',
  style,
}) => {
  const currentVariant = variantClassNames[variant] || variantClassNames.primary;

  return (
    <ClaySurface
      depth="badge"
      className={`max-w-full shrink px-2 py-0.5 rounded-badge border self-start flex-row items-center ${currentVariant.container} ${className}`}
      style={style}
    >
      <Text className={`${textClassName || 'text-xs'} shrink font-semibold ${currentVariant.text}`}>{text}</Text>
    </ClaySurface>
  );
};

export default Badge;
