import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
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

  // Referencias para rastrear sesión y generación de peticiones independientemente de closures asíncronos
  const activeTokenRef = useRef<string | null>(token);
  const activeAuthRef = useRef<boolean>(isAuthenticated);
  const requestGenRef = useRef<number>(0);

  // Sincronizar en cada render la sesión actual en refs mutables
  activeTokenRef.current = token;
  activeAuthRef.current = isAuthenticated;

  // Limpiar citas y cancelar peticiones pendientes ante cambio de sesión o cierre de sesión
  const prevTokenRef = useRef<string | null>(token);
  useEffect(() => {
    if (prevTokenRef.current !== token) {
      prevTokenRef.current = token;
      requestGenRef.current += 1;
      setUpcomingAppt(null);
      setApptError(null);
      setLoadingAppt(false);
    }
  }, [token]);

  const loadNextAppointment = useCallback(async () => {
    if (!activeAuthRef.current || !activeTokenRef.current) {
      requestGenRef.current += 1;
      setUpcomingAppt(null);
      setApptError(null);
      setLoadingAppt(false);
      return;
    }

    const currentToken = activeTokenRef.current;
    const currentGen = ++requestGenRef.current;

    setLoadingAppt(true);
    setApptError(null);

    try {
      const list = await appointmentsApi.getPatientAppointments();

      // Descartar si cambió la sesión o si una petición posterior ya fue emitida
      if (
        activeTokenRef.current !== currentToken ||
        !activeAuthRef.current ||
        currentGen !== requestGenRef.current
      ) {
        return;
      }

      const now = Date.now();
      const validList = Array.isArray(list) ? list : [];
      const upcoming = validList
        .filter((a) => {
          const startTime = new Date(a.start_date_time).getTime();
          // Cita futura: timestamp numérico válido y hora de inicio aún no transcurrida
          return !isNaN(startTime) && startTime >= now;
        })
        .sort(
          (a, b) =>
            new Date(a.start_date_time).getTime() - new Date(b.start_date_time).getTime()
        )[0];

      setUpcomingAppt(upcoming || null);
    } catch (err: any) {
      if (
        activeTokenRef.current !== currentToken ||
        !activeAuthRef.current ||
        currentGen !== requestGenRef.current
      ) {
        return;
      }
      setUpcomingAppt(null);
      setApptError(err?.message || 'No se pudieron cargar tus citas médicas.');
    } finally {
      // Proteger el estado de carga: peticiones desactualizadas no deben desactivar la carga de una más nueva
      if (
        activeTokenRef.current === currentToken &&
        activeAuthRef.current &&
        currentGen === requestGenRef.current
      ) {
        setLoadingAppt(false);
      }
    }
  }, []);

  // Recargar al montar o volver a enfocar la pantalla de Inicio
  useFocusEffect(
    useCallback(() => {
      loadNextAppointment();
    }, [loadNextAppointment])
  );

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
