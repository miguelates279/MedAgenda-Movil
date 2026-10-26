import React from 'react';
import {
  SafeAreaView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '../../components';
import { useRoleResolutionRecovery } from './useRoleResolutionRecovery';

export const RoleResolutionRecoveryScreen: React.FC = () => {
  const { error, isRetrying, handleRetry, handleSignOut } =
    useRoleResolutionRecovery();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center p-6 bg-gray-50">
        <Card className="w-full max-w-sm p-6 items-center">
          {/* Icono de Alerta de Error */}
          <View className="w-14 h-14 rounded-full bg-red-50 border border-red-200 items-center justify-center mb-4">
            <Ionicons name="alert-circle-outline" size={32} color="#991b1b" />
          </View>

          {/* Título */}
          <Text className="text-lg font-bold text-neutral-900 text-center mb-1">
            Verificación de Acceso
          </Text>

          {/* Descripción del error */}
          <Text className="text-xs text-gray-600 text-center mb-4 leading-relaxed">
            Ocurrió un problema al verificar los permisos y roles asociados a tu cuenta. No podemos determinar las pantallas disponibles.
          </Text>

          {/* Caja con detalle técnico del error */}
          <View className="w-full bg-red-50 border border-red-200 rounded-md p-3 mb-6">
            <Text className="text-xs text-red-800 font-medium text-center">
              {error}
            </Text>
          </View>

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
      </View>
    </SafeAreaView>
  );
};

export default RoleResolutionRecoveryScreen;
