import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import appointmentsApi from '../api/appointments';
import { DoctorAppointmentView } from '../api/types';
import { useUserInfo } from './useUserInfo';
import { useLogout } from './useLogout';

export const useHome = () => {
  const router = useRouter();
  const {
    user,
    roles,
    isAuthenticated,
    isDoctor,
    isAdmin,
    fullName,
    roleText: roleBadgeText,
  } = useUserInfo();

  const {
    isModalOpen: isLogoutModalOpen,
    loading: isLoggingOut,
    requestLogout: handleLogout,
    cancelLogout: handleCancelLogout,
    confirmLogout: handleConfirmLogout,
  } = useLogout({
    redirectTo: '/clinics',
  });

  const [upcomingAppt, setUpcomingAppt] = useState<DoctorAppointmentView | null>(null);
  const [loadingAppt, setLoadingAppt] = useState(false);

  const loadNextAppointment = useCallback(async () => {
    setLoadingAppt(true);
    try {
      const list = await appointmentsApi.getPatientAppointments();
      const now = new Date();
      const upcoming = list
        .filter((a) => new Date(a.start_date_time) >= now)
        .sort(
          (a, b) =>
            new Date(a.start_date_time).getTime() - new Date(b.start_date_time).getTime()
        )[0];
      setUpcomingAppt(upcoming || null);
    } catch {
      setUpcomingAppt(null);
    } finally {
      setLoadingAppt(false);
    }
  }, []);

  useEffect(() => {
    loadNextAppointment();
  }, [loadNextAppointment]);

  const navigateToClinics = () => router.push('/clinics' as any);
  const navigateToAppointments = () => router.push('/appointments' as any);
  const navigateToPrescriptions = () => router.push('/prescriptions' as any);
  const navigateToDoctorPanel = () => router.push('/doctor' as any);
  const navigateToNewClinic = () => router.push('/clinics/new' as any);
  const navigateToMyClinics = () => router.push('/clinics/mine' as any);
  const navigateToAppointmentDetail = (appointmentId: number) =>
    router.push(`/appointments/${appointmentId}` as any);

  return {
    user,
    roles,
    isAuthenticated,
    isDoctor,
    isAdmin,
    fullName,
    roleBadgeText,
    upcomingAppt,
    loadingAppt,
    loadNextAppointment,
    isLogoutModalOpen,
    isLoggingOut,
    handleLogout,
    handleCancelLogout,
    handleConfirmLogout,
    navigateToClinics,
    navigateToAppointments,
    navigateToPrescriptions,
    navigateToDoctorPanel,
    navigateToNewClinic,
    navigateToMyClinics,
    navigateToAppointmentDetail,
  };
};

export default useHome;
