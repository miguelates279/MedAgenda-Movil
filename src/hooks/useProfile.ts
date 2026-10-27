import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useUserInfo } from './useUserInfo';
import { useLogout } from './useLogout';
import { useAppMode } from './useAppMode';
import { AppMode, useAuth } from '../context/AuthContext';

export type ProfileAuthTab = 'login' | 'register';

export const useProfile = () => {
  const router = useRouter();
  const [tab, setTab] = useState<ProfileAuthTab>('login');

  const {
    user,
    roles,
    isAuthenticated,
    isDoctor,
    isAdmin,
    fullName,
    initials,
    roleText,
    roleBadgeVariant,
  } = useUserInfo();

  const { activeMode, availableModes, setActiveMode } = useAppMode();
  const { refreshProfile } = useAuth();

  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const hasAttemptedInitialFetchRef = useRef<boolean>(false);

  const handleRetryProfile = useCallback(async () => {
    setLoadingProfile(true);
    setProfileError(null);
    try {
      await refreshProfile();
    } catch (err: any) {
      setProfileError(err?.message || 'No se pudo cargar la información del perfil.');
    } finally {
      setLoadingProfile(false);
    }
  }, [refreshProfile]);

  useEffect(() => {
    if (isAuthenticated && !user && !hasAttemptedInitialFetchRef.current) {
      hasAttemptedInitialFetchRef.current = true;
      handleRetryProfile();
    }
  }, [isAuthenticated, user, handleRetryProfile]);

  const handleSelectMode = useCallback(
    (newMode: AppMode) => {
      if (newMode === activeMode) return;
      if (!availableModes.includes(newMode)) return;
      setActiveMode(newMode);
      // Enrutador central '/' gestiona de forma determinista la redirección al destino según el modo activo
      router.replace('/' as any);
    },
    [activeMode, availableModes, setActiveMode, router]
  );

  const {
    isModalOpen: isLogoutModalOpen,
    loading: isLoggingOut,
    requestLogout: handleLogout,
    cancelLogout: handleCancelLogout,
    confirmLogout: handleConfirmLogout,
  } = useLogout({
    onSuccess: () => {
      setTab('login');
      hasAttemptedInitialFetchRef.current = false;
      setProfileError(null);
    },
  });

  return {
    isAuthenticated,
    user,
    roles,
    isDoctor,
    isAdmin,
    fullName,
    initials,
    roleText,
    roleBadgeVariant,
    activeMode,
    availableModes,
    handleSelectMode,
    loadingProfile,
    profileError,
    handleRetryProfile,
    tab,
    setTab,
    isLogoutModalOpen,
    isLoggingOut,
    handleLogout,
    handleCancelLogout,
    handleConfirmLogout,
  };
};

export default useProfile;
