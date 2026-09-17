import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export type NavTab = 'home' | 'appointments' | 'clinics' | 'profile' | 'doctor';

export interface NavBarProps {
  active: NavTab;
  className?: string;
}

export const NavBar: React.FC<NavBarProps> = ({ active, className = '' }) => {
  const router = useRouter();
  const { isAuthenticated, roles } = useAuth();
  const isDoctor = isAuthenticated && !!roles?.isDoctor;

  const handleNavigate = (tab: NavTab) => {
    if (tab === active) return;

    if (tab === 'home') {
      router.replace('/home' as any);
    } else if (tab === 'appointments') {
      router.replace('/appointments' as any);
    } else if (tab === 'clinics') {
      router.replace('/clinics' as any);
    } else if (tab === 'doctor') {
      router.replace('/doctor' as any);
    } else if (tab === 'profile') {
      router.replace('/profile' as any);
    }
  };

  return (
    <View
      className={`flex-row bg-white border-t border-gray-200 py-2 pb-3.5 justify-around items-center shadow-lg ${className}`}
    >
      <TouchableOpacity
        className="flex-1 items-center justify-center relative py-0.5"
        onPress={() => handleNavigate('home')}
        activeOpacity={0.7}
      >
        <Text className={`text-xl mb-0.5 ${active === 'home' ? 'opacity-100' : 'opacity-70'}`}>
          🏠
        </Text>
        <Text
          className={`text-[11px] ${
            active === 'home' ? 'text-primary font-bold' : 'text-gray-500 font-medium'
          }`}
        >
          Inicio
        </Text>
        {active === 'home' && (
          <View className="absolute -top-2 w-7 h-[3px] bg-primary rounded-full" />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-1 items-center justify-center relative py-0.5"
        onPress={() => handleNavigate('appointments')}
        activeOpacity={0.7}
      >
        <Text className={`text-xl mb-0.5 ${active === 'appointments' ? 'opacity-100' : 'opacity-70'}`}>
          📅
        </Text>
        <Text
          className={`text-[11px] ${
            active === 'appointments' ? 'text-primary font-bold' : 'text-gray-500 font-medium'
          }`}
        >
          Citas
        </Text>
        {active === 'appointments' && (
          <View className="absolute -top-2 w-7 h-[3px] bg-primary rounded-full" />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-1 items-center justify-center relative py-0.5"
        onPress={() => handleNavigate('clinics')}
        activeOpacity={0.7}
      >
        <Text className={`text-xl mb-0.5 ${active === 'clinics' ? 'opacity-100' : 'opacity-70'}`}>
          🏥
        </Text>
        <Text
          className={`text-[11px] ${
            active === 'clinics' ? 'text-primary font-bold' : 'text-gray-500 font-medium'
          }`}
        >
          Clínicas
        </Text>
        {active === 'clinics' && (
          <View className="absolute -top-2 w-7 h-[3px] bg-primary rounded-full" />
        )}
      </TouchableOpacity>

      {isDoctor && (
        <TouchableOpacity
          className="flex-1 items-center justify-center relative py-0.5"
          onPress={() => handleNavigate('doctor')}
          activeOpacity={0.7}
        >
          <Text className={`text-xl mb-0.5 ${active === 'doctor' ? 'opacity-100' : 'opacity-70'}`}>
            🩺
          </Text>
          <Text
            className={`text-[11px] ${
              active === 'doctor' ? 'text-primary font-bold' : 'text-gray-500 font-medium'
            }`}
          >
            Doctor
          </Text>
          {active === 'doctor' && (
            <View className="absolute -top-2 w-7 h-[3px] bg-primary rounded-full" />
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        className="flex-1 items-center justify-center relative py-0.5"
        onPress={() => handleNavigate('profile')}
        activeOpacity={0.7}
      >
        <Text className={`text-xl mb-0.5 ${active === 'profile' ? 'opacity-100' : 'opacity-70'}`}>
          👤
        </Text>
        <Text
          className={`text-[11px] ${
            active === 'profile' ? 'text-primary font-bold' : 'text-gray-500 font-medium'
          }`}
        >
          Perfil
        </Text>
        {active === 'profile' && (
          <View className="absolute -top-2 w-7 h-[3px] bg-primary rounded-full" />
        )}
      </TouchableOpacity>
    </View>
  );
};

export default NavBar;
