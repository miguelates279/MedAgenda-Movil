import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../../components';
import { UserProfile } from '../../../api/types';

export interface UserProfileViewProps {
  user: UserProfile;
  fullName: string;
  initials: string;
  roleText: string;
  roleBadgeVariant: 'primary' | 'info' | 'success';
  onLogout: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  user,
  fullName,
  initials,
  roleText,
  roleBadgeVariant,
  onLogout,
}) => {
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

        <Badge text={roleText} variant={roleBadgeVariant} />
      </View>

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
