import React from 'react';
import { Text, View } from 'react-native';
import type { AppointmentAction, DoctorAppointmentView } from '../api/types';
import { appointmentPatientName } from '../utils/appointmentStatus';
import {
  CLINIC_TIME_ZONE,
  formatDateParam,
} from '../utils/appointmentAvailability';
import { Card } from './Card';
import { Button } from './Button';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';
import { AppointmentActions } from './AppointmentActions';

export function AppointmentDispatchCard({
  appointment,
  pendingAction,
  disabled,
  showDoctor,
  onAction,
  onPrescribe,
}: {
  appointment: DoctorAppointmentView;
  pendingAction?: AppointmentAction | null;
  disabled?: boolean;
  showDoctor?: boolean;
  onAction: (action: AppointmentAction) => void;
  onPrescribe?: () => void;
}) {
  const start = new Date(appointment.start_date_time);
  const end = new Date(appointment.end_date_time);
  const anotherDay =
    Number.isFinite(start.getTime()) &&
    formatDateParam(start) !== formatDateParam(new Date());
  const time = (date: Date) =>
    Number.isFinite(date.getTime())
      ? date.toLocaleTimeString('es-CO', {
          timeZone: CLINIC_TIME_ZONE,
          hour: '2-digit',
          minute: '2-digit',
          hourCycle: 'h23',
        })
      : 'Sin horario';
  const doctor = [
    appointment.doctor_first_name,
    appointment.doctor_second_name,
    appointment.doctor_first_last_name,
    appointment.doctor_second_last_name,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <Card className="mb-3 border-l-4 border-l-med-primary">
      {anotherDay ? (
        <Text className="text-xs text-med-text-muted mb-2">
          {start.toLocaleDateString('es-CO', {
            timeZone: CLINIC_TIME_ZONE,
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </Text>
      ) : null}
      <View className="flex-row flex-wrap gap-2 justify-between items-start mb-2">
        <Text className="min-w-0 max-w-full shrink text-sm font-bold text-med-primary-dark">
          {time(start)} – {time(end)}
        </Text>
        <AppointmentStatusBadge appointment={appointment} />
      </View>
      <Text className="text-base font-bold text-med-text-main">
        {appointmentPatientName(appointment)}
      </Text>
      <Text className="text-sm text-med-text-muted mt-1">
        {appointment.clinic_name}
      </Text>
      {showDoctor && doctor ? (
        <Text className="text-sm text-med-text-muted mt-1">
          Dr(a). {doctor}
        </Text>
      ) : null}
      {appointment.appointment_description ? (
        <Text className="text-sm text-med-text-muted mt-2">
          Motivo: {appointment.appointment_description}
        </Text>
      ) : null}
      <AppointmentActions
        appointment={appointment}
        view={showDoctor ? 'reception' : 'doctor'}
        pendingAction={pendingAction}
        disabled={disabled}
        onAction={onAction}
      />
      {onPrescribe &&
      appointment.appointment_status === 'in_progress' &&
      appointment.patient_id ? (
        <Button
          text="Emitir receta"
          variant="outline"
          onPress={onPrescribe}
          disabled={disabled || !!pendingAction}
          className="mt-2"
        />
      ) : null}
    </Card>
  );
}
