import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import appointmentsApi from '../../api/appointments';
import apiClient from '../../api/client';
import { appointmentReminders, refreshAppointmentReminders } from './reminders/appointmentReminders';
import { DoctorAppointmentView } from '../../api/types';

export interface EditAppointmentForm {
  appointment_description: string;
}

export function useAppointmentDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const appointmentId = Number(id);

  const [appointment, setAppointment] = useState<DoctorAppointmentView | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<EditAppointmentForm>({
    defaultValues: {
      appointment_description: '',
    },
  });

  useEffect(() => {
    if (!appointmentId) return;
    let active = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await appointmentsApi.getPatientAppointments();
        const found = list.find((a) => a.appointment_id === appointmentId);
        if (active) {
          if (found) {
            setAppointment(found);
            reset({
              appointment_description: found.appointment_description || '',
            });
          } else {
            setError('No se encontró la cita especificada.');
          }
        }
      } catch (err: any) {
        if (active) setError(err.message || 'Error al cargar los datos de la cita');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [appointmentId, reset]);

  const onUpdate = async (data: EditAppointmentForm) => {
    if (!isDirty) {
      Alert.alert('Información', 'No has realizado cambios en la cita.');
      return;
    }

    Alert.alert(
      'Confirmar Modificación',
      '¿Deseas guardar los cambios realizados en las notas de tu cita?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Guardar Cambios',
          onPress: async () => {
            setUpdating(true);
            try {
              const sessionId = apiClient.getSessionId();
              await appointmentsApi.updateAppointment(appointmentId, {
                appointment_description: data.appointment_description.trim(),
              });
              if (sessionId !== apiClient.getSessionId()) return;
              await refreshAppointmentReminders();
              setAppointment((prev) =>
                prev
                  ? { ...prev, appointment_description: data.appointment_description.trim() }
                  : null
              );
              reset(data);
              Alert.alert('Éxito', 'Las notas de la cita se han actualizado correctamente.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudieron guardar los cambios.');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleCancelAppointment = () => {
    const doctorName = appointment
      ? `Dr(a). ${appointment.first_name} ${appointment.first_last_name}`
      : 'el médico';

    Alert.alert(
      'Confirmación de Cancelación',
      `¿Estás seguro de que deseas cancelar tu cita con ${doctorName}? Esta acción liberará el cupo y no se puede deshacer.`,
      [
        { text: 'No, conservar cita', style: 'cancel' },
        {
          text: 'Sí, Cancelar Cita',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              const sessionId = apiClient.getSessionId();
              await appointmentsApi.cancelAppointment(appointmentId);
              if (sessionId !== apiClient.getSessionId()) return;
              try {
                await appointmentReminders.cancelAppointment(appointmentId);
              } catch {
                Alert.alert('Cita cancelada', 'La cita se canceló, pero no se pudieron retirar sus avisos del teléfono. Vuelve a abrir la app para reintentar la sincronización.');
              }
              void refreshAppointmentReminders();
              Alert.alert('Cita Cancelada', 'Tu cita médica ha sido cancelada exitosamente.', [
                { text: 'Aceptar', onPress: () => router.replace('/appointments' as any) },
              ]);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo cancelar la cita.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  return {
    router,
    appointmentId,
    appointment,
    loading,
    updating,
    cancelling,
    error,
    control,
    handleSubmit,
    isDirty,
    onUpdate,
    handleCancelAppointment,
  };
}
