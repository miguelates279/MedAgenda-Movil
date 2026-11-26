import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppMode } from '../../../context/AuthContext';
import { Badge } from '../../../components';
import { ClaySurface, ClayPressable } from '../../../components/ClaySurface';
import { tokens } from '../../../theme/tokens';

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
    <ClaySurface className="bg-med-bg rounded-clay border border-med-border-light p-4 mb-4">
      {/* Encabezado del Selector */}
      <View className="flex-row flex-wrap gap-2 items-center justify-between mb-1.5">
        <View
          className="flex-row items-center grow min-w-header max-w-full"
          style={{ flexBasis: tokens.layout.cardMinWidth }}
        >
          <ClaySurface
            depth="badge"
            className="w-8 h-8 rounded-full bg-med-primary-surface items-center justify-center mr-2.5"
          >
            <Ionicons
              name="swap-horizontal"
              size={tokens.iconSize[18]}
              color={tokens.colors.primary}
            />
          </ClaySurface>
          <Text className="min-w-0 max-w-full shrink text-base font-bold text-med-text-main">
            Modo de Navegación
          </Text>
        </View>
        <Badge text={activeLabel} variant="primary" />
      </View>

      <Text className="text-sm text-med-text-muted mb-3.5 leading-5">
        Tienes múltiples roles habilitados. Cambia el modo activo para adaptar
        las pestañas y vistas:
      </Text>

      {/* Lista de Roles Disponibles */}
      <View className="gap-2.5">
        {availableModes.map((mode) => {
          const config = MODE_CONFIG[mode];
          const isActive = mode === activeMode;

          return (
            <ClayPressable
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
              className={`min-h-touch max-w-full p-3 rounded-control border flex-row flex-wrap gap-2 items-center justify-between ${
                isActive
                  ? 'bg-med-primary-surface/70 border-med-primary'
                  : 'bg-med-bg border-med-border-light active:bg-med-surface'
              }`}
            >
              <View
                className="flex-row items-center grow min-w-header max-w-full"
                style={{ flexBasis: tokens.layout.cardMinWidth }}
              >
                <ClaySurface
                  depth="badge"
                  className={`w-9 h-9 rounded-full items-center justify-center mr-3 ${
                    isActive
                      ? 'bg-med-primary'
                      : 'bg-med-surface-muted border border-med-border-light'
                  }`}
                >
                  <Ionicons
                    name={isActive ? config.activeIcon : config.icon}
                    size={tokens.iconSize[18]}
                    color={
                      isActive
                        ? tokens.colors.onPrimary
                        : tokens.colors.textMuted
                    }
                  />
                </ClaySurface>
                <View className="min-w-0 max-w-full flex-1">
                  <Text
                    className={`text-base ${
                      isActive
                        ? 'text-med-primary-dark font-bold'
                        : 'text-med-text-main font-semibold'
                    }`}
                  >
                    {config.label}
                  </Text>
                  <Text className="text-xs text-med-text-soft mt-0.5">
                    {config.description}
                  </Text>
                </View>
              </View>

              {isActive ? (
                <ClaySurface
                  depth="badge"
                  className="flex-row items-center bg-med-primary-light px-2.5 py-1 rounded-full border border-med-primary-border-strong"
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={tokens.iconSize[14]}
                    color={tokens.colors.primaryDark}
                  />
                  <Text className="min-w-0 max-w-full shrink text-xs font-bold text-med-primary-dark ml-1">
                    Activo
                  </Text>
                </ClaySurface>
              ) : (
                <ClaySurface
                  depth="badge"
                  className="px-3 py-1 rounded-full border border-med-border bg-med-surface"
                >
                  <Text className="text-xs font-semibold text-med-text-muted">
                    Cambiar
                  </Text>
                </ClaySurface>
              )}
            </ClayPressable>
          );
        })}
      </View>
    </ClaySurface>
  );
};

export default ModeSelector;
