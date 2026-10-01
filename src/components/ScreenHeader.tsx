import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  canGoBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
}

/**
 * Encabezado estándar para pantallas secundarias o de detalle (Stack Navigation).
 * Disposición:
 * - Botón de regreso a la izquierda del todo.
 * - Título de la página en la mitad (centrado).
 * - Acción derecha alineada al extremo opuesto.
 */
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
    <View
      className={`bg-white border-b border-gray-200 px-4 py-3 flex-row items-center justify-between shadow-sm ${className}`}
    >
      {/* Extremo Izquierdo: Botón de regreso a la izquierda del todo */}
      <View className="w-20 items-start justify-center">
        {canGoBack ? (
          <Pressable
            onPress={handleBack}
            className="flex-row items-center py-1 -ml-1 active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel="Volver a la pantalla anterior"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={20} color="#259487" />
            <Text className="text-primary text-sm font-semibold ml-0.5">
              Volver
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Centro: Título de página en la mitad */}
      <View className="flex-1 items-center justify-center px-1">
        <Text
          className="text-base font-bold text-neutral-900 text-center"
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            className="text-xs text-gray-500 text-center mt-0.5"
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Extremo Derecho: Acción secundaria o espacio para balance simétrico */}
      <View className="w-20 items-end justify-center">
        {rightAction ? rightAction : null}
      </View>
    </View>
  );
};

export default ScreenHeader;
