import type {
  AppointmentAction,
  AppointmentStatus,
  DoctorAppointmentView,
} from '../api/types';
import type { BadgeVariant } from '../components/Badge';
import { CLINIC_TIME_ZONE, formatDateParam } from './appointmentAvailability';

const states: Record<
  AppointmentStatus,
  { label: string; variant: BadgeVariant }
> = {
  scheduled: { label: 'Programada', variant: 'info' },
  confirmed: { label: 'Confirmada', variant: 'success' },
  waiting: { label: 'En sala de espera', variant: 'warning' },
  called: { label: 'Llamada a consulta', variant: 'info' },
  in_progress: { label: 'En consulta', variant: 'info' },
  completed: { label: 'Atendida', variant: 'success' },
  cancelled: { label: 'Cancelada', variant: 'neutral' },
  no_show: { label: 'No asistió', variant: 'error' },
};

export const appointmentActionLabels: Record<AppointmentAction, string> = {
  confirm: 'Confirmar asistencia',
  check_in: 'Registrar llegada',
  call: 'Llamar a consulta',
  start: 'Atender',
  complete: 'Finalizar atención',
  no_show: 'Marcar no asistió',
  cancel: 'Cancelar cita',
};

export type AppointmentActionView = 'patient' | 'doctor' | 'reception';

const viewActions: Record<AppointmentActionView, readonly AppointmentAction[]> =
  {
    patient: ['confirm', 'check_in', 'cancel'],
    doctor: ['call', 'start', 'complete', 'no_show'],
    reception: ['confirm', 'check_in', 'call', 'no_show', 'cancel'],
  };

export function appointmentActionsForView(
  allowedActions: readonly AppointmentAction[] | undefined,
  view: AppointmentActionView,
): AppointmentAction[] {
  return (allowedActions ?? []).filter((action) =>
    viewActions[view].includes(action),
  );
}

export function appointmentStatusPresentation(
  appointment: DoctorAppointmentView,
  now = Date.now(),
) {
  const status = appointment.appointment_status;
  if (!status || !states[status])
    return { label: 'Estado no disponible', variant: 'neutral' as const };
  if (
    status === 'scheduled' &&
    !appointment.status_updated_at &&
    Date.parse(appointment.end_date_time) < now
  ) {
    return { label: 'Sin cierre registrado', variant: 'neutral' as const };
  }
  return states[status];
}

export function isAppointmentActive(
  appointment: Pick<DoctorAppointmentView, 'appointment_status'>,
): boolean {
  return !['completed', 'cancelled', 'no_show'].includes(
    appointment.appointment_status ?? '',
  );
}

export function isAppointmentUpcoming(
  appointment: DoctorAppointmentView,
  now = Date.now(),
): boolean {
  if (!isAppointmentActive(appointment)) return false;
  const start = Date.parse(appointment.start_date_time);
  if (!Number.isFinite(start)) return false;
  if (appointment.appointment_status === 'in_progress') return true;
  return (
    start >= now ||
    formatDateParam(new Date(start)) === formatDateParam(new Date(now))
  );
}

export function appointmentPatientName(
  appointment: DoctorAppointmentView,
): string {
  return (
    [
      appointment.first_name,
      appointment.second_name,
      appointment.first_last_name,
      appointment.second_last_name,
    ]
      .filter(Boolean)
      .join(' ')
      .trim() || 'Paciente'
  );
}

export function groupAppointmentsByHour(appointments: DoctorAppointmentView[]) {
  const groups = new Map<string, DoctorAppointmentView[]>();
  [...appointments]
    .sort(
      (a, b) => Date.parse(a.start_date_time) - Date.parse(b.start_date_time),
    )
    .forEach((appointment) => {
      const start = new Date(appointment.start_date_time);
      const hour = Number.isFinite(start.getTime())
        ? `${start.toLocaleTimeString('es-CO', { timeZone: CLINIC_TIME_ZONE, hour: '2-digit', hourCycle: 'h23' })}:00`
        : 'Sin horario';
      const group = groups.get(hour);
      if (group) group.push(appointment);
      else groups.set(hour, [appointment]);
    });
  return [...groups].map(([title, data]) => ({ title, data }));
}
