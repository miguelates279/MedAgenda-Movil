import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import Button from '../src/components/Button';

export default function HomeScreen() {
  const router = useRouter();
  const { user, roles, signOut } = useAuth();

  const handleLogout = () => {
    signOut();
    router.replace('/login');
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15 }}>
        Bienvenido
      </Text>

      <Text>Usuario: {user ? `${user.first_name} ${user.first_last_name}` : ''}</Text>
      <Text>Correo: {user?.user_email_address}</Text>
      <Text>Cédula: {user?.legal_id}</Text>
      <Text>
        Rol: {roles?.isAdmin ? 'Admin' : roles?.isDoctor ? 'Médico' : 'Paciente'}
      </Text>

      <Button
        text="Cerrar sesión"
        onPress={handleLogout}
        variant={{ backgroundColor: '#cc0000', padding: 10, alignItems: 'center', marginTop: 20 }}
      />
    </View>
  );
}
