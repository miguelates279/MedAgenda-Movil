import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';
import { ClayPressable, ClaySurface } from './ClaySurface';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  canGoBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  canGoBack = true,
  onBack,
  rightAction,
  className = '',
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <ClaySurface
      className={`bg-med-bg rounded-none border-b border-med-border-light px-4 py-3 flex-row items-center justify-between ${className}`}
    >
      <View className="shrink-0 items-start justify-center">
        {canGoBack ? (
          <ClayPressable
            onPress={handleBack}
            className="min-h-touch flex-row items-center px-2 py-1 -ml-1 rounded-control bg-med-bg active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel="Volver a la pantalla anterior"
            hitSlop={tokens.spacing.xs}
          >
            <Ionicons name="chevron-back" size={tokens.iconSize[20]} color={tokens.colors.primary} />
            <Text className="text-med-primary text-sm font-semibold ml-0.5">
              Volver
            </Text>
          </ClayPressable>
        ) : null}
      </View>

      <View className="flex-1 min-w-0 items-center justify-center px-2">
        <Text className="text-base font-bold text-med-text-main text-center">
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-xs text-med-text-soft text-center mt-0.5">
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View className="shrink-0 items-end justify-center">
        {rightAction ? rightAction : null}
      </View>
    </ClaySurface>
  );
};

export default ScreenHeader;
