import { useLocalSearchParams} from 'expo-router';
import AppointmentDetailScreen from '../../src/modules/appointments/AppointmentDetail';


export default function appointmentdetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const appointmentId = Number(id);

  return <AppointmentDetailScreen {appointment_id: appointmentId} />;

}
