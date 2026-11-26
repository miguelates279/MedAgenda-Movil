import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useKeyboardVisibility } from '../hooks/useKeyboardVisibility';
import { tokens } from '../theme/tokens';
import { ClayPressable, ClaySurface } from './ClaySurface';

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
    label: 'Inicio',
    iconFamily: 'MaterialCommunityIcons',
    activeIcon: 'stethoscope',
    inactiveIcon: 'stethoscope',
  },
  admin: {
    label: 'Inicio',
    iconFamily: 'Ionicons',
    activeIcon: 'shield-checkmark',
    inactiveIcon: 'shield-checkmark-outline',
  },
  profile: {
    label: 'Perfil',
    iconFamily: 'Ionicons',
    activeIcon: 'person',
    inactiveIcon: 'person-outline',
  },
};

export const TabBar: React.FC<any> = ({ state, descriptors, navigation }) => {
  const keyboardVisible = useKeyboardVisibility();
  if (keyboardVisible) return null;
  return (
    <ClaySurface
      className="bg-med-bg rounded-none border-t border-med-border-light pb-2"
      accessibilityRole="tablist"
    >
      <View className="flex-row items-center justify-around pt-2">
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];

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

          const displayLabel = options.title || config.label;
          const iconColor = isFocused ? tokens.colors.primary : tokens.colors.textMuted;
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
            <ClayPressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={displayLabel}
              className="min-h-touch min-w-0 flex-1 items-center justify-center relative mx-1 px-1 py-1 rounded-control bg-med-bg"
            >
              {({ pressed }) => (
                <View
                  className={`items-center justify-center w-full ${
                    pressed ? 'opacity-70' : 'opacity-100'
                  }`}
                >
                  {isFocused && (
                    <View className="absolute -top-2 w-8 h-indicator bg-med-primary rounded-full" />
                  )}

                  <View className="items-center justify-center h-6">
                    {config.iconFamily === 'MaterialCommunityIcons' ? (
                      <MaterialCommunityIcons
                        name={iconName as any}
                        size={tokens.iconSize[22]}
                        color={iconColor}
                      />
                    ) : (
                      <Ionicons
                        name={iconName as any}
                        size={tokens.iconSize[22]}
                        color={iconColor}
                      />
                    )}
                  </View>

                  <Text
                    className={`max-w-full text-center text-xs mt-1 ${
                      isFocused
                        ? 'text-med-primary font-semibold'
                        : 'text-med-text-muted font-medium'
                    }`}
                  >
                    {displayLabel}
                  </Text>
                </View>
              )}
            </ClayPressable>
          );
        })}
      </View>
    </ClaySurface>
  );
};

export default TabBar;
