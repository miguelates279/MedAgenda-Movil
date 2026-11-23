import { useState } from 'react';
import appointmentsApi from '../api/appointments';
import apiClient from '../api/client';
import { refreshAppointmentReminders } from '../screens/appointments/reminders/appointmentReminders';
import { useAppointmentAvailability } from './useAppointmentAvailability';
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
  const confirmBooking = async (description = note): Promise<boolean> => {
    if (!selectedSlot || !clinicId || !doctorId) {
      throw new Error('Selecciona un horario disponible antes de confirmar.');
    }
    setSubmitting(true);
    setScheduleError(null);
    const sessionId = apiClient.getSessionId();
    try {
      await appointmentsApi.scheduleAppointment({
        clinic_id: clinicId,
        doctor_id: doctorId,
        start_date_time: selectedSlot.start,
        end_date_time: selectedSlot.end,
        appointment_description: description.trim() || undefined,
      });
      if (apiClient.getSessionId() !== sessionId) return false;
      setNote('');
      await refreshAppointmentReminders(true);
      await refreshSlots(selectedSlot.start);
      return apiClient.getSessionId() === sessionId;
    } catch (err: any) {
      let message = err.message || 'No se pudo agendar la cita.';
      if (/409|Conflict/i.test(message))
        message = 'El horario seleccionado ya no se encuentra disponible.';
      setScheduleError(message);
      throw new Error(message);
    } finally {
      setSubmitting(false);
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
