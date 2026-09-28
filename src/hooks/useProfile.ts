import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useUserInfo } from './useUserInfo';

export type ProfileAuthTab = 'login' | 'register';

export const useProfile = () => {
  const { signOut } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<ProfileAuthTab>('login');

  // Consume el hook compartido: fullName, initials, roles, user, etc.
  const { user, roles, isAuthenticated, fullName, initials, roleText, roleBadgeVariant } =
    useUserInfo();

  const handleLogout = useCallback(() => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: () => {
          signOut();
          // No navegamos: al limpiar el estado del contexto, isAuthenticated pasa a false
          // y ProfileScreen ya renderiza la vista de login automáticamente.
        },
      },
    ]);
  }, [signOut]);

  return {
    isAuthenticated,
    user,
    roles,
    fullName,
    initials,
    roleText,
    roleBadgeVariant,
    tab,
    setTab,
    handleLogout,
  };
};

export default useProfile;
