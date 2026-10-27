import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import appointmentsApi from '../api/appointments';
import { DoctorAppointmentView } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { useUserInfo } from './useUserInfo';
import { useLogout } from './useLogout';

export const useHome = () => {
  const router = useRouter();
  const { token } = useAuth();
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
  const [apptError, setApptError] = useState<string | null>(null);

  // Prevenir mostrar citas desactualizadas al cambiar de sesión/token
  const lastTokenRef = useRef<string | null>(token);
  useEffect(() => {
    if (lastTokenRef.current !== token) {
      lastTokenRef.current = token;
      setUpcomingAppt(null);
      setApptError(null);
    }
  }, [token]);

  const loadNextAppointment = useCallback(async () => {
    if (!isAuthenticated) {
      setUpcomingAppt(null);
      setApptError(null);
      setLoadingAppt(false);
      return;
    }

    setLoadingAppt(true);
    setApptError(null);
    const requestToken = token;

    try {
      const list = await appointmentsApi.getPatientAppointments();
      if (requestToken !== token) return;

      const now = Date.now();
      const validList = Array.isArray(list) ? list : [];
      const upcoming = validList
        .filter((a) => {
          const startTime = new Date(a.start_date_time).getTime();
          // Cita futura: debe tener timestamp válido y su hora de inicio aún no debe haber transcurrido
          return !isNaN(startTime) && startTime >= now;
        })
        .sort(
          (a, b) =>
            new Date(a.start_date_time).getTime() - new Date(b.start_date_time).getTime()
        )[0];

      setUpcomingAppt(upcoming || null);
    } catch (err: any) {
      if (requestToken !== token) return;
      setUpcomingAppt(null);
      setApptError(err?.message || 'No se pudieron cargar tus citas médicas.');
    } finally {
      setLoadingAppt(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    loadNextAppointment();
  }, [loadNextAppointment]);

  const navigateToClinics = () => router.push('/clinics' as any);
  const navigateToAppointments = () => router.push('/appointments' as any);
  const navigateToPrescriptions = () => router.push('/prescriptions' as any);
  const navigateToNewClinic = () => router.push('/clinics/new' as any);
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
    apptError,
    loadNextAppointment,
    isLogoutModalOpen,
    isLoggingOut,
    handleLogout,
    handleCancelLogout,
    handleConfirmLogout,
    navigateToClinics,
    navigateToAppointments,
    navigateToPrescriptions,
    navigateToNewClinic,
    navigateToAppointmentDetail,
  };
};

export default useHome;
