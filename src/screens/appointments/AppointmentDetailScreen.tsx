import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import {
  Badge,
  Button,
  Card,
  Field,
  KeyboardAwareScrollView,
  ScreenHeader,
} from '../../components';
import { useAppointmentDetail } from './useAppointmentDetail';
import { RescheduleAppointmentModal } from './components/RescheduleAppointmentModal';
import { CLINIC_TIME_ZONE } from '../../utils/appointmentAvailability';
import { ClaySurface } from '../../components/ClaySurface';
import { tokens } from '../../theme/tokens';

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
    rescheduleVisible,
    handleOpenReschedule,
    closeReschedule,
    onRescheduled,
  } = useAppointmentDetail();

  if (loading) {
    return (
      <View className="min-w-0 max-w-full flex-1 bg-med-bg">
        <View className="min-w-0 max-w-full flex-1 items-center justify-center p-6 bg-med-surface">
          <ActivityIndicator
            size={tokens.indicator.lg}
            color={tokens.colors.primary}
          />
          <Text className="mt-3 text-sm text-med-text-muted">
            Cargando cita médica...
          </Text>
        </View>
      </View>
    );
  }

  const startDate = appointment ? new Date(appointment.start_date_time) : null;
  const endDate = appointment ? new Date(appointment.end_date_time) : null;
  const isUpcoming = startDate ? startDate >= new Date() : false;

  const dateStr = startDate
    ? startDate.toLocaleDateString('es-ES', {
        timeZone: CLINIC_TIME_ZONE,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const timeStr =
    startDate && endDate
      ? `${startDate.toLocaleTimeString('es-ES', {
          timeZone: CLINIC_TIME_ZONE,
          hour: '2-digit',
          minute: '2-digit',
        })} - ${endDate.toLocaleTimeString('es-ES', {
          timeZone: CLINIC_TIME_ZONE,
          hour: '2-digit',
          minute: '2-digit',
        })}`
      : '';

  return (
    <View className="min-w-0 max-w-full flex-1 bg-med-bg">
      <ScreenHeader title="Gestionar Cita" />

      <KeyboardAwareScrollView contentContainerClassName="p-4 pb-16">
        {error ? (
          <ClaySurface className="bg-med-error-bg border border-med-error-border p-3 mb-4 rounded-clay">
            <Text className="text-med-error-badge-text text-sm">{error}</Text>
          </ClaySurface>
        ) : null}

        {appointment && (
          <>
            <Card className="mb-4">
              <View className="flex-row flex-wrap gap-2 justify-between items-center mb-3">
                <Text className="min-w-0 max-w-full shrink text-sm font-bold text-med-text-main">
                  Detalles de la Consulta
                </Text>
                <Badge
                  text={isUpcoming ? 'Programada' : 'Finalizada'}
                  variant={isUpcoming ? 'primary' : 'neutral'}
                />
              </View>

              <View className="flex-row flex-wrap gap-x-3 gap-y-1 justify-between py-1.5 border-b border-med-border-light">
                <Text className="min-w-0 max-w-full shrink text-sm text-med-text-muted">
                  Fecha:
                </Text>
                <Text
                  className="shrink text-sm text-med-text-main font-semibold capitalize grow min-w-0 max-w-full text-right"
                  style={{ flexBasis: tokens.layout.cardMinWidth }}
                >
                  {dateStr}
                </Text>
              </View>

              <View className="flex-row flex-wrap gap-x-3 gap-y-1 justify-between py-1.5 border-b border-med-border-light">
                <Text className="min-w-0 max-w-full shrink text-sm text-med-text-muted">
                  Horario (Colombia):
                </Text>
                <Text
                  className="shrink text-sm text-med-primary font-bold grow min-w-0 max-w-full text-right"
                  style={{ flexBasis: tokens.layout.cardMinWidth }}
                >
                  {timeStr}
                </Text>
              </View>

              <View className="flex-row flex-wrap gap-x-3 gap-y-1 justify-between py-1.5 border-b border-med-border-light">
                <Text className="min-w-0 max-w-full shrink text-sm text-med-text-muted">
                  Doctor:
                </Text>
                <Text
                  className="shrink text-sm text-med-text-main font-semibold grow min-w-0 max-w-full text-right"
                  style={{ flexBasis: tokens.layout.cardMinWidth }}
                >
                  Dr(a). {appointment.first_name} {appointment.first_last_name}
                </Text>
              </View>

              <View className="flex-row flex-wrap gap-x-3 gap-y-1 justify-between py-1.5">
                <Text className="min-w-0 max-w-full shrink text-sm text-med-text-muted">
                  Clínica:
                </Text>
                <Text
                  className="shrink text-sm text-med-text-main font-semibold grow min-w-0 max-w-full text-right"
                  style={{ flexBasis: tokens.layout.cardMinWidth }}
                >
                  {appointment.clinic_name}
                </Text>
              </View>
            </Card>

            <Card className="mb-4">
              <Text className="text-sm font-bold text-med-text-main mb-1">
                Modificar Motivo / Notas
              </Text>
              <Text className="text-xs text-med-text-muted mb-3 leading-4">
                Edita la descripción o síntomas asociados a esta cita. Solo se
                guardarán los campos modificados.
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
                disabled={!isDirty || updating || cancelling}
                loading={updating}
                className="mt-2"
              />
            </Card>

            {isUpcoming && (
              <Card className="mb-4 border-med-primary-border-strong bg-med-primary-surface/40">
                <Text className="text-sm font-bold text-med-primary-dark mb-1">
                  Cambiar fecha u hora
                </Text>
                <Text className="text-xs text-med-text-muted mb-3 leading-4">
                  Consulta los horarios disponibles y elige cuándo asistir con
                  el mismo médico.
                </Text>
                <Button
                  text="Reprogramar cita"
                  onPress={handleOpenReschedule}
                  disabled={updating || cancelling}
                />
              </Card>
            )}

            {isUpcoming && (
              <Card className="mb-4 border-med-error-border bg-med-error-bg/40">
                <Text className="text-sm font-bold text-med-error-text mb-1">
                  Cancelar Cita Médica
                </Text>
                <Text className="text-xs text-med-text-muted mb-3 leading-4">
                  Si no puedes asistir a tu cita, puedes cancelarla para que
                  otro paciente pueda utilizar el horario.
                </Text>

                <Button
                  text={cancelling ? 'Cancelando...' : 'Cancelar Cita'}
                  variant="danger"
                  onPress={handleCancelAppointment}
                  loading={cancelling}
                  disabled={cancelling || updating}
                  className="mt-1"
                />
              </Card>
            )}
          </>
        )}
      </KeyboardAwareScrollView>
      {appointment && rescheduleVisible && (
        <RescheduleAppointmentModal
          appointment={appointment}
          onComplete={onRescheduled}
          onDismiss={closeReschedule}
        />
      )}
    </View>
  );
}

export default AppointmentDetailScreen;
