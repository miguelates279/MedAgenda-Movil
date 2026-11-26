import type {
  DoctorAppointmentView,
  UpdateAppointmentDto,
} from '../../api/types';
import type { TimeSlot } from '../../utils/appointmentAvailability';
import {
  MINIMUM_ADVANCE_MINUTES,
  minimumAdvanceLabel,
} from '../../utils/appointmentAvailability';

interface RescheduleDependencies {
  update(id: number, dates: UpdateAppointmentDto): Promise<unknown>;
  cancelReminders(id: number): Promise<void>;
  refreshReminders(): Promise<unknown>;
  sessionIsCurrent(): boolean;
  now?: () => number;
  minimumAdvanceMinutes?: number;
  durationMinutes?: number;
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
  const advance =
    dependencies.minimumAdvanceMinutes ??
    appointment.minimum_advance_minutes ??
    MINIMUM_ADVANCE_MINUTES;
  if (
    !Number.isFinite(now) ||
    !Number.isInteger(advance) ||
    advance < MINIMUM_ADVANCE_MINUTES ||
    !Number.isFinite(previousStart) ||
    previousStart - now < advance * 60_000
  ) {
    throw new Error(
      `Debes reprogramar con al menos ${minimumAdvanceLabel(advance)} de anticipación.`,
    );
  }
  if (
    slot.status !== 'available' ||
    !Number.isFinite(slot.start.getTime()) ||
    !Number.isFinite(slot.end.getTime()) ||
    slot.start.getTime() - now < advance * 60_000 ||
    slot.end <= slot.start
  ) {
    throw new Error(
      `Selecciona un horario disponible con al menos ${minimumAdvanceLabel(advance)} de anticipación.`,
    );
  }
  if (slot.start.getTime() === previousStart)
    throw new Error('Selecciona un horario diferente al actual.');
  if (
    slot.end.getTime() - slot.start.getTime() !==
    (dependencies.durationMinutes === undefined
      ? previousEnd - previousStart
      : dependencies.durationMinutes * 60_000)
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
    await dependencies.cancelReminders(appointment.appointment_id);
    if (!dependencies.sessionIsCurrent()) return null;
    await dependencies.refreshReminders();
  } catch {
    remindersUpdated = false;
  }
  if (!dependencies.sessionIsCurrent()) return null;
  return { appointment: { ...appointment, ...dates }, remindersUpdated };
}
