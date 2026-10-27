import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../../components';
import { useRouter } from 'expo-router';
import { UserProfile } from '../../../api/types';
import { AppMode } from '../../../context/AuthContext';
import { ModeSelector } from './ModeSelector';

export interface UserProfileViewProps {
  user: UserProfile;
  fullName: string;
  initials: string;
  roleText: string;
  roleBadgeVariant: 'primary' | 'info' | 'success';
  activeMode: AppMode | null;
  availableModes: AppMode[];
  onSelectMode: (mode: AppMode) => void;
  onLogout: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  user,
  fullName,
  initials,
  roleText,
  roleBadgeVariant,
  activeMode,
  availableModes,
  onSelectMode,
  onLogout,
}) => {
  const router = useRouter();
  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerClassName="p-4 pb-10"
    >
      {/* Tarjeta de Avatar e Identidad */}
      <View className="items-center py-6 bg-white rounded-lg border border-gray-200 shadow-sm mb-4">
        <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-3 shadow-sm">
          <Text className="text-white text-2xl font-bold uppercase tracking-wider">
            {initials || 'U'}
          </Text>
        </View>

        <Text className="text-lg font-bold text-neutral-900 mb-0.5 text-center px-4">
          {fullName || 'Usuario'}
        </Text>

        <Text className="text-xs text-gray-600 mb-3 text-center">
          {user.user_email_address}
        </Text>

        <Badge text={'Cuenta: ' + roleText} variant={roleBadgeVariant} />
      </View>

      {/* Selector de Modo de Aplicación (solo si hay 2 o más modos disponibles) */}
      <ModeSelector
        activeMode={activeMode}
        availableModes={availableModes}
        onSelectMode={onSelectMode}
      />

      {/* Información de la Cuenta */}
      <View className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4">
        <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
          <View className="w-7 h-7 rounded-full bg-teal-50 items-center justify-center mr-2.5">
            <Ionicons name="person" size={15} color="#259487" />
          </View>
          <Text className="text-sm font-semibold text-neutral-900">
            Datos Personales
          </Text>
        </View>

        <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-100">
          <View className="flex-row items-center">
            <Ionicons name="card-outline" size={16} color="#9ca3af" />
            <Text className="text-xs text-gray-600 ml-2 font-medium">Identificación</Text>
          </View>
          <Text className="text-xs text-neutral-900 font-semibold max-w-[65%] text-right">
            {user.legal_id || '—'}
          </Text>
        </View>

        <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-100">
          <View className="flex-row items-center">
            <Ionicons name="call-outline" size={16} color="#9ca3af" />
            <Text className="text-xs text-gray-600 ml-2 font-medium">Teléfono</Text>
          </View>
          <Text className="text-xs text-neutral-900 font-semibold max-w-[65%] text-right">
            {user.user_phone_number || '—'}
          </Text>
        </View>

        <View className="flex-row justify-between items-center px-4 py-3">
          <View className="flex-row items-center">
            <Ionicons name="mail-outline" size={16} color="#9ca3af" />
            <Text className="text-xs text-gray-600 ml-2 font-medium">Correo</Text>
          </View>
          <Text className="text-xs text-neutral-900 font-semibold max-w-[65%] text-right">
            {user.user_email_address}
          </Text>
        </View>
      </View>

      {/* Registro de nueva sede clínica (Onboarding para crear clínica) */}
      <View className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-xs font-bold text-primary uppercase">Profesionales y Sedes</Text>
            <Text className="text-sm font-bold text-neutral-900 mt-0.5">Registrar una clínica</Text>
            <Text className="text-xs text-gray-600 mt-0.5">Registra tu sede para administrar citas y personal de salud.</Text>
          </View>
          <Pressable
            onPress={() => router.push('/clinics/new' as any)}
            className="py-2 px-3 bg-teal-50 border border-teal-200 rounded-md active:bg-teal-100"
            accessibilityRole="button"
            accessibilityLabel="Registrar una clínica"
          >
            <Text className="text-xs font-bold text-primary">Registrar</Text>
          </Pressable>
        </View>
      </View>

      {/* Botón de Cerrar Sesión */}
      <Pressable
        onPress={onLogout}
        className="flex-row items-center justify-center bg-red-50 border border-red-200 rounded-md py-3 px-4 shadow-sm active:bg-red-100"
        accessibilityRole="button"
        accessibilityLabel="Cerrar Sesión"
      >
        <Ionicons name="log-out-outline" size={18} color="#991b1b" />
        <Text className="text-sm font-semibold text-red-800 ml-2">
          Cerrar Sesión
        </Text>
      </Pressable>
    </ScrollView>
  );
};

export default UserProfileView;
