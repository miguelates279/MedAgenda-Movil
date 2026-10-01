import React from 'react';
import { Tabs } from 'expo-router';
import { TabBar } from '../../src/components/TabBar';
import { useUserInfo } from '../../src/hooks';

export default function TabsLayout() {
  const { isDoctor } = useUserInfo();

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
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
      <Tabs.Screen
        name="clinics"
        options={{
          title: 'Clínicas',
        }}
      />
      <Tabs.Screen
        name="doctor"
        options={{
          title: 'Doctor',
          href: isDoctor ? '/doctor' : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
        }}
      />
    </Tabs>
  );
}
