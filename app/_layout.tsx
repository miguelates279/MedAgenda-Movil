import '../src/polyfills';
import React from 'react';
import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { AppointmentReminderLifecycle } from '../src/screens/appointments/reminders/AppointmentReminderLifecycle';
import { AppAlertHost } from '../src/components/AppAlertHost';
import { tokens } from '../src/theme/tokens';

function RootNavigation() {
  const { isAuthenticated, activeMode } = useAuth();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: tokens.colors.surface },
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
        <StatusBar style={tokens.statusBarStyle} />
        <SafeAreaView
          style={{ flex: 1, backgroundColor: tokens.colors.bg }}
          edges={['top', 'right', 'bottom', 'left']}
        >
          <RootNavigation />
          <AppointmentReminderLifecycle />
          <AppAlertHost />
        </SafeAreaView>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
