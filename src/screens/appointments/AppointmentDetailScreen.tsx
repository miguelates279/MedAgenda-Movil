import React from 'react';
import { ActivityIndicator, RefreshControl, Text, View } from 'react-native';
import {
  Button,
  Card,
  Field,
  KeyboardAwareScrollView,
  ScreenHeader,
} from '../../components';
import { useAppointmentDetail } from './useAppointmentDetail';
import { RescheduleAppointmentModal } from './components/RescheduleAppointmentModal';
import {
  CLINIC_TIME_ZONE,
  formatAppointmentDate,
  minimumAdvanceLabel,
} from '../../utils/appointmentAvailability';
import { ClaySurface } from '../../components/ClaySurface';
import { tokens } from '../../theme/tokens';
import { AppointmentStatusBadge } from '../../components/AppointmentStatusBadge';
import { AppointmentActions } from '../../components/AppointmentActions';

export function AppointmentDetailScreen() {
  const {
    appointment,
    loading,
    updating,
    pending,
    requestAction,
    loadAppointment,
    error,
    control,
    handleSubmit,
    isDirty,
    onUpdate,
    rescheduleVisible,
    handleOpenReschedule,
    closeReschedule,
    onRescheduled,
  } = useAppointmentDetail();

  if (loading && !appointment) {
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

      <KeyboardAwareScrollView
        contentContainerClassName="p-4 pb-16"
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              void loadAppointment();
            }}
            tintColor={tokens.colors.primary}
          />
        }
      >
        {error ? (
          <ClaySurface className="bg-med-error-bg border border-med-error-border p-3 mb-4 rounded-clay">
            <Text className="text-med-error-badge-text text-sm">{error}</Text>
            <Button
              text="Actualizar cita"
              variant="outline"
              onPress={() => {
                void loadAppointment();
              }}
              className="mt-2"
            />
          </ClaySurface>
        ) : null}

        {appointment && (
          <>
            <Card className="mb-4">
              <View className="flex-row flex-wrap gap-2 justify-between items-center mb-3">
                <Text className="min-w-0 max-w-full shrink text-sm font-bold text-med-text-main">
                  Detalles de la Consulta
                </Text>
                <AppointmentStatusBadge appointment={appointment} />
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
              {appointment.appointment_description ? (
                <Text className="text-sm text-med-text-muted mt-3">
                  Motivo: {appointment.appointment_description}
                </Text>
              ) : null}
              {appointment.minimum_advance_minutes !== undefined && (
                <View className="mt-3">
                  <Text className="text-xs text-med-text-muted">
                    Cancelaciones y cambios de horario requieren al menos{' '}
                    {minimumAdvanceLabel(appointment.minimum_advance_minutes)}{' '}
                    de anticipación.
                  </Text>
                  {appointment.change_deadline && (
                    <Text className="text-xs text-med-text-muted mt-2">
                      Plazo para cambiar o cancelar:{' '}
                      {formatAppointmentDate(appointment.change_deadline)}{' '}
                      (Colombia).
                    </Text>
                  )}
                </View>
              )}
              <AppointmentActions
                appointment={appointment}
                view="patient"
                pendingAction={pending?.action}
                disabled={updating || loading}
                onAction={(action) => requestAction(appointment, action)}
              />
            </Card>

            {appointment.can_edit_notes && (
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
                  disabled={!isDirty || updating || !!pending || loading}
                  loading={updating}
                  className="mt-2"
                />
              </Card>
            )}

            {appointment.can_reschedule && (
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
                  disabled={updating || !!pending || loading}
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
