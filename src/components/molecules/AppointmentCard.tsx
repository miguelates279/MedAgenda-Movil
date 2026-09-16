import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DoctorAppointmentView } from '../../api/types';
import Card from '../atoms/Card';
import Badge from '../atoms/Badge';

export interface AppointmentCardProps {
  appointment: DoctorAppointmentView;
  onPress?: () => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
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
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.dateBlock}>
          <Text style={styles.dateText}>{dateStr}</Text>
          <Text style={styles.timeText}>{timeStr}</Text>
        </View>
        <Badge
          text={isUpcoming ? 'Programada' : 'Finalizada'}
          variant={isUpcoming ? 'primary' : 'neutral'}
        />
      </View>

      <View style={styles.divider} />

      <Text style={styles.doctorText}>👨‍⚕️ {doctorName}</Text>
      <Text style={styles.clinicText}>🏥 {appointment.clinic_name}</Text>

      {appointment.appointment_description ? (
        <Text style={styles.descText} numberOfLines={2}>
          📝 {appointment.appointment_description}
        </Text>
      ) : null}

      <View style={styles.cardActions}>
        <Text style={styles.detailsLink}>Ver detalles / Gestionar →</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dateBlock: {
    flex: 1,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171717',
    textTransform: 'capitalize',
  },
  timeText: {
    fontSize: 13,
    color: '#259487',
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 10,
  },
  doctorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 4,
  },
  clinicText: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 4,
  },
  descText: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 4,
    fontStyle: 'italic',
  },
  cardActions: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    alignItems: 'flex-end',
  },
  detailsLink: {
    fontSize: 13,
    color: '#259487',
    fontWeight: '600',
  },
});

export default AppointmentCard;
