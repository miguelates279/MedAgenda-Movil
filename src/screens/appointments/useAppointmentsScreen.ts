import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import appointmentsApi from '../../api/appointments';
import { DoctorAppointmentView } from '../../api/types';
import { useAuth } from '../../context/AuthContext';

export function useAppointmentsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState<DoctorAppointmentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await appointmentsApi.getPatientAppointments();
      setAppointments(data || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las citas');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const now = new Date();

  const filteredAppointments = appointments
    .filter((appt) => {
      const apptDate = new Date(appt.start_date_time);
      if (tab === 'upcoming') {
        return apptDate >= now;
      }
      return apptDate < now;
    })
    .filter((appt) => {
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      const doctorName = `${appt.first_name} ${appt.first_last_name}`.toLowerCase();
      const clinicName = (appt.clinic_name || '').toLowerCase();
      const desc = (appt.appointment_description || '').toLowerCase();
      return (
        doctorName.includes(term) ||
        clinicName.includes(term) ||
        desc.includes(term)
      );
    })
    .sort((a, b) => {
      const timeA = new Date(a.start_date_time).getTime();
      const timeB = new Date(b.start_date_time).getTime();
      return tab === 'upcoming' ? timeA - timeB : timeB - timeA;
    });

  return {
    router,
    isAuthenticated,
    loading,
    search,
    setSearch,
    tab,
    setTab,
    error,
    loadAppointments,
    filteredAppointments,
  };
}
