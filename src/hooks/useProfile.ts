import { useState } from 'react';
import { useUserInfo } from './useUserInfo';
import { useLogout } from './useLogout';

export type ProfileAuthTab = 'login' | 'register';

export const useProfile = () => {
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
