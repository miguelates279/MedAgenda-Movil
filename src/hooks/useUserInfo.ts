import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Hook compartido que encapsula los cálculos de información de usuario:
 * nombre completo, iniciales del avatar, texto de rol y variante de badge.
 * Se usa en useHome, useProfile y cualquier pantalla que necesite estos datos.
 */
export const useUserInfo = () => {
  const { user, roles, isAuthenticated } = useAuth();

  const fullName = useMemo(
    () =>
      user
        ? [user.first_name, user.second_name, user.first_last_name, user.second_last_name]
            .filter(Boolean)
            .join(' ')
        : '',
    [user]
  );

  const initials = useMemo(
    () =>
      user
        ? ((user.first_name?.[0] ?? '') + (user.first_last_name?.[0] ?? '')).toUpperCase()
        : '',
    [user]
  );

  const roleText = useMemo(
    () =>
      roles?.isAdmin ? 'Admin' : roles?.isDoctor ? 'Médico' : 'Paciente',
    [roles]
  );

  const roleBadgeVariant: 'primary' | 'info' | 'success' = roles?.isAdmin
    ? 'primary'
    : roles?.isDoctor
    ? 'info'
    : 'success';

  return {
    user,
    roles,
    isAuthenticated,
    fullName,
    initials,
    roleText,
    roleBadgeVariant,
  };
};

export default useUserInfo;
