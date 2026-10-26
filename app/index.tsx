import '../src/polyfills';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { RoleResolutionRecoveryScreen } from '../src/screens/auth';

export default function IndexScreen() {
  const {
    isLoading,
    isResolvingModes,
    isAuthenticated,
    activeMode,
  } = useAuth();

  // Si está cargando la autenticación o resolviendo modos para un usuario autenticado
  if (isLoading || (isAuthenticated && isResolvingModes && !activeMode)) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#259487" />
      </View>
    );
  }

  // Usuario no autenticado: experiencia Invitado en catálogo público de clínicas
  if (!isAuthenticated) {
    return <Redirect href={'/clinics' as any} />;
  }

  // Usuario autenticado pero sin modo verificado (fallo en resolución de roles)
  if (!activeMode) {
    return <RoleResolutionRecoveryScreen />;
  }

  // Redirigir al destino correspondiente según el modo activo verificado
  if (activeMode === 'doctor') {
    return <Redirect href={'/doctor' as any} />;
  }

  if (activeMode === 'admin') {
    return <Redirect href={'/admin' as any} />;
  }

  return <Redirect href={'/home' as any} />;
}