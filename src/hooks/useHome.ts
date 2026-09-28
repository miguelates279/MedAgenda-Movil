import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import appointmentsApi from '../api/appointments';
import { DoctorAppointmentView } from '../api/types';
import { useUserInfo } from './useUserInfo';

export const useHome = () => {
  const router = useRouter();
  const { signOut, isAuthenticated } = useAuth();
  const { user, roles, fullName, roleText: roleBadgeText } = useUserInfo();
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

  const handleLogout = useCallback(() => {
    signOut();
    router.replace('/clinics' as any);
  }, [signOut, router]);

  const navigateToClinics = () => router.push('/clinics' as any);
  const navigateToAppointments = () => router.push('/appointments' as any);
  const navigateToPrescriptions = () => router.push('/prescriptions' as any);
  const navigateToDoctorPanel = () => router.push('/doctor' as any);
  const navigateToNewClinic = () => router.push('/clinics/new' as any);
  const navigateToMyClinics = () => router.push('/clinics?mode=mine' as any);
  const navigateToAppointmentDetail = (appointmentId: number) =>
    router.push(`/appointments/${appointmentId}` as any);

  return {
    user,
    roles,
    isAuthenticated,
    fullName,
    roleBadgeText,
    upcomingAppt,
    loadingAppt,
    loadNextAppointment,
    handleLogout,
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
