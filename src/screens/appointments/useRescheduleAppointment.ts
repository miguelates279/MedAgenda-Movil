import { useEffect, useRef, useState } from 'react';

import appointmentsApi from '../../api/appointments';
import apiClient from '../../api/client';
import type { DoctorAppointmentView } from '../../api/types';
import { useAppointmentAvailability } from '../../hooks/useAppointmentAvailability';
import { formatAppointmentDate } from '../../utils/appointmentAvailability';
import { appointmentReminders } from './reminders/appointmentReminders';
import { rescheduleAppointment } from './rescheduleAppointment';
import { appAlerts } from '../../utils/appAlerts';

export function useRescheduleAppointment(
  appointment: DoctorAppointmentView,
  onComplete: (result: {
    appointment: DoctorAppointmentView;
    remindersUpdated: boolean;
  }) => void,
  onDismiss: () => void,
) {
  const availability = useAppointmentAvailability(
    appointment.clinic_id ?? 0,
    appointment.doctor_id ?? 0,
    {
      excludeAppointmentId: appointment.appointment_id,
      initialStart: appointment.start_date_time,
    },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const confirming = useRef(false);
  const mounted = useRef(true);
  const session = useRef(apiClient.getSessionId());
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const sessionIsCurrent = () =>
    mounted.current && session.current === apiClient.getSessionId();
  const dismiss = () => {
    if (!busy.current) onDismiss();
  };

  const confirm = () => {
    const slot = availability.selectedSlot;
    if (busy.current || confirming.current || !sessionIsCurrent()) return;
    if (!slot) {
      setError('Selecciona un horario futuro disponible.');
      return;
    }
    confirming.current = true;
    appAlerts.alert(
      'Confirmar reprogramación',
      `Tu cita del ${formatAppointmentDate(appointment.start_date_time)} cambiará al ${formatAppointmentDate(slot.start)}. ¿Deseas guardar el nuevo horario?`,
      [
        {
          text: 'Conservar horario',
          style: 'cancel',
          onPress: () => {
            confirming.current = false;
          },
        },
        {
          text: 'Confirmar cambio',
          onPress: async () => {
            confirming.current = false;
            if (busy.current || !sessionIsCurrent()) return;
            busy.current = true;
            setSaving(true);
            setError(null);
            try {
              const result = await rescheduleAppointment(appointment, slot, {
                update: (id, dates) => appointmentsApi.updateAppointment(id, dates),
                cancelReminders: (id) => appointmentReminders.cancelAppointment(id),
                refreshReminders: () =>
                  appointmentReminders.refresh(false, {
                    throwOnDeviceError: true,
                  }),
                sessionIsCurrent,
              });
              if (result && sessionIsCurrent()) onComplete(result);
            } catch (cause: any) {
              if (sessionIsCurrent()) {
                const message =
                  cause.message ||
                  'No se pudo reprogramar la cita. Inténtalo de nuevo.';
                setError(
                  /409|conflict|not available|unavailable/i.test(message)
                    ? 'Ese horario acaba de ocuparse o ya no está disponible. Elige otro; tu cita conserva su horario anterior.'
                    : message,
                );
                await availability.refreshSlots();
              }
            } finally {
              busy.current = false;
              if (mounted.current) setSaving(false);
            }
          },
        },
      ],
      {
        variant: 'primary',
        cancelable: true,
        onDismiss: () => {
          confirming.current = false;
        },
      },
    );
  };
  return {
    availability,
    saving,
    error,
    confirm,
    dismiss,
    currentDateLabel: formatAppointmentDate(appointment.start_date_time),
    selectedDateLabel: availability.selectedSlot
      ? formatAppointmentDate(availability.selectedSlot.start)
      : null,
  };
}
