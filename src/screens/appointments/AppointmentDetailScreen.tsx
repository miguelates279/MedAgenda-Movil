import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Badge, Button, Card, Field, ScreenHeader } from '../../components';
import { useAppointmentDetail } from './useAppointmentDetail';

export function AppointmentDetailScreen() {
  const {
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
  } = useAppointmentDetail();

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
        <ScreenHeader title="Gestionar Cita" />

        <ScrollView contentContainerClassName="p-4 pb-10">
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

export default AppointmentDetailScreen;
