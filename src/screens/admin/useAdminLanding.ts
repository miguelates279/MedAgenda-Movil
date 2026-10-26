import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAppMode, useUserInfo } from '../../hooks';

export const useAdminLanding = () => {
  const router = useRouter();
  const { adminClinics, activeMode } = useAppMode();
  const { user } = useUserInfo();

  const navigateToMyClinics = useCallback(() => {
    router.push('/clinics/mine' as any);
  }, [router]);

  const navigateToNewClinic = useCallback(() => {
    router.push('/clinics/new' as any);
  }, [router]);

  const navigateToClinicDetail = useCallback(
    (clinicId: number) => {
      router.push(`/clinics/${clinicId}` as any);
    },
    [router]
  );

  return {
    user,
    activeMode,
    adminClinics,
    navigateToMyClinics,
    navigateToNewClinic,
    navigateToClinicDetail,
  };
};

export default useAdminLanding;
