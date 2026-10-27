import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppMode } from '../../../context/AuthContext';
import { Badge } from '../../../components';

export interface ModeSelectorProps {
  activeMode: AppMode | null;
  availableModes: AppMode[];
  onSelectMode: (mode: AppMode) => void;
}

const MODE_CONFIG: Record<
  AppMode,
  {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    activeIcon: keyof typeof Ionicons.glyphMap;
  }
> = {
  patient: {
    label: 'Paciente',
    icon: 'person-outline',
    activeIcon: 'person',
  },
  doctor: {
    label: 'Médico',
    icon: 'medkit-outline',
    activeIcon: 'medkit',
  },
  admin: {
    label: 'Administrador',
    icon: 'shield-outline',
    activeIcon: 'shield-checkmark',
  },
};

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  activeMode,
  availableModes,
  onSelectMode,
}) => {
  // Solo se muestra si el usuario tiene al menos 2 modos disponibles verificados
  if (!availableModes || availableModes.length < 2) {
    return null;
  }

  const activeLabel = activeMode ? MODE_CONFIG[activeMode]?.label : 'Ninguno';

  return (
    <View className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-4">
      {/* Encabezado del Selector */}
      <View className="flex-row items-center justify-between mb-1.5">
        <View className="flex-row items-center">
          <View className="w-7 h-7 rounded-full bg-teal-50 items-center justify-center mr-2">
            <Ionicons name="swap-horizontal" size={16} color="#259487" />
          </View>
          <Text className="text-sm font-semibold text-neutral-900">
            Modo de Navegación
          </Text>
        </View>
        <Badge text={`Activo: ${activeLabel}`} variant="primary" />
      </View>

      <Text className="text-xs text-gray-600 mb-3 leading-4">
        Tienes múltiples roles habilitados. Cambia el modo activo para adaptar las pestañas y vistas:
      </Text>

      {/* Botones de Selección de Modo */}
      <View className="flex-row gap-2">
        {availableModes.map((mode) => {
          const config = MODE_CONFIG[mode];
          const isActive = mode === activeMode;

          return (
            <Pressable
              key={mode}
              onPress={() => {
                if (!isActive) {
                  onSelectMode(mode);
                }
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`Cambiar al modo ${config.label}${
                isActive ? ' (modo actualmente activo)' : ''
              }`}
              className={`flex-1 py-2.5 px-2 rounded-md border items-center justify-center flex-row gap-1.5 min-h-[44px] ${
                isActive
                  ? 'bg-primary-dark border-primary-dark active:opacity-90'
                  : 'bg-white border-gray-300 active:bg-gray-100'
              }`}
            >
              <Ionicons
                name={isActive ? config.activeIcon : config.icon}
                size={16}
                color={isActive ? '#ffffff' : '#4b5563'}
              />
              <Text
                className={`text-xs ${
                  isActive ? 'text-white font-bold' : 'text-neutral-900 font-semibold'
                }`}
              >
                {config.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default ModeSelector;
