import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import appointmentsApi from '../../src/api/appointments';
import { DoctorAppointmentView } from '../../src/api/types';
import { Badge, Button, Card, Field } from '../../src/components';

interface EditAppointmentForm {
  appointment_description: string;
}

export default function AppointmentDetailScreen() {
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
              await appointmentsApi.updateAppointment(appointmentId, {
                appointment_description: data.appointment_description.trim(),
              });
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
              await appointmentsApi.cancelAppointment(appointmentId);
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

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center p-6 bg-gray-50">
          <ActivityIndicator size="large" color="#259487" />
          <Text className="mt-3 text-sm text-gray-600">Cargando cita médica...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const startDate = appointment ? new Date(appointment.start_date_time) : null;
  const endDate = appointment ? new Date(appointment.end_date_time) : null;
  const isUpcoming = startDate ? startDate >= new Date() : false;

  const dateStr = startDate
    ? startDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const timeStr =
    startDate && endDate
      ? `${startDate.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        })} - ${endDate.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        })}`
      : '';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} className="py-1 pr-3" activeOpacity={0.7}>
            <Text className="text-primary text-sm font-semibold">← Volver</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-neutral-900 flex-1">Gestionar Cita</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {error ? (
            <View className="bg-red-50 border border-red-200 p-3 mb-4 rounded-md">
              <Text className="text-red-700 text-sm">{error}</Text>
            </View>
          ) : null}

          {appointment && (
            <>
              <Card className="mb-4">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-[15px] font-bold text-neutral-900">Detalles de la Consulta</Text>
                  <Badge
                    text={isUpcoming ? 'Programada' : 'Finalizada'}
                    variant={isUpcoming ? 'primary' : 'neutral'}
                  />
                </View>

                <View className="flex-row justify-between py-1.5 border-b border-gray-100">
                  <Text className="text-sm text-gray-600">Fecha:</Text>
                  <Text className="text-sm text-neutral-900 font-semibold capitalize flex-1 text-right ml-2">
                    {dateStr}
                  </Text>
                </View>

                <View className="flex-row justify-between py-1.5 border-b border-gray-100">
                  <Text className="text-sm text-gray-600">Horario:</Text>
                  <Text className="text-sm text-primary font-bold">{timeStr}</Text>
                </View>

                <View className="flex-row justify-between py-1.5 border-b border-gray-100">
                  <Text className="text-sm text-gray-600">Doctor:</Text>
                  <Text className="text-sm text-neutral-900 font-semibold flex-1 text-right ml-2">
                    Dr(a). {appointment.first_name} {appointment.first_last_name}
                  </Text>
                </View>

                <View className="flex-row justify-between py-1.5">
                  <Text className="text-sm text-gray-600">Clínica:</Text>
                  <Text className="text-sm text-neutral-900 font-semibold flex-1 text-right ml-2">
                    {appointment.clinic_name}
                  </Text>
                </View>
              </Card>

              <Card className="mb-4">
                <Text className="text-[15px] font-bold text-neutral-900 mb-1">Modificar Motivo / Notas</Text>
                <Text className="text-xs text-gray-600 mb-3 leading-4">
                  Edita la descripción o síntomas asociados a esta cita. Solo se guardarán los
                  campos modificados.
                </Text>

                <Field
                  control={control}
                  name="appointment_description"
                  label="Notas de la cita"
                  placeholder="Escribe aquí el motivo o consulta..."
                  multiline
                  numberOfLines={4}
                />

                <Button
                  text={updating ? 'Guardando...' : 'Guardar Modificación'}
                  onPress={handleSubmit(onUpdate)}
                  disabled={!isDirty || updating}
                  loading={updating}
                  className="mt-2"
                />
              </Card>

              {isUpcoming && (
                <Card className="mb-4 border-red-200 bg-red-50/40">
                  <Text className="text-[15px] font-bold text-red-800 mb-1">Cancelar Cita Médica</Text>
                  <Text className="text-xs text-gray-600 mb-3 leading-4">
                    Si no puedes asistir a tu cita, puedes cancelarla para que otro paciente
                    pueda utilizar el horario.
                  </Text>

                  <Button
                    text={cancelling ? 'Cancelando...' : 'Cancelar Cita'}
                    variant="danger"
                    onPress={handleCancelAppointment}
                    loading={cancelling}
                    disabled={cancelling}
                    className="mt-1"
                  />
                </Card>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
