import React from 'react';
import { Text, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '../../components';
import { useRoleResolutionRecovery } from './useRoleResolutionRecovery';
import { ClaySurface } from '../../components/ClaySurface';
import { tokens } from '../../theme/tokens';

export const RoleResolutionRecoveryScreen: React.FC = () => {
  const { error, isRetrying, handleRetry, handleSignOut } =
    useRoleResolutionRecovery();

  return (
    <View className="min-w-0 max-w-full flex-1 bg-med-bg">
      <ScrollView
        className="min-w-0 max-w-full flex-1 bg-med-surface"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: tokens.spacing.lg,
        }}
      >
        <Card className="w-full max-w-sm p-6 items-center">
          {/* Icono de Alerta de Error */}
          <ClaySurface
            depth="badge"
            className="w-14 h-14 rounded-full bg-med-error-bg border border-med-error-border items-center justify-center mb-4"
          >
            <Ionicons
              name="alert-circle-outline"
              size={tokens.iconSize[32]}
              color={tokens.colors.error.text}
            />
          </ClaySurface>

          {/* Título */}
          <Text className="text-lg font-bold text-med-text-main text-center mb-1">
            Verificación de Acceso
          </Text>

          {/* Descripción del error */}
          <Text className="text-xs text-med-text-muted text-center mb-4 leading-relaxed">
            Ocurrió un problema al verificar los permisos y roles asociados a tu
            cuenta. No podemos determinar las pantallas disponibles.
          </Text>

          {/* Caja con detalle técnico del error */}
          <ClaySurface className="w-full bg-med-error-bg border border-med-error-border rounded-clay p-3 mb-6">
            <Text className="text-xs text-med-error-text font-medium text-center">
              {error}
            </Text>
          </ClaySurface>

          {/* Botones de Acción */}
          <View className="w-full gap-3">
            <Button
              text={isRetrying ? 'Reintentando...' : 'Reintentar Verificación'}
              onPress={handleRetry}
              loading={isRetrying}
              disabled={isRetrying}
              className="w-full"
            />

            <Button
              text="Cerrar Sesión"
              variant="outline"
              onPress={handleSignOut}
              disabled={isRetrying}
              className="w-full"
            />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

export default RoleResolutionRecoveryScreen;
