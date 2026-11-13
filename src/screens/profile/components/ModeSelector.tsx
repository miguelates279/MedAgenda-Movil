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
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    activeIcon: keyof typeof Ionicons.glyphMap;
  }
> = {
  patient: {
    label: 'Paciente',
    description: 'Agendar citas, buscar clínicas y ver recetas',
    icon: 'person-outline',
    activeIcon: 'person',
  },
  doctor: {
    label: 'Médico',
    description: 'Agenda de hoy, pacientes y fórmulas médicas',
    icon: 'medkit-outline',
    activeIcon: 'medkit',
  },
  admin: {
    label: 'Administrador',
    description: 'Administración de sedes clínicas y gestión',
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
        <View className="flex-row items-center flex-1 mr-2">
          <View className="w-8 h-8 rounded-full bg-teal-50 items-center justify-center mr-2.5">
            <Ionicons name="swap-horizontal" size={18} color="#259487" />
          </View>
          <Text className="text-base font-bold text-neutral-900">
            Modo de Navegación
          </Text>
        </View>
        <Badge text={activeLabel} variant="primary" />
      </View>

      <Text className="text-sm text-gray-600 mb-3.5 leading-5">
        Tienes múltiples roles habilitados. Cambia el modo activo para adaptar las pestañas y vistas:
      </Text>

      {/* Lista de Roles Disponibles */}
      <View className="gap-2.5">
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
              className={`p-3 rounded-lg border flex-row items-center justify-between ${
                isActive
                  ? 'bg-teal-50/70 border-primary shadow-xs'
                  : 'bg-white border-gray-200 active:bg-gray-50'
              }`}
            >
              <View className="flex-row items-center flex-1 mr-3">
                <View
                  className={`w-9 h-9 rounded-full items-center justify-center mr-3 ${
                    isActive ? 'bg-primary' : 'bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Ionicons
                    name={isActive ? config.activeIcon : config.icon}
                    size={18}
                    color={isActive ? '#ffffff' : '#4b5563'}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-base ${
                      isActive ? 'text-primary-dark font-bold' : 'text-neutral-900 font-semibold'
                    }`}
                  >
                    {config.label}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-0.5">
                    {config.description}
                  </Text>
                </View>
              </View>

              {isActive ? (
                <View className="flex-row items-center bg-teal-100 px-2.5 py-1 rounded-full border border-teal-200">
                  <Ionicons name="checkmark-circle" size={14} color="#1d7369" />
                  <Text className="text-xs font-bold text-teal-900 ml-1">Activo</Text>
                </View>
              ) : (
                <View className="px-3 py-1 rounded-full border border-gray-300 bg-gray-50">
                  <Text className="text-xs font-semibold text-gray-600">Cambiar</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default ModeSelector;
