import React from 'react';
import { Text, View } from 'react-native';
import { DoctorAppointmentView } from '../../api/types';
import Card from '../atoms/Card';
import Badge from '../atoms/Badge';

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
  const isUpcoming = startDate >= new Date();

  const dateStr = startDate.toLocaleDateString('es-ES', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const timeStr = `${startDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })} - ${endDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  const doctorName = `Dr(a). ${appointment.first_name} ${appointment.first_last_name}`;

  return (
    <Card onPress={onPress} className={`mb-3 ${className}`}>
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-[15px] font-bold text-neutral-900 capitalize">{dateStr}</Text>
          <Text className="text-xs text-primary font-semibold mt-0.5">{timeStr}</Text>
        </View>
        <Badge
          text={isUpcoming ? 'Programada' : 'Finalizada'}
          variant={isUpcoming ? 'primary' : 'neutral'}
        />
      </View>

      <View className="h-[1px] bg-gray-100 my-2.5" />

      <Text className="text-sm font-semibold text-neutral-900 mb-1">👨‍⚕️ {doctorName}</Text>
      <Text className="text-sm text-gray-600 mb-1">🏥 {appointment.clinic_name}</Text>

      {appointment.appointment_description ? (
        <Text className="text-xs text-gray-600 mt-1 italic" numberOfLines={2}>
          📝 {appointment.appointment_description}
        </Text>
      ) : null}

      <View className="mt-2.5 pt-2 border-t border-gray-100 items-end">
        <Text className="text-xs font-semibold text-primary">Ver detalles / Gestionar →</Text>
      </View>
    </Card>
  );
};

export default AppointmentCard;
