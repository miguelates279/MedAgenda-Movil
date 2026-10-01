import '../src/polyfills';
import React from 'react';
import '../global.css';
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
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="clinics/mine" />
          <Stack.Screen name="clinics/new" />
          <Stack.Screen name="clinics/[id]" />
          <Stack.Screen name="appointments/new" />
          <Stack.Screen name="appointments/[id]" />
          <Stack.Screen name="prescriptions/index" />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}