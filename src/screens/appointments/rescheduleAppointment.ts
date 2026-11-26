import type {
  DoctorAppointmentView,
  UpdateAppointmentDto,
} from '../../api/types';
import type { TimeSlot } from '../../utils/appointmentAvailability';

interface RescheduleDependencies {
  update(id: number, dates: UpdateAppointmentDto): Promise<unknown>;
  cancelReminders(id: number): Promise<void>;
  refreshReminders(): Promise<unknown>;
  sessionIsCurrent(): boolean;
  now?: () => number;
}

export async function rescheduleAppointment(
  appointment: DoctorAppointmentView,
  slot: TimeSlot,
  dependencies: RescheduleDependencies,
): Promise<{
  appointment: DoctorAppointmentView;
  remindersUpdated: boolean;
} | null> {
  if (!dependencies.sessionIsCurrent()) return null;
  const now = (dependencies.now ?? Date.now)();
  const previousStart = Date.parse(appointment.start_date_time);
  const previousEnd = Date.parse(appointment.end_date_time);
  if (!Number.isFinite(previousStart) || previousStart <= now) {
    throw new Error('Solo puedes reprogramar citas futuras.');
  }
  if (
    slot.status !== 'available' ||
    !Number.isFinite(slot.start.getTime()) ||
    !Number.isFinite(slot.end.getTime()) ||
    slot.start.getTime() <= now ||
    slot.end <= slot.start
  ) {
    throw new Error('Selecciona un horario futuro disponible.');
  }
  if (slot.start.getTime() === previousStart)
    throw new Error('Selecciona un horario diferente al actual.');
  if (
    slot.end.getTime() - slot.start.getTime() !==
    previousEnd - previousStart
  ) {
    throw new Error(
      'La duración del nuevo horario no coincide con la cita. Actualiza la disponibilidad.',
    );
  }
  const dates = {
    start_date_time: slot.start.toISOString(),
    end_date_time: slot.end.toISOString(),
  };
  await dependencies.update(appointment.appointment_id, {
    ...dates,
    ...(appointment.status_version === undefined
      ? {}
      : { expected_version: appointment.status_version }),
  });
  if (!dependencies.sessionIsCurrent()) return null;
  let remindersUpdated = true;
  try {
    // Remove the old times even if fetching the new reminder plan subsequently fails.
    await dependencies.cancelReminders(appointment.appointment_id);
    if (!dependencies.sessionIsCurrent()) return null;
    await dependencies.refreshReminders();
  } catch {
    remindersUpdated = false;
  }
  if (!dependencies.sessionIsCurrent()) return null;
  return { appointment: { ...appointment, ...dates }, remindersUpdated };
}
