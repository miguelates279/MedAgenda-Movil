import { useEffect, useRef, useState } from 'react';
import appointmentsApi from '../api/appointments';
import apiClient from '../api/client';
import { refreshAppointmentReminders } from '../screens/appointments/reminders/appointmentReminders';
import { useAppointmentAvailability } from './useAppointmentAvailability';
import { minimumAdvanceLabel } from '../utils/appointmentAvailability';
export { formatDateParam } from '../utils/appointmentAvailability';
export type {
  SlotStatus,
  TimeSlot,
  MonthOption,
  DayOption,
} from '../utils/appointmentAvailability';

export function useDoctorSchedule(clinicId: number, doctorId: number) {
  const availability = useAppointmentAvailability(clinicId, doctorId);
  const { selectedSlot, refreshSlots } = availability;
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const busy = useRef(false);
  const mounted = useRef(true);
  const scope = `${apiClient.getSessionId()}:${clinicId}:${doctorId}`;
  const currentScope = useRef(scope);
  currentScope.current = scope;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const confirmBooking = async (description = note): Promise<boolean> => {
    const sessionId = apiClient.getSessionId();
    const current = () =>
      mounted.current &&
      currentScope.current === scope &&
      apiClient.getSessionId() === sessionId;
    if (busy.current || !current()) return false;
    if (
      !selectedSlot ||
      !clinicId ||
      !doctorId ||
      !availability.isSlotAvailable(selectedSlot)
    ) {
      await refreshSlots();
      throw new Error(
        `Selecciona un horario disponible con al menos ${minimumAdvanceLabel(availability.minimumAdvanceMinutes)} de anticipación.`,
      );
    }
    setSubmitting(true);
    setScheduleError(null);
    busy.current = true;
    try {
      await appointmentsApi.scheduleAppointment({
        clinic_id: clinicId,
        doctor_id: doctorId,
        start_date_time: selectedSlot.start,
        end_date_time: selectedSlot.end,
        appointment_description: description.trim() || undefined,
      });
      if (!current()) return false;
      setNote('');
      await refreshAppointmentReminders(true);
      await refreshSlots(selectedSlot.start);
      return current();
    } catch (err: any) {
      if (!current()) return false;
      let message = err.message || 'No se pudo agendar la cita.';
      if (/409|Conflict/i.test(message))
        message = 'El horario seleccionado ya no se encuentra disponible.';
      setScheduleError(message);
      await refreshSlots();
      throw new Error(message);
    } finally {
      busy.current = false;
      if (mounted.current) setSubmitting(false);
    }
  };
  return {
    ...availability,
    note,
    setNote,
    submitting,
    scheduleError,
    confirmBooking,
  };
}
