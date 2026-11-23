import appointmentsApi from '../../../api/appointments';
import apiClient from '../../../api/client';
import { reminderDevice } from './deviceNotifications';
import { AppointmentReminderService } from './reminderService';

export const appointmentReminders = new AppointmentReminderService(
  reminderDevice,
  () => appointmentsApi.getPatientAppointments(),
  (session) =>
    !!apiClient.getToken() && apiClient.getSessionId() === session.sessionId,
  Date.now,
  () => console.warn('No fue posible actualizar los recordatorios de citas.'),
);

export async function refreshAppointmentReminders(
  requestPermission = false,
): Promise<void> {
  try {
    await appointmentReminders.refresh(requestPermission);
  } catch {
    console.warn(
      'No fue posible sincronizar los recordatorios de citas. Se reintentará al volver a la app.',
    );
  }
}
