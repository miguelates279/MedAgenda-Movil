import type {
  AppointmentAvailability,
  AppointmentAvailabilityStatus,
  AppointmentSlot,
  ClinicScheduleRules,
  DoctorAppointmentView,
} from '../api/types';

export type SlotStatus = AppointmentAvailabilityStatus;
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
export const MINIMUM_ADVANCE_MINUTES = 60;

export interface AvailabilityClock {
  serverNow: number;
  receivedAt: number;
}

export function monotonicNow(): number {
  return globalThis.performance?.now() ?? Date.now();
}

export function createAvailabilityClock(
  serverNow: string,
  roundTripMilliseconds = 0,
  receivedAt = monotonicNow(),
): AvailabilityClock {
  const parsed = Date.parse(serverNow);
  if (!Number.isFinite(parsed) || !/(?:Z|[+-]\d{2}:\d{2})$/.test(serverNow))
    throw new Error('No se pudo comprobar la hora del servidor. Reintenta.');
  return {
    serverNow: parsed + Math.max(0, roundTripMilliseconds),
    receivedAt,
  };
}

export function availabilityNow(
  clock: AvailabilityClock,
  elapsedAt = monotonicNow(),
): number {
  return clock.serverNow + Math.max(0, elapsedAt - clock.receivedAt);
}

export function minimumAdvanceLabel(minutes: number): string {
  return minutes === 60 ? '1 hora' : `${minutes} minutos`;
}

export function slotStatusLabel(status: SlotStatus): string {
  const labels: Record<SlotStatus, string> = {
    available: 'Disponible',
    booked: 'Ocupado',
    break: 'Descanso',
    past: 'Hora pasada',
    too_soon: 'Fuera de plazo',
    unavailable: 'No disponible',
    current: 'Cita actual',
  };
  return labels[status];
}

export function currentAppointmentCapabilities(
  appointment: DoctorAppointmentView,
  now: number,
): DoctorAppointmentView {
  if (!Number.isFinite(now)) return appointment;
  const deadline = appointment.change_deadline
    ? Date.parse(appointment.change_deadline)
    : NaN;
  const expired = Number.isFinite(deadline) && now > deadline;
  return {
    ...appointment,
    can_reschedule: expired ? false : appointment.can_reschedule,
    can_edit_notes:
      now >= Date.parse(appointment.start_date_time)
        ? false
        : appointment.can_edit_notes,
    allowed_actions: expired
      ? appointment.allowed_actions?.filter((action) => action !== 'cancel')
      : appointment.allowed_actions,
  };
}

export function mapAvailabilitySlots(
  availability: AppointmentAvailability,
  now: number,
): TimeSlot[] {
  if (
    !Number.isFinite(now) ||
    availability.time_zone !== CLINIC_TIME_ZONE ||
    !Number.isInteger(availability.minimum_advance_minutes) ||
    availability.minimum_advance_minutes < MINIMUM_ADVANCE_MINUTES ||
    !Number.isInteger(availability.duration_minutes) ||
    availability.duration_minutes <= 0 ||
    !Array.isArray(availability.slots) ||
    ![null, 'closed', 'weekend'].includes(availability.unavailable_reason) ||
    (availability.unavailable_reason !== null && availability.slots.length > 0)
  )
    throw new Error('No se pudo interpretar la disponibilidad. Reintenta.');
  const timeLabel = (date: Date) =>
    date.toLocaleTimeString('es-CO', {
      timeZone: CLINIC_TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  const ids = new Set<string>();
  return availability.slots.map((item) => {
    const start = new Date(item.start_date_time);
    const end = new Date(item.end_date_time);
    const id = Number.isFinite(start.getTime()) ? start.toISOString() : '';
    if (
      !id ||
      ids.has(id) ||
      !Number.isFinite(end.getTime()) ||
      end.getTime() - start.getTime() !==
        availability.duration_minutes * 60_000 ||
      formatDateParam(start) !== availability.date ||
      ![
        'available',
        'booked',
        'break',
        'past',
        'too_soon',
        'unavailable',
        'current',
      ].includes(item.status)
    )
      throw new Error('No se pudo interpretar la disponibilidad. Reintenta.');
    ids.add(id);
    let status = item.status;
    if (status === 'available') {
      if (start.getTime() <= now) status = 'past';
      else if (
        start.getTime() - now <
        availability.minimum_advance_minutes * 60_000
      )
        status = 'too_soon';
    }
    return {
      id,
      start,
      end,
      label: `${timeLabel(start)} - ${timeLabel(end)}`,
      status,
    };
  });
}

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

export function buildAvailabilityCalendar(
  now: number,
  monthKey = '',
  dayKey = '',
) {
  const date = new Date(now);
  const months = buildMonths(date);
  const activeMonth =
    months.find((month) => month.key === monthKey) ?? months[0];
  const days = activeMonth ? buildDaysForMonth(activeMonth, date) : [];
  const selectedDayKey = days.some((day) => day.key === dayKey)
    ? dayKey
    : (days[0]?.key ?? '');
  return {
    months,
    days,
    selectedMonthKey: activeMonth?.key ?? '',
    selectedDayKey,
    selectedDate: days.find((day) => day.key === selectedDayKey)?.date ?? null,
  };
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
