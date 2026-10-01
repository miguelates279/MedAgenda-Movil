import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export interface UseLogoutOptions {
  redirectTo?: string;
  onSuccess?: () => void;
}

/**
 * Hook para gestionar el flujo de cierre de sesión con estado de modal.
 */
export const useLogout = (options?: UseLogoutOptions) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signOut } = useAuth();
  const router = useRouter();

  const requestLogout = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const cancelLogout = useCallback(() => {
    if (!loading) {
      setIsModalOpen(false);
    }
  }, [loading]);

  const confirmLogout = useCallback(async () => {
    setLoading(true);
    try {
      signOut();
      setIsModalOpen(false);
      if (options?.onSuccess) {
        options.onSuccess();
      }
      if (options?.redirectTo) {
        router.replace(options.redirectTo as any);
      }
    } finally {
      setLoading(false);
    }
  }, [signOut, router, options]);

  return {
    isModalOpen,
    loading,
    requestLogout,
    cancelLogout,
    confirmLogout,
  };
};

export default useLogout;
