import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavBar, NavTab, TabItem } from './useNavBar';

export interface NavBarProps {
  active: NavTab;
  className?: string;
  onTabPress?: (tab: NavTab) => void;
}

const BRAND_PRIMARY = '#259487';
const TEXT_MUTED = '#4b5563';

export const NavBar: React.FC<NavBarProps> = ({
  active,
  className = '',
  onTabPress,
}) => {
  const { visibleTabs, handleNavigate, bottomInset } = useNavBar({
    active,
    onTabPress,
  });

  const renderIcon = (tab: TabItem, isActive: boolean) => {
    const iconColor = isActive ? BRAND_PRIMARY : TEXT_MUTED;
    const iconName = isActive ? tab.activeIcon : tab.inactiveIcon;

    if (tab.iconFamily === 'MaterialCommunityIcons') {
      return (
        <MaterialCommunityIcons
          name={iconName as any}
          size={22}
          color={iconColor}
        />
      );
    }

    return (
      <Ionicons
        name={iconName as any}
        size={22}
        color={iconColor}
      />
    );
  };

  return (
    <View
      className={`bg-white border-t border-gray-200 shadow-sm ${className}`}
      style={{ paddingBottom: bottomInset }}
      accessibilityRole="tablist"
    >
      <View className="flex-row items-center justify-around pt-2">
        {visibleTabs.map((tab) => {
          const isActive = tab.id === active;

          return (
            <Pressable
              key={tab.id}
              onPress={() => handleNavigate(tab)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
              className="flex-1 items-center justify-center relative py-1"
            >
              {({ pressed }) => (
                <View
                  className={`items-center justify-center w-full ${
                    pressed ? 'opacity-70' : 'opacity-100'
                  }`}
                >
                  {/* Indicador de pestaña activa */}
                  {isActive && (
                    <View className="absolute -top-2 w-8 h-[3px] bg-primary rounded-full" />
                  )}

                  {/* Icono de la pestaña */}
                  <View className="items-center justify-center h-6">
                    {renderIcon(tab, isActive)}
                  </View>

                  {/* Texto de la pestaña */}
                  <Text
                    className={`text-xs mt-1 ${
                      isActive
                        ? 'text-primary font-semibold'
                        : 'text-gray-600 font-medium'
                    }`}
                  >
                    {tab.label}
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

export default NavBar;
export { NavTab } from './useNavBar';
