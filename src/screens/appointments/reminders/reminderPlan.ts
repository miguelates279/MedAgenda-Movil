import type { DoctorAppointmentView } from '../../../api/types';

export const REMINDER_KIND = 'medagenda.appointment.v1';
export const REMINDER_PREFIX = `${REMINDER_KIND}.`;
export const REMINDER_CHANNEL = 'appointment-reminders';
export const MAX_PENDING_REMINDERS = 64;

export interface ReminderData {
  kind: typeof REMINDER_KIND;
  patientId: number;
  appointmentId: number;
  startsAt: number;
  firesAt: number;
  hoursBefore: number;
  deliveryMode?: 'exact' | 'inexact';
}

export interface AppointmentReminder {
  identifier: string;
  title: string;
  body: string;
  data: ReminderData;
}

export interface StoredReminder {
  identifier: string;
  title?: string | null;
  body?: string | null;
  data: unknown;
}

export function readReminderData(value: unknown): ReminderData | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  if (
    data.deliveryMode !== undefined &&
    data.deliveryMode !== 'exact' &&
    data.deliveryMode !== 'inexact'
  )
    return null;
  if (
    data.kind !== REMINDER_KIND ||
    !Number.isSafeInteger(data.patientId) ||
    Number(data.patientId) <= 0 ||
    !Number.isSafeInteger(data.appointmentId) ||
    Number(data.appointmentId) <= 0 ||
    typeof data.startsAt !== 'number' ||
    !Number.isFinite(data.startsAt) ||
    typeof data.firesAt !== 'number' ||
    !Number.isFinite(data.firesAt) ||
    (data.hoursBefore !== 24 && data.hoursBefore !== 1) ||
    data.firesAt !== data.startsAt - data.hoursBefore * 3_600_000
  )
    return null;
  return data as unknown as ReminderData;
}

export function buildReminderPlan(
  appointments: DoctorAppointmentView[],
  patientId: number,
  now: number,
  limit = MAX_PENDING_REMINDERS,
  deliveryMode: 'exact' | 'inexact' = 'exact',
): AppointmentReminder[] {
  if (!Number.isSafeInteger(patientId) || patientId <= 0) return [];
  const reminders = new Map<string, AppointmentReminder>();
  for (const appointment of appointments) {
    const startsAt = Date.parse(appointment.start_date_time);
    if (
      !Number.isSafeInteger(appointment.appointment_id) ||
      appointment.appointment_id <= 0 ||
      !Number.isFinite(startsAt) ||
      startsAt <= now
    )
      continue;

    const doctor = [appointment.first_name, appointment.first_last_name]
      .filter(Boolean)
      .join(' ')
      .trim();
    const date = new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      day: 'numeric',
      month: 'long',
      hour: 'numeric',
      minute: '2-digit',
    }).format(startsAt);
    for (const hoursBefore of [24, 1]) {
      const firesAt = startsAt - hoursBefore * 3_600_000;
      if (firesAt <= now) continue;
      const identifier = `${REMINDER_PREFIX}${patientId}.${appointment.appointment_id}.${hoursBefore}`;
      reminders.set(identifier, {
        identifier,
        title:
          hoursBefore === 24
            ? 'Tu cita es en 24 horas'
            : 'Tu cita es en 1 hora',
        body: `Tu cita con ${doctor ? `Dr(a). ${doctor}` : 'tu médico'}${appointment.clinic_name ? ` en ${appointment.clinic_name}` : ''} es el ${date} (hora de Colombia).`,
        data: {
          kind: REMINDER_KIND,
          patientId,
          appointmentId: appointment.appointment_id,
          startsAt,
          firesAt,
          hoursBefore,
          deliveryMode,
        },
      });
    }
  }
  return [...reminders.values()]
    .sort(
      (a, b) =>
        a.data.firesAt - b.data.firesAt ||
        a.identifier.localeCompare(b.identifier),
    )
    .slice(0, limit);
}
