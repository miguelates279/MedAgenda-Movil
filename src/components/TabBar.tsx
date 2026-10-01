import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const BRAND_PRIMARY = '#259487';
const TEXT_MUTED = '#4b5563';

interface TabConfig {
  label: string;
  iconFamily: 'Ionicons' | 'MaterialCommunityIcons';
  activeIcon: string;
  inactiveIcon: string;
}

const TAB_CONFIG: Record<string, TabConfig> = {
  home: {
    label: 'Inicio',
    iconFamily: 'Ionicons',
    activeIcon: 'home',
    inactiveIcon: 'home-outline',
  },
  appointments: {
    label: 'Citas',
    iconFamily: 'Ionicons',
    activeIcon: 'calendar',
    inactiveIcon: 'calendar-outline',
  },
  clinics: {
    label: 'Clínicas',
    iconFamily: 'Ionicons',
    activeIcon: 'business',
    inactiveIcon: 'business-outline',
  },
  doctor: {
    label: 'Doctor',
    iconFamily: 'MaterialCommunityIcons',
    activeIcon: 'stethoscope',
    inactiveIcon: 'stethoscope',
  },
  profile: {
    label: 'Perfil',
    iconFamily: 'Ionicons',
    activeIcon: 'person',
    inactiveIcon: 'person-outline',
  },
};

/**
 * TabBar real para el navegador <Tabs> de Expo Router.
 * Reemplaza la simulación manual por un componente nativo gestionado por React Navigation,
 * implementado con Tailwind / NativeWind y @expo/vector-icons.
 */
export const TabBar: React.FC<any> = ({ state, descriptors, navigation }) => {
  return (
    <View
      className="bg-white border-t border-gray-200 shadow-sm pb-2"
      accessibilityRole="tablist"
    >
      <View className="flex-row items-center justify-around pt-2">
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];

          // Si href es null, la pestaña está oculta (ej. doctor para pacientes)
          if (options.href === null) {
            return null;
          }

          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name] || {
            label: options.title || route.name,
            iconFamily: 'Ionicons',
            activeIcon: 'ellipse',
            inactiveIcon: 'ellipse-outline',
          };

          const iconColor = isFocused ? BRAND_PRIMARY : TEXT_MUTED;
          const iconName = isFocused ? config.activeIcon : config.inactiveIcon;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={config.label}
              className="flex-1 items-center justify-center relative py-1"
            >
              {({ pressed }) => (
                <View
                  className={`items-center justify-center w-full ${
                    pressed ? 'opacity-70' : 'opacity-100'
                  }`}
                >
                  {/* Indicador superior de pestaña activa */}
                  {isFocused && (
                    <View className="absolute -top-2 w-8 h-[3px] bg-primary rounded-full" />
                  )}

                  {/* Icono de la pestaña */}
                  <View className="items-center justify-center h-6">
                    {config.iconFamily === 'MaterialCommunityIcons' ? (
                      <MaterialCommunityIcons
                        name={iconName as any}
                        size={22}
                        color={iconColor}
                      />
                    ) : (
                      <Ionicons
                        name={iconName as any}
                        size={22}
                        color={iconColor}
                      />
                    )}
                  </View>

                  {/* Texto de la pestaña */}
                  <Text
                    className={`text-xs mt-1 ${
                      isFocused
                        ? 'text-primary font-semibold'
                        : 'text-gray-600 font-medium'
                    }`}
                  >
                    {config.label}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default TabBar;
