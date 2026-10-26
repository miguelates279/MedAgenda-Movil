import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { TabBar } from '../../src/components/TabBar';
import { useAuth } from '../../src/context/AuthContext';

export default function TabsLayout() {
  const { isAuthenticated, activeMode } = useAuth();

  // Si el usuario está autenticado pero los modos no se han resuelto,
  // redirigir al enrutador central '/' (que muestra loading o pantalla de recuperación)
  if (isAuthenticated && !activeMode) {
    return <Redirect href={'/' as any} />;
  }

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Pestañas de Paciente */}
      <Tabs.Protected guard={isAuthenticated && activeMode === 'patient'}>
        <Tabs.Screen
          name="home"
          options={{
            title: 'Inicio',
          }}
        />
        <Tabs.Screen
          name="appointments"
          options={{
            title: 'Citas',
          }}
        />
      </Tabs.Protected>

      {/* Pestaña de Clínicas: visible para Invitado y Paciente */}
      <Tabs.Protected guard={!isAuthenticated || activeMode === 'patient'}>
        <Tabs.Screen
          name="clinics"
          options={{
            title: 'Clínicas',
          }}
        />
      </Tabs.Protected>

      {/* Pestaña de Médico: dashboard del doctor presentado como Inicio */}
      <Tabs.Protected guard={isAuthenticated && activeMode === 'doctor'}>
        <Tabs.Screen
          name="doctor"
          options={{
            title: 'Inicio',
          }}
        />
      </Tabs.Protected>

      {/* Pestaña de Administrador de Clínica: destino de aterrizaje administrativo */}
      <Tabs.Protected guard={isAuthenticated && activeMode === 'admin'}>
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Inicio',
          }}
        />
      </Tabs.Protected>

      {/* Pestaña compartida de Perfil: accesible para todos los modos e invitados */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
        }}
      />
    </Tabs>
  );
}
