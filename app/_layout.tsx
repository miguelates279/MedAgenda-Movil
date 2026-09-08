import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#f9fafb' },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="login" options={{ title: 'Iniciar Sesión' }} />
          <Stack.Screen name="register" options={{ title: 'Registro' }} />
          <Stack.Screen name="home" options={{ title: 'Inicio' }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}