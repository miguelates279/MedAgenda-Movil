import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export const useRoleResolutionRecovery = () => {
  const {
    modeResolutionError,
    isResolvingModes,
    refreshRoleAccess,
    signOut,
  } = useAuth();
  const router = useRouter();

  const handleRetry = useCallback(async () => {
    await refreshRoleAccess();
  }, [refreshRoleAccess]);

  const handleSignOut = useCallback(() => {
    signOut();
    router.replace('/clinics' as any);
  }, [signOut, router]);

  return {
    error:
      modeResolutionError ||
      'No se pudieron resolver los permisos y modos de tu cuenta.',
    isRetrying: isResolvingModes,
    handleRetry,
    handleSignOut,
  };
};

export default useRoleResolutionRecovery;
