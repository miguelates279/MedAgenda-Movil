import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../../components';
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
  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerClassName="p-4 pb-10"
    >
      {/* Tarjeta de Avatar e Identidad */}
      <View className="items-center py-6 bg-white rounded-lg border border-gray-200 shadow-sm mb-4">
        <View className="w-24 h-24 rounded-full bg-primary items-center justify-center mb-3.5 shadow-sm">
          <Text className="text-white text-3xl font-bold uppercase tracking-wider">
            {initials || 'U'}
          </Text>
        </View>

        <Text className="text-xl font-bold text-neutral-900 mb-1 text-center px-4">
          {fullName || 'Usuario'}
        </Text>

        <Text className="text-sm text-gray-600 mb-3.5 text-center">
          {user.user_email_address}
        </Text>

        <View className="items-center justify-center w-full">
          <Badge
            text={'Cuenta: ' + roleText}
            variant={roleBadgeVariant}
            className="self-center px-3.5 py-1"
            style={{ alignSelf: 'center' }}
            textClassName="text-sm font-semibold"
          />
        </View>
      </View>

      {/* Selector de Modo de Aplicación (solo si hay 2 o más modos disponibles) */}
      <ModeSelector
        activeMode={activeMode}
        availableModes={availableModes}
        onSelectMode={onSelectMode}
      />

      {/* Información de la Cuenta */}
      <View className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4">
        <View className="flex-row items-center px-4 py-3.5 border-b border-gray-100">
          <View className="w-8 h-8 rounded-full bg-teal-50 items-center justify-center mr-2.5">
            <Ionicons name="person" size={17} color="#259487" />
          </View>
          <Text className="text-base font-bold text-neutral-900">
            Datos Personales
          </Text>
        </View>

        <View className="flex-row justify-between items-center px-4 py-3.5 border-b border-gray-100">
          <View className="flex-row items-center">
            <Ionicons name="card-outline" size={18} color="#9ca3af" />
            <Text className="text-sm text-gray-600 ml-2.5 font-medium">Identificación</Text>
          </View>
          <Text className="text-sm text-neutral-900 font-semibold max-w-[65%] text-right">
            {user.legal_id || '—'}
          </Text>
        </View>

        <View className="flex-row justify-between items-center px-4 py-3.5 border-b border-gray-100">
          <View className="flex-row items-center">
            <Ionicons name="call-outline" size={18} color="#9ca3af" />
            <Text className="text-sm text-gray-600 ml-2.5 font-medium">Teléfono</Text>
          </View>
          <Text className="text-sm text-neutral-900 font-semibold max-w-[65%] text-right">
            {user.user_phone_number || '—'}
          </Text>
        </View>

        <View className="flex-row justify-between items-center px-4 py-3.5">
          <View className="flex-row items-center">
            <Ionicons name="mail-outline" size={18} color="#9ca3af" />
            <Text className="text-sm text-gray-600 ml-2.5 font-medium">Correo</Text>
          </View>
          <Text className="text-sm text-neutral-900 font-semibold max-w-[65%] text-right">
            {user.user_email_address}
          </Text>
        </View>
      </View>

      {/* Botón de Cerrar Sesión */}
      <Pressable
        onPress={onLogout}
        className="flex-row items-center justify-center bg-red-50 border border-red-200 rounded-md py-3.5 px-4 shadow-sm active:bg-red-100"
        accessibilityRole="button"
        accessibilityLabel="Cerrar Sesión"
      >
        <Ionicons name="log-out-outline" size={20} color="#991b1b" />
        <Text className="text-base font-bold text-red-800 ml-2">
          Cerrar Sesión
        </Text>
      </Pressable>
    </ScrollView>
  );
};

export default UserProfileView;
