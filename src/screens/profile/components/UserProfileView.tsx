import React from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../../components';
import { UserProfile } from '../../../api/types';
import { AppMode } from '../../../context/AuthContext';
import { ModeSelector } from './ModeSelector';
import { ClaySurface, ClayPressable } from '../../../components/ClaySurface';
import { tokens } from '../../../theme/tokens';

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
  const { fontScale } = useWindowDimensions();
  const avatarSize = tokens.layout.avatarProfile * Math.max(1, fontScale);
  return (
    <ScrollView
      className="min-w-0 max-w-full flex-1 bg-med-surface"
      contentContainerClassName="p-4 pb-10"
    >
      {/* Tarjeta de Avatar e Identidad */}
      <ClaySurface className="items-center py-6 bg-med-bg rounded-clay border border-med-border-light mb-4">
        <ClaySurface
          depth="badge"
          style={{ width: avatarSize, height: avatarSize }}
          className="shrink-0 rounded-full bg-med-primary items-center justify-center mb-3.5"
        >
          <Text className="text-med-on-primary text-3xl font-bold uppercase tracking-wider">
            {initials || 'U'}
          </Text>
        </ClaySurface>

        <Text className="text-xl font-bold text-med-text-main mb-1 text-center px-4">
          {fullName || 'Usuario'}
        </Text>

        <Text className="text-sm text-med-text-muted mb-3.5 text-center px-4 max-w-full">
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
      </ClaySurface>

      {/* Selector de Modo de Aplicación (solo si hay 2 o más modos disponibles) */}
      <ModeSelector
        activeMode={activeMode}
        availableModes={availableModes}
        onSelectMode={onSelectMode}
      />

      {/* Información de la Cuenta */}
      <ClaySurface className="bg-med-bg rounded-clay border border-med-border-light mb-4">
        <View className="flex-row items-center px-4 py-3.5 border-b border-med-border-light">
          <ClaySurface
            depth="badge"
            className="w-8 h-8 rounded-full bg-med-primary-surface items-center justify-center mr-2.5"
          >
            <Ionicons
              name="person"
              size={tokens.iconSize[17]}
              color={tokens.colors.primary}
            />
          </ClaySurface>
          <Text className="min-w-0 max-w-full shrink text-base font-bold text-med-text-main">
            Datos Personales
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-x-3 gap-y-2 justify-between items-center px-4 py-3.5 border-b border-med-border-light">
          <View className="flex-row items-center min-w-0 max-w-full">
            <Ionicons
              name="card-outline"
              size={tokens.iconSize[18]}
              color={tokens.colors.textLight}
            />
            <Text className="min-w-0 max-w-full shrink text-sm text-med-text-muted ml-2.5 font-medium">
              Identificación
            </Text>
          </View>
          <Text
            className="shrink text-sm text-med-text-main font-semibold grow min-w-0 max-w-full text-right"
            style={{ flexBasis: tokens.layout.cardMinWidth }}
          >
            {user.legal_id || '—'}
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-x-3 gap-y-2 justify-between items-center px-4 py-3.5 border-b border-med-border-light">
          <View className="flex-row items-center min-w-0 max-w-full">
            <Ionicons
              name="call-outline"
              size={tokens.iconSize[18]}
              color={tokens.colors.textLight}
            />
            <Text className="min-w-0 max-w-full shrink text-sm text-med-text-muted ml-2.5 font-medium">
              Teléfono
            </Text>
          </View>
          <Text
            className="shrink text-sm text-med-text-main font-semibold grow min-w-0 max-w-full text-right"
            style={{ flexBasis: tokens.layout.cardMinWidth }}
          >
            {user.user_phone_number || '—'}
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-x-3 gap-y-2 justify-between items-center px-4 py-3.5">
          <View className="flex-row items-center min-w-0 max-w-full">
            <Ionicons
              name="mail-outline"
              size={tokens.iconSize[18]}
              color={tokens.colors.textLight}
            />
            <Text className="min-w-0 max-w-full shrink text-sm text-med-text-muted ml-2.5 font-medium">
              Correo
            </Text>
          </View>
          <Text
            className="shrink text-sm text-med-text-main font-semibold grow min-w-0 max-w-full text-right"
            style={{ flexBasis: tokens.layout.cardMinWidth }}
          >
            {user.user_email_address}
          </Text>
        </View>
      </ClaySurface>

      {/* Botón de Cerrar Sesión */}
      <ClayPressable
        onPress={onLogout}
        className="min-h-touch max-w-full flex-row items-center justify-center bg-med-error-bg border border-med-error-border rounded-control py-3.5 px-4 active:bg-med-error-badge-bg"
        accessibilityRole="button"
        accessibilityLabel="Cerrar Sesión"
      >
        <Ionicons
          name="log-out-outline"
          size={tokens.iconSize[20]}
          color={tokens.colors.error.text}
        />
        <Text className="min-w-0 max-w-full shrink text-base font-bold text-med-error-text ml-2">
          Cerrar Sesión
        </Text>
      </ClayPressable>
    </ScrollView>
  );
};

export default UserProfileView;
