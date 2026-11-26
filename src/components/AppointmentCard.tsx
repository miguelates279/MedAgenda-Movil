import React from 'react';
import { Text, View } from 'react-native';
import { DoctorAppointmentView } from '../api/types';
import Card from './Card';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';
import { CLINIC_TIME_ZONE } from '../utils/appointmentAvailability';

export interface AppointmentCardProps {
  appointment: DoctorAppointmentView;
  className?: string;
  onPress?: () => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  className = '',
  onPress,
}) => {
  const startDate = new Date(appointment.start_date_time);
  const endDate = new Date(appointment.end_date_time);

  const dateStr = startDate.toLocaleDateString('es-ES', {
    timeZone: CLINIC_TIME_ZONE,
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const timeStr = `${startDate.toLocaleTimeString('es-ES', {
    timeZone: CLINIC_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  })} - ${endDate.toLocaleTimeString('es-ES', {
    timeZone: CLINIC_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  const doctorName = `Dr(a). ${appointment.first_name} ${appointment.first_last_name}`;

  return (
    <Card onPress={onPress} className={`mb-3 ${className}`}>
      <View className="flex-row flex-wrap gap-2 justify-between items-start">
        <View className="flex-1 min-w-0">
          <Text className="text-sm font-bold text-med-text-main capitalize">
            {dateStr}
          </Text>
          <Text className="text-xs text-med-primary font-semibold mt-0.5">
            {timeStr}
          </Text>
        </View>
        <AppointmentStatusBadge appointment={appointment} />
      </View>

      <View className="border-t border-med-border-light my-2.5" />

      <Text className="text-sm font-semibold text-med-text-main mb-1">
        {doctorName}
      </Text>
      <Text className="text-sm text-med-text-muted mb-1">
        {appointment.clinic_name}
      </Text>

      {appointment.appointment_description ? (
        <Text
          className="text-xs text-med-text-muted mt-1 italic"
          numberOfLines={2}
        >
          {appointment.appointment_description}
        </Text>
      ) : null}

      <View className="mt-2.5 pt-2 border-t border-med-border-light items-end">
        <Text className="text-xs font-semibold text-med-primary">
          Ver detalles / Gestionar
        </Text>
      </View>
    </Card>
  );
};

export default AppointmentCard;
