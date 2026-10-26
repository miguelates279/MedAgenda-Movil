import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { useUserInfo } from './useUserInfo';
import { useLogout } from './useLogout';
import { useAppMode } from './useAppMode';
import { AppMode } from '../context/AuthContext';

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

  const handleSelectMode = useCallback(
    (newMode: AppMode) => {
      if (newMode === activeMode) return;
      if (!availableModes.includes(newMode)) return;
      setActiveMode(newMode);
      if (newMode === 'doctor') {
        router.replace('/doctor' as any);
      } else if (newMode === 'admin') {
        router.replace('/admin' as any);
      } else {
        router.replace('/home' as any);
      }
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
