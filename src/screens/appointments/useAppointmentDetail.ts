import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import appointmentsApi from '../../api/appointments';
import apiClient from '../../api/client';
import { refreshAppointmentReminders } from './reminders/appointmentReminders';
import { DoctorAppointmentView } from '../../api/types';
import { appAlerts } from '../../utils/appAlerts';
import { useAppointmentAction } from '../../hooks/useAppointmentAction';
import { useFocusedRefresh } from '../../hooks/useFocusedRefresh';

export interface EditAppointmentForm {
  appointment_description: string;
}

export function useAppointmentDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const appointmentId = Number(id);
  const [appointment, setAppointment] = useState<DoctorAppointmentView | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [rescheduleVisible, setRescheduleVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const active = useRef(false);
  const routeId = useRef(appointmentId);
  const loadedRouteId = useRef<number | null>(null);
  routeId.current = appointmentId;
  const notesBusy = useRef(false);
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<EditAppointmentForm>({
    defaultValues: { appointment_description: '' },
  });
  const dirty = useRef(isDirty);
  dirty.current = isDirty;

  const loadAppointment = useCallback(
    async (quiet = false, resetNotes = false) => {
      if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
        setError('No se encontró la cita especificada.');
        setLoading(false);
        return;
      }
      const request = ++generation.current;
      const sessionId = apiClient.getSessionId();
      const current = () =>
        active.current &&
        request === generation.current &&
        sessionId === apiClient.getSessionId();
      if (!quiet) setLoading(true);
      try {
        const data = await appointmentsApi.getAppointment(appointmentId);
        if (!current()) return;
        setAppointment(data);
        setError(null);
        if (resetNotes || !dirty.current)
          reset({
            appointment_description: data.appointment_description || '',
          });
        await refreshAppointmentReminders();
      } catch (cause: any) {
        if (current())
          setError(
            cause?.message ||
              'No se pudo actualizar la cita. Desliza hacia abajo para reintentar.',
          );
      } finally {
        if (current()) setLoading(false);
      }
    },
    [appointmentId, reset],
  );

  useFocusEffect(
    useCallback(() => {
      active.current = true;
      const changedRoute = loadedRouteId.current !== appointmentId;
      if (changedRoute) {
        loadedRouteId.current = appointmentId;
        setAppointment(null);
        setRescheduleVisible(false);
        setError(null);
        reset({ appointment_description: '' });
      }
      void loadAppointment(false, changedRoute);
      return () => {
        active.current = false;
        ++generation.current;
      };
    }, [appointmentId, loadAppointment, reset]),
  );
  useFocusedRefresh(() => loadAppointment(true));

  const { pending, requestAction } = useAppointmentAction(async (state) => {
    if (state.appointment_id !== routeId.current) return;
    setAppointment((previous) => (previous ? { ...previous, ...state } : null));
    await loadAppointment(true);
  }, appointmentId);

  const onUpdate = (data: EditAppointmentForm) => {
    if (
      !appointment?.can_edit_notes ||
      !isDirty ||
      notesBusy.current ||
      pending
    )
      return;
    const target = appointment;
    const sessionId = apiClient.getSessionId();
    const targetId = appointmentId;
    const current = () =>
      active.current &&
      sessionId === apiClient.getSessionId() &&
      targetId === routeId.current;
    appAlerts.alert(
      'Guardar notas',
      '¿Deseas guardar los cambios en las notas de tu cita?',
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Guardar',
          onPress: async () => {
            if (!current() || notesBusy.current) return;
            notesBusy.current = true;
            setUpdating(true);
            try {
              await appointmentsApi.updateAppointment(appointmentId, {
                appointment_description: data.appointment_description.trim(),
                expected_version: target.status_version,
              });
              if (current()) {
                await loadAppointment(true, true);
                appAlerts.alert(
                  'Notas guardadas',
                  'Las notas de tu cita se actualizaron.',
                  undefined,
                  { variant: 'success' },
                );
              }
            } catch (cause: any) {
              if (current()) {
                await loadAppointment(true);
                appAlerts.alert(
                  'No se pudieron guardar las notas',
                  cause?.message || 'Actualiza la cita y vuelve a intentarlo.',
                  undefined,
                  { variant: 'error' },
                );
              }
            } finally {
              notesBusy.current = false;
              setUpdating(false);
            }
          },
        },
      ],
      { variant: 'primary' },
    );
  };

  const handleOpenReschedule = () => {
    if (!updating && !pending && appointment?.can_reschedule)
      setRescheduleVisible(true);
  };
  const onRescheduled = (result: {
    appointment: DoctorAppointmentView;
    remindersUpdated: boolean;
  }) => {
    if (result.appointment.appointment_id !== routeId.current) return;
    setAppointment(result.appointment);
    setRescheduleVisible(false);
    void loadAppointment(true, true);
    appAlerts.alert(
      'Cita reprogramada',
      result.remindersUpdated
        ? 'El nuevo horario quedó guardado y se actualizaron los recordatorios habilitados.'
        : 'El nuevo horario quedó guardado. Abre Mis Citas con conexión para reintentar la actualización de sus avisos.',
      undefined,
      { variant: result.remindersUpdated ? 'success' : 'warning' },
    );
  };

  return {
    router,
    appointmentId,
    appointment:
      appointment?.appointment_id === appointmentId ? appointment : null,
    loading,
    updating,
    error,
    control,
    handleSubmit,
    isDirty,
    onUpdate,
    pending: pending?.appointmentId === appointmentId ? pending : null,
    requestAction,
    loadAppointment,
    rescheduleVisible,
    handleOpenReschedule,
    closeReschedule: () => setRescheduleVisible(false),
    onRescheduled,
  };
}
