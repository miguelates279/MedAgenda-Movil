import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import apiClient from '../../api/client';
import { appointmentReminders } from './reminders/appointmentReminders';
import { hasPreciseReminderAccess, hasReminderPermission, remindersSupported } from './reminders/deviceNotifications';
import { DoctorAppointmentView } from '../../api/types';
import { useAuth } from '../../context/AuthContext';
import { appAlerts } from '../../utils/appAlerts';

export function useAppointmentsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState<DoctorAppointmentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [error, setError] = useState<string | null>(null);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [remindersPrecise, setRemindersPrecise] = useState(hasPreciseReminderAccess);
  const [enablingReminders, setEnablingReminders] = useState(false);
  const requestGeneration = useRef(0);

  const loadAppointments = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const sessionId = apiClient.getSessionId();
    const generation = ++requestGeneration.current;
    const current = () => generation === requestGeneration.current && sessionId === apiClient.getSessionId();
    try {
      const data = await appointmentReminders.refresh();
      if (!current()) return;
      setAppointments(data || []);
      const allowed = await hasReminderPermission().catch(() => false);
      if (current()) {
        setRemindersEnabled(allowed);
        setRemindersPrecise(hasPreciseReminderAccess());
      }
    } catch (err: any) {
      if (current()) setError(err.message || 'Error al cargar las citas');
    } finally {
      if (current()) setLoading(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(useCallback(() => {
    void loadAppointments();
    return () => { ++requestGeneration.current; };
  }, [loadAppointments]));

  useEffect(() => {
    let mounted = true;
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void hasReminderPermission().then(allowed => {
        if (mounted) {
          setRemindersEnabled(allowed);
          setRemindersPrecise(hasPreciseReminderAccess());
        }
      }).catch(() => {});
    });
    return () => { mounted = false; subscription.remove(); };
  }, []);

  const enableReminders = async () => {
    setEnablingReminders(true);
    const sessionId = apiClient.getSessionId();
    try {
      await appointmentReminders.refresh(true);
      const allowed = await hasReminderPermission();
      if (sessionId === apiClient.getSessionId()) {
        setRemindersEnabled(allowed);
        setRemindersPrecise(hasPreciseReminderAccess());
      }
    } catch {
      appAlerts.alert(
        'Recordatorios',
        'No se pudieron activar los recordatorios. Puedes seguir usando tus citas e intentarlo nuevamente.',
        undefined,
        { variant: 'warning' },
      );
    } finally {
      setEnablingReminders(false);
    }
  };

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
    remindersSupported,
    remindersEnabled,
    remindersPrecise,
    enablingReminders,
    enableReminders,
  };
}
