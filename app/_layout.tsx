import '../src/polyfills';
import React from 'react';
import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

function RootNavigation() {
  const { isAuthenticated, activeMode } = useAuth();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#f9fafb' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="clinics/[id]" />

      {/* Rutas para cualquier usuario autenticado con sesión y capacidades resueltas */}
      <Stack.Protected guard={isAuthenticated && activeMode !== null}>
        <Stack.Screen name="clinics/new" />
      </Stack.Protected>

      {/* Rutas de gestión exclusivas del modo Administrador */}
      <Stack.Protected guard={isAuthenticated && activeMode === 'admin'}>
        <Stack.Screen name="clinics/mine" />
      </Stack.Protected>

      {/* Rutas protegidas exclusivas del modo Paciente */}
      <Stack.Protected guard={isAuthenticated && activeMode === 'patient'}>
        <Stack.Screen name="appointments/new" />
        <Stack.Screen name="appointments/[id]" />
        <Stack.Screen name="prescriptions/index" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigation />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
