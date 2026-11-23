import type { AppointmentSlot, ClinicScheduleRules } from '../api/types';

export type SlotStatus = 'available' | 'booked' | 'break' | 'past' | 'current';
export interface TimeSlot {
  id: string;
  start: Date;
  end: Date;
  label: string;
  status: SlotStatus;
  note?: string;
}
export interface MonthOption {
  key: string;
  label: string;
  date: Date;
}
export interface DayOption {
  key: string;
  label: string;
  weekLabel: string;
  date: Date;
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
const WEEKDAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const pad = (value: number) => String(value).padStart(2, '0');
export const CLINIC_TIME_ZONE = 'America/Bogota';

export function formatDateParam(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function clinicDateTime(day: string, minutes = 0): Date {
  return new Date(
    `${day}T${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}:00-05:00`,
  );
}

export function formatAppointmentDate(value: string | Date): string {
  return new Date(value).toLocaleString('es-CO', {
    timeZone: CLINIC_TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function buildMonths(now = new Date()): MonthOption[] {
  const [year, month] = formatDateParam(now).split('-').map(Number);
  return Array.from({ length: 5 }, (_, index) => {
    const first = new Date(Date.UTC(year, month - 1 + index, 1));
    const key = `${first.getUTCFullYear()}-${pad(first.getUTCMonth() + 1)}`;
    return {
      key,
      label: `${MONTH_NAMES[first.getUTCMonth()]} ${first.getUTCFullYear()}`,
      date: clinicDateTime(`${key}-01`),
    };
  });
}

export function buildDaysForMonth(
  month: MonthOption,
  now = new Date(),
): DayOption[] {
  const [year, monthNumber] = month.key.split('-').map(Number);
  const today = formatDateParam(now);
  const last = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return Array.from({ length: last }, (_, index) => {
    const key = `${month.key}-${pad(index + 1)}`;
    return {
      key,
      label: String(index + 1),
      weekLabel: WEEKDAY_SHORT[new Date(`${key}T12:00:00Z`).getUTCDay()],
      date: clinicDateTime(key),
    };
  }).filter((day) => day.key >= today);
}

function timeInMinutes(value?: string | null): number | null {
  if (value === undefined || value === null || String(value).trim() === '')
    return null;
  const parts = String(value).trim().split(':').map(Number);
  if (parts.some((part) => !Number.isFinite(part) || part < 0)) return null;
  if (parts.length === 1) return parts[0];
  if (parts.length > 3 || parts[1] >= 60 || (parts[2] ?? 0) >= 60) return null;
  return parts[0] * 60 + parts[1] + (parts[2] ?? 0) / 60;
}

export function buildTimeSlots(
  day: string,
  rules: ClinicScheduleRules,
  bookings: AppointmentSlot[],
  options: {
    now?: number;
    excludeAppointmentId?: number;
    currentStart?: string;
  } = {},
): TimeSlot[] {
  const opening = timeInMinutes(rules.clinic_opening_time);
  const closing = timeInMinutes(rules.clinic_close_time);
  const duration = timeInMinutes(rules.clinic_average_appointment_time);
  if (
    opening === null ||
    closing === null ||
    duration === null ||
    duration <= 0 ||
    opening >= closing ||
    closing > 1440 ||
    !Number.isInteger(duration)
  ) {
    throw new Error('La clínica no tiene un horario válido configurado.');
  }
  // The scheduling API currently accepts weekdays only.
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
  if (weekday === 0 || weekday === 6) return [];
  const breakStart = timeInMinutes(rules.clinic_break_time);
  const breakDuration = timeInMinutes(rules.clinic_break_duration);
  const breakEnd =
    breakStart !== null && breakDuration !== null
      ? breakStart + breakDuration
      : null;
  const booked = bookings
    .filter(
      (item) =>
        options.excludeAppointmentId === undefined ||
        item.appointment_id !== options.excludeAppointmentId,
    )
    .map((item) => {
      const start = Date.parse(item.start_date_time);
      const end = item.end_date_time
        ? Date.parse(item.end_date_time)
        : start + duration * 60_000;
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        throw new Error(
          'No se pudo interpretar la disponibilidad. Inténtalo de nuevo.',
        );
      }
      return { start, end };
    });
  const now = options.now ?? Date.now();
  const currentStart = options.currentStart
    ? Date.parse(options.currentStart)
    : NaN;
  const slots: TimeSlot[] = [];
  for (let minute = opening; minute + duration <= closing; minute += duration) {
    const start = clinicDateTime(day, minute);
    const end = new Date(start.getTime() + duration * 60_000);
    let status: SlotStatus = 'available';
    if (
      booked.some(
        (item) => start.getTime() < item.end && end.getTime() > item.start,
      )
    )
      status = 'booked';
    else if (
      breakStart !== null &&
      breakEnd !== null &&
      minute < breakEnd &&
      minute + duration > breakStart
    )
      status = 'break';
    else if (start.getTime() <= now) status = 'past';
    else if (start.getTime() === currentStart) status = 'current';
    const label = (value: number) =>
      `${pad(Math.floor(value / 60))}:${pad(value % 60)}`;
    slots.push({
      id: start.toISOString(),
      start,
      end,
      label: `${label(minute)} - ${label(minute + duration)}`,
      status,
    });
  }
  return slots;
}
